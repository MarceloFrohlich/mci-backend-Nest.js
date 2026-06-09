import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calcularProgressoPrevidencia } from '../common/utils/calculos.util';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { escopoCopaPorId } from '../common/utils/permissoes.util';

@Injectable()
export class GraficosService {
  constructor(private readonly prisma: PrismaService) {}

  async graficoPrevidencias(idCopa: string, solicitante: UsuarioAutenticado) {
    const previdencias = await this.prisma.previdencia.findMany({
      where: {
        deletado_em: null,
        jogo: { id_copa: idCopa, deletado_em: null, copa: escopoCopaPorId(solicitante) },
      },
      include: {
        jogo: true,
        atualizacoes: {
          where: { deletado_em: null },
          orderBy: { data_criacao: 'asc' },
        },
      },
    });

    return previdencias.map((p) => {
      const historico = p.atualizacoes.map((a) => ({
        data: a.data_criacao,
        placar: a.placar_atual,
      }));

      const progresso = calcularProgressoPrevidencia(
        p.placar_inicial, p.placar_atual, p.placar_desejado,
        p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
      );

      return {
        id_previdencia: p.id_previdencia,
        jogo: p.jogo?.nome,
        verbo: p.verbo,
        unidade_medida: p.unidade_medida,
        placar_inicial: p.placar_inicial,
        placar_atual: p.placar_atual,
        placar_desejado: p.placar_desejado,
        data_inicio: p.data_inicio,
        data_fim: p.data_fim,
        historico,
        progresso,
      };
    });
  }

  async graficoJogos(idCopa: string, solicitante: UsuarioAutenticado) {
    const jogos = await this.prisma.jogo.findMany({
      where: { id_copa: idCopa, deletado_em: null, copa: escopoCopaPorId(solicitante) },
      include: {
        previdencias: {
          where: { deletado_em: null },
          include: {
            atualizacoes: {
              where: { deletado_em: null },
              orderBy: { data_criacao: 'asc' },
            },
          },
        },
        lider: true,
        status: true,
      },
    });

    return jogos.map((jogo) => {
      const prevComProgresso = jogo.previdencias.map((p) => ({
        ...p,
        progresso: calcularProgressoPrevidencia(
          p.placar_inicial, p.placar_atual, p.placar_desejado,
          p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
        ),
      }));

      return { ...jogo, previdencias: prevComProgresso };
    });
  }
}
