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

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.usuario.findMany({
      where: filtroUsuarios(solicitante),
      include: INCLUDE_USUARIO,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id_usuario: id, deletado_em: null },
      include: INCLUDE_USUARIO,
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
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

    if (dto.senha && dto.senha !== dto.confirmacao_senha) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const dados: any = { data_atualizacao: new Date() };

    if (dto.nome) dados.nome = dto.nome;
    if (dto.email) dados.email = dto.email;
    if (dto.id_role) dados.id_role = dto.id_role;
    if (dto.id_nivel) dados.id_nivel = dto.id_nivel;
    if (dto.relacao !== undefined) dados.relacao = dto.relacao;
    if (dto.senha) dados.senha = await bcrypt.hash(dto.senha, 10);

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
    const where: any = { ...filtroUsuarios(solicitante) };

    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };
    if (dto.email) where.email = { contains: dto.email, mode: 'insensitive' };
    if (dto.id_role) where.id_role = dto.id_role;
    if (dto.id_nivel) where.id_nivel = dto.id_nivel;

    return this.prisma.usuario.findMany({
      where,
      include: INCLUDE_USUARIO,
      orderBy: { nome: 'asc' },
    });
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
