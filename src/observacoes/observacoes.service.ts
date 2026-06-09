import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { escopoJogoPorId } from '../common/utils/permissoes.util';
import { CriarObservacaoDto, AtualizarObservacaoDto } from './dto/observacao.dto';

@Injectable()
export class ObservacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorPrevidencia(idPrevidencia: string, solicitante: UsuarioAutenticado) {
    return this.prisma.observacaoPrevidencia.findMany({
      where: {
        id_previdencia: idPrevidencia,
        deletado_em: null,
        previdencia: { jogo: escopoJogoPorId(solicitante) },
      },
      orderBy: { data_criacao: 'desc' },
    });
  }

  async buscarPorId(id: string, solicitante: UsuarioAutenticado) {
    const obs = await this.prisma.observacaoPrevidencia.findFirst({
      where: { AND: [{ id_observacao: id, deletado_em: null }, { previdencia: { jogo: escopoJogoPorId(solicitante) } }] },
    });
    if (!obs) throw new NotFoundException('Observação não encontrada');
    return obs;
  }

  async criar(dto: CriarObservacaoDto, solicitante: UsuarioAutenticado) {
    const previdencia = await this.prisma.previdencia.findFirst({
      where: { AND: [{ id_previdencia: dto.id_previdencia, deletado_em: null }, { jogo: escopoJogoPorId(solicitante) }] },
      select: { id_previdencia: true },
    });
    if (!previdencia) throw new NotFoundException('Previdência não encontrada');

    return this.prisma.observacaoPrevidencia.create({
      data: { id_previdencia: dto.id_previdencia, observacao: dto.observacao },
    });
  }

  async atualizar(id: string, dto: AtualizarObservacaoDto, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);
    return this.prisma.observacaoPrevidencia.update({
      where: { id_observacao: id },
      data: { ...dto, data_atualizacao: new Date() },
    });
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);
    await this.prisma.observacaoPrevidencia.update({
      where: { id_observacao: id },
      data: { deletado_em: new Date() },
    });
    return { mensagem: 'Observação removida com sucesso' };
  }
}
