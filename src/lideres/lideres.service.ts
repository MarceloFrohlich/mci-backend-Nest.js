import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroLideres, isAdminGlobal, resolverIdFranqueadora } from '../common/utils/permissoes.util';
import { CriarLiderDto, AtualizarLiderDto, FiltrarLiderDto } from './dto/lider.dto';

const INCLUDE_LIDER = { franqueadora: true };

@Injectable()
export class LideresService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.lider.findMany({
      where: await filtroLideres(solicitante, this.prisma),
      include: INCLUDE_LIDER,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string, solicitante: UsuarioAutenticado) {
    const lider = await this.prisma.lider.findFirst({
      where: { AND: [{ id_lider: id, deletado_em: null }, await filtroLideres(solicitante, this.prisma)] },
      include: INCLUDE_LIDER,
    });
    if (!lider) throw new NotFoundException('Líder não encontrado');
    return lider;
  }

  async criar(dto: CriarLiderDto, solicitante: UsuarioAutenticado) {
    let idFranqueadora: string | null = null;
    if (!isAdminGlobal(solicitante)) {
      idFranqueadora = await resolverIdFranqueadora(solicitante, this.prisma);
      if (!idFranqueadora) {
        throw new ForbiddenException('Usuário não tem relação com nenhuma franqueadora');
      }
    }

    return this.prisma.lider.create({
      data: { nome: dto.nome, id_franqueadora: idFranqueadora },
      include: INCLUDE_LIDER,
    });
  }

  async atualizar(id: string, dto: AtualizarLiderDto, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);
    return this.prisma.lider.update({
      where: { id_lider: id },
      data: { ...dto, data_atualizacao: new Date() },
      include: INCLUDE_LIDER,
    });
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);
    await this.prisma.lider.update({
      where: { id_lider: id },
      data: { deletado_em: new Date() },
    });
    return { mensagem: 'Líder removido com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarLiderDto) {
    const where: any = { ...(await filtroLideres(solicitante, this.prisma)) };
    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };

    return this.prisma.lider.findMany({ where, include: INCLUDE_LIDER, orderBy: { nome: 'asc' } });
  }
}
