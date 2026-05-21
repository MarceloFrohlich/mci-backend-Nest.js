import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarObservacaoDto, AtualizarObservacaoDto } from './dto/observacao.dto';

@Injectable()
export class ObservacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorPrevidencia(idPrevidencia: string) {
    return this.prisma.observacaoPrevidencia.findMany({
      where: { id_previdencia: idPrevidencia, deletado_em: null },
      orderBy: { data_criacao: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    const obs = await this.prisma.observacaoPrevidencia.findFirst({
      where: { id_observacao: id, deletado_em: null },
    });
    if (!obs) throw new NotFoundException('Observação não encontrada');
    return obs;
  }

  async criar(dto: CriarObservacaoDto) {
    return this.prisma.observacaoPrevidencia.create({
      data: { id_previdencia: dto.id_previdencia, observacao: dto.observacao },
    });
  }

  async atualizar(id: string, dto: AtualizarObservacaoDto) {
    await this.buscarPorId(id);
    return this.prisma.observacaoPrevidencia.update({
      where: { id_observacao: id },
      data: { ...dto, data_atualizacao: new Date() },
    });
  }

  async remover(id: string) {
    await this.buscarPorId(id);
    await this.prisma.observacaoPrevidencia.update({
      where: { id_observacao: id },
      data: { deletado_em: new Date() },
    });
    return { mensagem: 'Observação removida com sucesso' };
  }
}
