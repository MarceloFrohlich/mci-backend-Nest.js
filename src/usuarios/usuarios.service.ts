import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import {
  exigirNivel,
  filtroUsuarios,
  isAdminGlobal,
  NIVEL_FRANQUEADORA,
  relacaoNaCadeia,
  ROLE_ADMIN_GLOBAL,
} from '../common/utils/permissoes.util';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { FiltrarUsuarioDto } from './dto/filtrar-usuario.dto';

const INCLUDE_USUARIO = { role: true, nivel: true };

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  private async resolverRelacoes<T extends { relacao: string | null; id_nivel: number }>(
    usuarios: T[],
  ): Promise<(T & { entidade_relacao: object | null })[]> {
    const ids = (nivel: number) =>
      usuarios.filter((u) => u.id_nivel === nivel && u.relacao).map((u) => u.relacao as string);

    const [franqueadoras, filiais, departamentos] = await Promise.all([
      ids(1).length
        ? this.prisma.franqueadora.findMany({ where: { id_franqueadora: { in: ids(1) } } })
        : [],
      ids(2).length
        ? this.prisma.filial.findMany({
            where: { id_filial: { in: ids(2) } },
            include: { franqueadora: true },
          })
        : [],
      ids(3).length
        ? this.prisma.departamento.findMany({
            where: { id_departamento: { in: ids(3) } },
            include: { filial: { include: { franqueadora: true } } },
          })
        : [],
    ]);

    const mapF = Object.fromEntries(franqueadoras.map((f) => [f.id_franqueadora, f]));
    const mapFi = Object.fromEntries(filiais.map((f) => [f.id_filial, f]));
    const mapD = Object.fromEntries(departamentos.map((d) => [d.id_departamento, d]));

    return usuarios.map((u) => ({
      ...u,
      entidade_relacao:
        u.id_nivel === 1 ? (mapF[u.relacao!] ?? null)
        : u.id_nivel === 2 ? (mapFi[u.relacao!] ?? null)
        : u.id_nivel === 3 ? (mapD[u.relacao!] ?? null)
        : null,
    }));
  }

  async listar(solicitante: UsuarioAutenticado) {
    const usuarios = await this.prisma.usuario.findMany({
      where: await filtroUsuarios(solicitante, this.prisma),
      include: INCLUDE_USUARIO,
      orderBy: { nome: 'asc' },
    });
    return this.resolverRelacoes(usuarios);
  }

  // Contas admin global são de sistema (seed): ninguém cria nem promove via API.
  // Admin local só cria/edita usuários dentro da própria cadeia.
  private async validarAlvo(
    solicitante: UsuarioAutenticado,
    idRole: number,
    idNivel: number,
    relacao: string | null,
  ) {
    if (idRole === ROLE_ADMIN_GLOBAL) {
      throw new ForbiddenException('Usuários admin global não são gerenciados pelo sistema');
    }

    if (isAdminGlobal(solicitante)) return;

    if (!(await relacaoNaCadeia(solicitante, idNivel, relacao, this.prisma))) {
      throw new ForbiddenException('O vínculo do usuário deve pertencer à sua cadeia');
    }
  }

  async buscarPorId(id: string, solicitante: UsuarioAutenticado) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        AND: [{ id_usuario: id, deletado_em: null }, await filtroUsuarios(solicitante, this.prisma)],
      },
      include: INCLUDE_USUARIO,
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    const [enriquecido] = await this.resolverRelacoes([usuario]);
    return enriquecido;
  }

  async criar(dto: CriarUsuarioDto, solicitante: UsuarioAutenticado) {
    exigirNivel(solicitante, [NIVEL_FRANQUEADORA]);

    const viaConvite = !dto.senha;

    if (!viaConvite && dto.senha !== dto.confirmacao_senha) {
      throw new BadRequestException('As senhas não coincidem');
    }

    await this.validarAlvo(solicitante, dto.id_role, dto.id_nivel, dto.relacao ?? null);

    const existe = await this.prisma.usuario.findFirst({
      where: { email: dto.email, deletado_em: null },
    });
    if (existe) throw new ConflictException('E-mail já cadastrado');

    // sem senha informada, gera uma aleatória indecifrável: o acesso só nasce
    // quando o usuário define a própria senha pelo link do convite
    const senhaHash = await bcrypt.hash(dto.senha ?? randomBytes(32).toString('hex'), 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        id_role: dto.id_role,
        id_nivel: dto.id_nivel,
        relacao: dto.relacao ?? null,
      },
      include: INCLUDE_USUARIO,
    });

    if (viaConvite) {
      try {
        await this.enviarConvite(usuario.id_usuario, usuario.email, usuario.nome);
      } catch {
        // usuário criado mesmo assim; o admin pode reenviar o convite pela listagem
      }
    }

    return usuario;
  }

  async reenviarConvite(id: string, solicitante: UsuarioAutenticado) {
    exigirNivel(solicitante, [NIVEL_FRANQUEADORA]);
    const alvo = await this.buscarPorId(id, solicitante);

    try {
      await this.enviarConvite(alvo.id_usuario, alvo.email, alvo.nome);
    } catch {
      throw new BadRequestException('Não foi possível enviar o e-mail do convite. Tente novamente.');
    }

    return { mensagem: 'Convite enviado com sucesso' };
  }

  // token de uso único válido por 2 dias; invalida convites/códigos anteriores
  private async enviarConvite(idUsuario: string, email: string, nome: string) {
    const codigo = randomBytes(24).toString('hex');
    const expiraEm = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    await this.prisma.tokenRecuperacaoSenha.updateMany({
      where: { id_usuario: idUsuario, usado_em: null },
      data: { usado_em: new Date() },
    });

    await this.prisma.tokenRecuperacaoSenha.create({
      data: { id_usuario: idUsuario, codigo, expira_em: expiraEm },
    });

    const link = `${process.env.FRONT_URL}/definir-senha?email=${encodeURIComponent(email)}&codigo=${codigo}`;

    await this.mailer.enviarConvite(email, nome, link);
  }

  async atualizar(id: string, dto: AtualizarUsuarioDto, solicitante: UsuarioAutenticado) {
    exigirNivel(solicitante, [NIVEL_FRANQUEADORA]);
    const alvo = await this.buscarPorId(id, solicitante);

    if (!isAdminGlobal(solicitante) && alvo.id_role === ROLE_ADMIN_GLOBAL) {
      throw new ForbiddenException('Apenas o admin global pode gerenciar usuários admin global');
    }

    await this.validarAlvo(
      solicitante,
      dto.id_role ?? alvo.id_role,
      dto.id_nivel ?? alvo.id_nivel,
      dto.relacao !== undefined ? dto.relacao : alvo.relacao,
    );

    const dados: any = { data_atualizacao: new Date() };

    if (dto.nome) dados.nome = dto.nome;
    if (dto.email) dados.email = dto.email;
    if (dto.id_role) dados.id_role = dto.id_role;
    if (dto.id_nivel) dados.id_nivel = dto.id_nivel;
    if (dto.relacao !== undefined) dados.relacao = dto.relacao;

    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data: dados,
      include: INCLUDE_USUARIO,
    });
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    exigirNivel(solicitante, [NIVEL_FRANQUEADORA]);
    const alvo = await this.buscarPorId(id, solicitante);

    if (!isAdminGlobal(solicitante) && alvo.id_role === ROLE_ADMIN_GLOBAL) {
      throw new ForbiddenException('Apenas o admin global pode gerenciar usuários admin global');
    }

    const sufixo = `_deletado_${Date.now()}`;
    return this.prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        deletado_em: new Date(),
        email: `email_deletado_${id}${sufixo}`,
        data_atualizacao: new Date(),
      },
    });
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarUsuarioDto) {
    const where: any = { ...(await filtroUsuarios(solicitante, this.prisma)) };

    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };
    if (dto.email) where.email = { contains: dto.email, mode: 'insensitive' };
    if (dto.id_role) where.id_role = dto.id_role;
    if (dto.id_nivel) where.id_nivel = dto.id_nivel;

    const usuarios = await this.prisma.usuario.findMany({
      where,
      include: INCLUDE_USUARIO,
      orderBy: { nome: 'asc' },
    });
    return this.resolverRelacoes(usuarios);
  }

  async dadosFormulario() {
    const [roles, niveis, franqueadoras, filiais, departamentos] = await Promise.all([
      this.prisma.role.findMany(),
      this.prisma.nivelUsuario.findMany(),
      this.prisma.franqueadora.findMany({ where: { deletado_em: null }, orderBy: { nome: 'asc' } }),
      this.prisma.filial.findMany({
        where: { deletado_em: null },
        include: { franqueadora: true },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.departamento.findMany({
        where: { deletado_em: null },
        include: { filial: { include: { franqueadora: true } } },
        orderBy: { nome: 'asc' },
      }),
    ]);

    return { roles, niveis, franqueadoras, filiais, departamentos };
  }
}
