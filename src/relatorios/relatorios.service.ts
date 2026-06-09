import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calcularMetaSemanal, calcularProgressoPrevidencia } from '../common/utils/calculos.util';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { escopoCopaPorId, escopoJogoPorId } from '../common/utils/permissoes.util';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  async gerarRelatorio(idCopa: string, solicitante: UsuarioAutenticado) {
    const copa = await this.prisma.copa.findFirst({
      where: { AND: [{ id_copa: idCopa, deletado_em: null }, escopoCopaPorId(solicitante)] },
      include: {
        departamento: { include: { filial: { include: { franqueadora: true } } } },
        jogos: {
          where: { deletado_em: null },
          include: {
            lider: true,
            status: true,
            previdencias: {
              where: { deletado_em: null },
              include: {
                atualizacoes: {
                  where: { deletado_em: null },
                  orderBy: { data_criacao: 'desc' },
                  take: 5,
                },
                plps: {
                  where: { deletado_em: null },
                  orderBy: { data_criacao: 'desc' },
                  take: 5,
                },
                observacoes: {
                  where: { deletado_em: null },
                  orderBy: { data_criacao: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!copa) throw new NotFoundException('Copa não encontrada');

    const jogosComCalculos = copa.jogos.map((jogo) => {
      const previdenciasComCalculos = jogo.previdencias.map((p) => ({
        ...p,
        meta_semanal: calcularMetaSemanal(p.placar_inicial, p.placar_desejado, p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate),
        progresso: calcularProgressoPrevidencia(
          p.placar_inicial, p.placar_atual, p.placar_desejado,
          p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
        ),
      }));

      return { ...jogo, previdencias: previdenciasComCalculos };
    });

    return { ...copa, jogos: jogosComCalculos };
  }

  async criarStatus(idJogo: string, status: string, valor: string, solicitante: UsuarioAutenticado) {
    const jogo = await this.prisma.jogo.findFirst({
      where: { AND: [{ id_jogo: idJogo, deletado_em: null }, escopoJogoPorId(solicitante)] },
      select: { id_jogo: true },
    });
    if (!jogo) throw new NotFoundException('Jogo não encontrado');

    const existente = await this.prisma.jogoStatus.findFirst({
      where: { id_jogo: idJogo, deletado_em: null },
    });

    if (existente) {
      return this.prisma.jogoStatus.update({
        where: { id_status: existente.id_status },
        data: { status, valor, data_atualizacao: new Date() },
      });
    }

    return this.prisma.jogoStatus.create({ data: { id_jogo: idJogo, status, valor } });
  }

  async atualizarStatus(id: string, status: string, valor: string, solicitante: UsuarioAutenticado) {
    const existente = await this.prisma.jogoStatus.findFirst({
      where: { AND: [{ id_status: id, deletado_em: null }, { jogo: escopoJogoPorId(solicitante) }] },
    });
    if (!existente) throw new NotFoundException('Status não encontrado');

    return this.prisma.jogoStatus.update({
      where: { id_status: id },
      data: { status, valor, data_atualizacao: new Date() },
    });
  }
}
