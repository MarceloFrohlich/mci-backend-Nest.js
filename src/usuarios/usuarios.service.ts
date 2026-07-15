import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroUsuarios } from '../common/utils/permissoes.util';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { FiltrarUsuarioDto } from './dto/filtrar-usuario.dto';

const INCLUDE_USUARIO = { role: true, nivel: true };

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

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

  async buscarPorId(id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id_usuario: id, deletado_em: null },
      include: INCLUDE_USUARIO,
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    const [enriquecido] = await this.resolverRelacoes([usuario]);
    return enriquecido;
  }

  async criar(dto: CriarUsuarioDto) {
    if (dto.senha !== dto.confirmacao_senha) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const existe = await this.prisma.usuario.findFirst({
      where: { email: dto.email, deletado_em: null },
    });
    if (existe) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    return this.prisma.usuario.create({
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
  }

  async atualizar(id: string, dto: AtualizarUsuarioDto) {
    await this.buscarPorId(id);

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

  async remover(id: string) {
    await this.buscarPorId(id);

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
