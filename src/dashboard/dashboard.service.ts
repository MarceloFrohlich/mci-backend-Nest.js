import { Injectable } from '@nestjs/common';
import { addDays, startOfDay, startOfWeek } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import {
  filtroCopas,
  isAdminGlobal,
  NIVEL_FRANQUEADORA,
  NIVEL_FILIAL,
} from '../common/utils/permissoes.util';
import {
  calcularProgressoPrevidencia,
  calcularProgressoTotalPrevidencia,
} from '../common/utils/calculos.util';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const STOPWORDS_SIGLA = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

function gerarSigla(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter((p) => !STOPWORDS_SIGLA.has(p.toLowerCase()));
  if (palavras.length === 0) return nome.slice(0, 2).toUpperCase();
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return palavras.slice(0, 3).map((p) => p[0]).join('').toUpperCase();
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((acc, v) => acc + v, 0) / valores.length;
}

function pct(num: number, den: number): number {
  return den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0;
}

function round1(valor: number): number {
  return parseFloat(valor.toFixed(1));
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(solicitante: UsuarioAutenticado) {
    const hoje = startOfDay(new Date());
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });
    const fimSemana = addDays(inicioSemana, 7);
    const inicioSemanaPassada = addDays(inicioSemana, -7);

    const previdencias = await this.prisma.previdencia.findMany({
      where: {
        deletado_em: null,
        jogo: {
          deletado_em: null,
          copa: filtroCopas(solicitante, solicitante.ano_ativo),
        },
      },
      include: {
        atualizacoes: { where: { deletado_em: null }, orderBy: { numero_semana: 'asc' } },
        jogo: {
          include: {
            status: true,
            copa: {
              include: {
                departamento: {
                  include: { filial: { include: { franqueadora: true } } },
                },
              },
            },
          },
        },
      },
    });

    // Enriquece cada previdência com progresso, lançamentos semanais e flags da semana
    const itens = previdencias.map((p) => {
      const lancamentos = p.atualizacoes.filter((a) => a.numero_semana != null);

      const progresso = calcularProgressoPrevidencia(
        p.placar_inicial, p.placar_atual, p.placar_desejado,
        p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
      );
      const total = calcularProgressoTotalPrevidencia(
        p.placar_inicial, p.placar_atual, p.placar_desejado,
      );

      // acumulado de realizado por semana (para evolução e detecção de risco)
      const acumuladoPorSemana = new Map<number, number>();
      let acumulado = 0;
      for (const a of lancamentos) {
        acumulado += a.placar_atual;
        acumuladoPorSemana.set(a.numero_semana as number, acumulado);
      }
      const realizadoAte = (semana: number): number => {
        let valor = 0;
        for (const [num, acc] of acumuladoPorSemana) {
          if (num <= semana) valor = Math.max(valor, acc);
        }
        return valor;
      };

      const lancadosNestaSemana = lancamentos.filter(
        (a) => a.data_criacao >= inicioSemana && a.data_criacao < fimSemana,
      );
      const lancadosSemanaPassada = lancamentos.filter(
        (a) => a.data_criacao >= inicioSemanaPassada && a.data_criacao < inicioSemana,
      );

      const realizadoSemana = lancadosNestaSemana.reduce((acc, a) => acc + a.placar_atual, 0);
      const realizadoPassado = progresso.valor_atual - realizadoSemana;
      const previstoPassado =
        progresso.valor_por_semana * Math.max(progresso.semanas_decorridas_ajustadas - 1, 0);

      return {
        previdencia: p,
        jogo: p.jogo,
        departamento: p.jogo.copa.departamento,
        filial: p.jogo.copa.departamento.filial,
        franqueadora: p.jogo.copa.departamento.filial.franqueadora,
        lancamentos,
        progresso,
        total,
        realizadoAte,
        ativa: hoje >= p.data_inicio && hoje <= p.data_fim,
        onTrack: progresso.valor_previsto_ate_hoje <= 0 || progresso.valor_atual >= progresso.valor_previsto_ate_hoje,
        onTrackPassado: previstoPassado <= 0 || realizadoPassado >= previstoPassado,
        lancadosNestaSemana,
        atualizadaNestaSemana: lancadosNestaSemana.length > 0,
        atualizadaSemanaPassada: lancadosSemanaPassada.length > 0,
        realizadoSemana,
      };
    });

    const ativas = itens.filter((i) => i.ativa);

    return {
      ano: solicitante.ano_ativo,
      progresso_semana: this.progressoSemana(ativas, hoje),
      on_track: this.onTrack(ativas),
      mcis: this.mcis(itens, hoje),
      compromissos: this.compromissos(itens, inicioSemana, fimSemana),
      engajamento: this.engajamento(ativas),
      evolucao_semanal: this.evolucaoSemanal(ativas),
      evolucao_unidades: this.evolucaoUnidades(ativas, solicitante),
      ranking: this.ranking(ativas),
      alertas: this.alertas(itens, hoje, inicioSemana),
    };
  }

  // % da meta semanal agregada já realizada nesta semana + lançamentos por dia
  private progressoSemana(ativas: any[], hoje: Date) {
    const realizado = ativas.reduce((acc, i) => acc + i.realizadoSemana, 0);
    const metaSemanal = ativas.reduce((acc, i) => acc + i.progresso.valor_por_semana, 0);

    const porDia = Array.from({ length: 7 }, (_, dia) => ({
      dia: DIAS_SEMANA[dia],
      total: 0,
      hoje: dia === hoje.getDay(),
    }));
    for (const item of ativas) {
      for (const a of item.lancadosNestaSemana) {
        porDia[new Date(a.data_criacao).getDay()].total++;
      }
    }

    return { percentual: pct(realizado, metaSemanal), dias: porDia };
  }

  // % de previdências com realizado >= previsto até hoje, com variação vs semana passada
  private onTrack(ativas: any[]) {
    const percentual = pct(ativas.filter((i) => i.onTrack).length, ativas.length);
    const passado = pct(ativas.filter((i) => i.onTrackPassado).length, ativas.length);
    return { percentual, variacao: round1(percentual - passado) };
  }

  private mcis(itens: any[], hoje: Date) {
    const porJogo = new Map<string, any[]>();
    for (const item of itens) {
      const grupo = porJogo.get(item.jogo.id_jogo) ?? [];
      grupo.push(item);
      porJogo.set(item.jogo.id_jogo, grupo);
    }

    const jogos = [...porJogo.values()].map((grupo) => {
      const jogo = grupo[0].jogo;
      const percentualTotal = round1(media(grupo.map((i) => i.total.percentual)));
      const percentualRitmo = media(grupo.map((i) => i.progresso.percentual));
      return {
        id_jogo: jogo.id_jogo,
        nome: jogo.nome,
        sigla: gerarSigla(jogo.nome),
        departamento: grupo[0].departamento.nome,
        percentual: percentualTotal,
        situacao: percentualRitmo >= 100 ? 'verde' : percentualRitmo >= 70 ? 'laranja' : 'amarelo',
        concluida: jogo.status?.status === 'success' || percentualTotal >= 100,
        ativa: hoje >= jogo.data_inicio && hoje <= jogo.data_fim,
      };
    });

    return {
      ativas: jogos.filter((j) => j.ativa).length,
      concluidas: jogos.filter((j) => j.concluida).length,
      lista: jogos.filter((j) => j.ativa).sort((a, b) => b.percentual - a.percentual),
    };
  }

  // compromisso da semana N é concluído quando o lançamento da semana N+1 realizou o prometido
  private compromissos(itens: any[], inicioSemana: Date, fimSemana: Date) {
    let avaliados = 0;
    let concluidos = 0;
    let avaliadosNestaSemana = 0;
    let concluidosNestaSemana = 0;

    for (const item of itens) {
      const porSemana = new Map(item.lancamentos.map((a: any) => [a.numero_semana, a]));
      for (const a of item.lancamentos) {
        if (a.compromisso == null) continue;
        const proxima: any = porSemana.get((a.numero_semana as number) + 1);
        if (!proxima) continue;

        const cumpriu = proxima.placar_atual >= a.compromisso;
        avaliados++;
        if (cumpriu) concluidos++;

        if (proxima.data_criacao >= inicioSemana && proxima.data_criacao < fimSemana) {
          avaliadosNestaSemana++;
          if (cumpriu) concluidosNestaSemana++;
        }
      }
    }

    const percentual = pct(concluidos, avaliados);
    const percentualPassado = pct(
      concluidos - concluidosNestaSemana,
      avaliados - avaliadosNestaSemana,
    );

    return {
      percentual,
      concluidos,
      avaliados,
      concluidos_nesta_semana: concluidosNestaSemana,
      variacao: round1(percentual - percentualPassado),
    };
  }

  // nota 0-10 = proporção de previdências ativas atualizadas na semana corrente
  private engajamento(ativas: any[]) {
    const nota = round1(pct(ativas.filter((i) => i.atualizadaNestaSemana).length, ativas.length) / 10);
    const notaPassada = round1(pct(ativas.filter((i) => i.atualizadaSemanaPassada).length, ativas.length) / 10);
    return { nota, variacao: round1((nota - notaPassada) * 10) };
  }

  // meta (reta linear) x realizado acumulado, em % da meta cheia, por semana
  private evolucaoSemanal(ativas: any[]) {
    const maxSemanas = Math.min(
      ativas.reduce((max, i) => Math.max(max, i.progresso.semanas_efetivas), 0),
      60,
    );

    const evolucao: { semana: number; meta: number; atual: number | null }[] = [];
    for (let semana = 1; semana <= maxSemanas; semana++) {
      const metas: number[] = [];
      const atuais: number[] = [];

      for (const item of ativas) {
        const efetivas = item.progresso.semanas_efetivas;
        if (efetivas < semana) continue;

        metas.push(Math.min((semana / efetivas) * 100, 100));
        if (semana <= item.progresso.semanas_decorridas_ajustadas && item.total.valor_total > 0) {
          atuais.push((item.realizadoAte(semana) / item.total.valor_total) * 100);
        }
      }

      evolucao.push({
        semana,
        meta: round1(media(metas)),
        atual: atuais.length > 0 ? round1(media(atuais)) : null,
      });
    }

    return evolucao;
  }

  // barras meta x resultado por "filho direto" do usuário na hierarquia:
  // admin -> franqueadoras, franqueadora -> filiais, filial -> departamentos, departamento -> jogos
  private evolucaoUnidades(ativas: any[], solicitante: UsuarioAutenticado) {
    const unidadeDe = (item: any): { id: string; nome: string } => {
      if (isAdminGlobal(solicitante)) {
        return { id: item.franqueadora.id_franqueadora, nome: item.franqueadora.nome };
      }
      if (solicitante.id_nivel === NIVEL_FRANQUEADORA) {
        return { id: item.filial.id_filial, nome: item.filial.nome };
      }
      if (solicitante.id_nivel === NIVEL_FILIAL) {
        return { id: item.departamento.id_departamento, nome: item.departamento.nome };
      }
      return { id: item.jogo.id_jogo, nome: item.jogo.nome };
    };

    const grupos = new Map<string, { nome: string; itens: any[] }>();
    for (const item of ativas) {
      const unidade = unidadeDe(item);
      const grupo = grupos.get(unidade.id) ?? { nome: unidade.nome, itens: [] };
      grupo.itens.push(item);
      grupos.set(unidade.id, grupo);
    }

    return [...grupos.values()]
      .map((grupo) => ({
        sigla: gerarSigla(grupo.nome),
        nome: grupo.nome,
        meta: round1(media(grupo.itens.map((i) =>
          i.total.valor_total > 0
            ? Math.min((i.progresso.valor_previsto_ate_hoje / i.total.valor_total) * 100, 100)
            : 0,
        ))),
        resultado: round1(media(grupo.itens.map((i) => i.total.percentual))),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  // desempenho = média do ritmo (realizado vs previsto até hoje), limitado a 100%
  private ranking(ativas: any[]) {
    const grupos = new Map<string, { nome: string; ritmos: number[] }>();
    for (const item of ativas) {
      const grupo = grupos.get(item.departamento.id_departamento)
        ?? { nome: item.departamento.nome, ritmos: [] };
      grupo.ritmos.push(Math.min(item.progresso.percentual, 100));
      grupos.set(item.departamento.id_departamento, grupo);
    }

    return [...grupos.values()]
      .map((grupo) => ({
        sigla: gerarSigla(grupo.nome),
        nome: grupo.nome,
        percentual: Math.round(media(grupo.ritmos)),
      }))
      .sort((a, b) => b.percentual - a.percentual)
      .map((equipe, indice) => ({ posicao: indice + 1, ...equipe }));
  }

  private alertas(itens: any[], hoje: Date, inicioSemana: Date) {
    const alertas: { tipo: string; titulo: string; descricao: string }[] = [];
    const seteDiasAtras = addDays(hoje, -7);

    // equipe em risco: abaixo da meta acumulada por 3 semanas consecutivas
    const emRisco = new Set<string>();
    for (const item of itens.filter((i) => i.ativa)) {
      const decorridas = item.progresso.semanas_decorridas_ajustadas;
      if (decorridas < 3 || item.progresso.valor_por_semana <= 0) continue;

      const atrasadaEm = (semana: number) =>
        item.realizadoAte(semana) < item.progresso.valor_por_semana * semana;

      if (atrasadaEm(decorridas) && atrasadaEm(decorridas - 1) && atrasadaEm(decorridas - 2)) {
        emRisco.add(item.departamento.nome);
      }
    }
    for (const nome of emRisco) {
      alertas.push({
        tipo: 'risco',
        titulo: `${nome} em risco`,
        descricao: 'Abaixo da meta por 3 semanas consecutivas',
      });
    }

    // atualização pendente: previdência ativa sem lançamento na semana corrente
    const semAtualizacao = new Set<string>();
    for (const item of itens.filter((i) => i.ativa)) {
      if (!item.atualizadaNestaSemana && item.progresso.semanas_decorridas_ajustadas >= 1) {
        semAtualizacao.add(item.departamento.nome);
      }
    }
    for (const nome of semAtualizacao) {
      alertas.push({
        tipo: 'sem_atualizacao',
        titulo: 'Atualização pendente',
        descricao: `${nome} não registrou atualização esta semana`,
      });
    }

    // nova MCI: jogo criado nos últimos 7 dias
    const jogosVistos = new Set<string>();
    for (const item of itens) {
      if (item.jogo.data_criacao >= seteDiasAtras && !jogosVistos.has(item.jogo.id_jogo)) {
        jogosVistos.add(item.jogo.id_jogo);
        alertas.push({
          tipo: 'nova_mci',
          titulo: 'Nova MCI criada',
          descricao: `${item.departamento.nome} criou a MCI ${item.jogo.nome}`,
        });
      }
    }

    // meta atingida antes do prazo
    const metasVistas = new Set<string>();
    for (const item of itens) {
      if (item.total.percentual >= 100 && hoje < item.previdencia.data_fim && !metasVistas.has(item.jogo.id_jogo)) {
        metasVistas.add(item.jogo.id_jogo);
        alertas.push({
          tipo: 'meta_atingida',
          titulo: 'Meta atingida',
          descricao: `${item.departamento.nome} completou ${item.jogo.nome} antes do prazo`,
        });
      }
    }

    return alertas.slice(0, 10);
  }
}
