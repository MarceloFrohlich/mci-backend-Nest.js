import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroLideres, isAdminGlobal, NIVEL_FRANQUEADORA } from '../common/utils/permissoes.util';
import { CriarLiderDto, AtualizarLiderDto, FiltrarLiderDto } from './dto/lider.dto';

const INCLUDE_LIDER = { franqueadora: true };

@Injectable()
export class LideresService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.lider.findMany({
      where: filtroLideres(solicitante),
      include: INCLUDE_LIDER,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const lider = await this.prisma.lider.findFirst({
      where: { id_lider: id, deletado_em: null },
      include: INCLUDE_LIDER,
    });
    if (!lider) throw new NotFoundException('Líder não encontrado');
    return lider;
  }

  async criar(dto: CriarLiderDto, solicitante: UsuarioAutenticado) {
    const idFranqueadora =
      isAdminGlobal(solicitante)
        ? null
        : solicitante.id_nivel === NIVEL_FRANQUEADORA
          ? solicitante.relacao
          : null;

    return this.prisma.lider.create({
      data: { nome: dto.nome, id_franqueadora: idFranqueadora },
      include: INCLUDE_LIDER,
    });
  }

  async atualizar(id: string, dto: AtualizarLiderDto) {
    await this.buscarPorId(id);
    return this.prisma.lider.update({
      where: { id_lider: id },
      data: { ...dto, data_atualizacao: new Date() },
      include: INCLUDE_LIDER,
    });
  }

  async remover(id: string) {
    await this.buscarPorId(id);
    await this.prisma.lider.update({
      where: { id_lider: id },
      data: { deletado_em: new Date() },
    });
    return { mensagem: 'Líder removido com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarLiderDto) {
    const where: any = { ...filtroLideres(solicitante) };
    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };

    return this.prisma.lider.findMany({ where, include: INCLUDE_LIDER, orderBy: { nome: 'asc' } });
  }
}
