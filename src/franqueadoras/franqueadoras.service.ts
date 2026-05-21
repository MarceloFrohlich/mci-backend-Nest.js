import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroFranqueadoras } from '../common/utils/permissoes.util';
import {
  CriarFranqueadoraDto,
  AtualizarFranqueadoraDto,
  FiltrarFranqueadoraDto,
} from './dto/franqueadora.dto';

@Injectable()
export class FranqueadorasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.franqueadora.findMany({
      where: filtroFranqueadoras(solicitante),
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const franqueadora = await this.prisma.franqueadora.findFirst({
      where: { id_franqueadora: id, deletado_em: null },
    });
    if (!franqueadora) throw new NotFoundException('Franqueadora não encontrada');
    return franqueadora;
  }

  async criar(dto: CriarFranqueadoraDto) {
    return this.prisma.franqueadora.create({ data: { nome: dto.nome } });
  }

  async atualizar(id: string, dto: AtualizarFranqueadoraDto) {
    await this.buscarPorId(id);
    return this.prisma.franqueadora.update({
      where: { id_franqueadora: id },
      data: { ...dto, data_atualizacao: new Date() },
    });
  }

  async remover(id: string) {
    await this.buscarPorId(id);

    await this.prisma.$transaction(async (tx) => {
      const filiais = await tx.filial.findMany({
        where: { id_franqueadora: id, deletado_em: null },
        select: { id_filial: true },
      });

      for (const filial of filiais) {
        await tx.departamento.updateMany({
          where: { id_filial: filial.id_filial, deletado_em: null },
          data: { deletado_em: new Date() },
        });
      }

      await tx.filial.updateMany({
        where: { id_franqueadora: id, deletado_em: null },
        data: { deletado_em: new Date() },
      });

      await tx.franqueadora.update({
        where: { id_franqueadora: id },
        data: { deletado_em: new Date() },
      });
    });

    return { mensagem: 'Franqueadora removida com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarFranqueadoraDto) {
    const where: any = { ...filtroFranqueadoras(solicitante) };
    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };

    return this.prisma.franqueadora.findMany({ where, orderBy: { nome: 'asc' } });
  }
}
