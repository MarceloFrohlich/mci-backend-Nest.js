import { addDays, addWeeks, differenceInWeeks, getISOWeek, getISOWeekYear, isWithinInterval, parseISO, startOfDay } from 'date-fns';

function semanaJaDisponivel(inicioSemana: Date, hoje: Date): boolean {
  const anoSemana = getISOWeekYear(inicioSemana);
  const numSemana = getISOWeek(inicioSemana);
  const anoHoje = getISOWeekYear(hoje);
  const numHoje = getISOWeek(hoje);
  return anoSemana < anoHoje || (anoSemana === anoHoje && numSemana <= numHoje);
}

export interface LancamentoSemana {
  id_atualizacao: string;
  realizado: number;
  compromisso: number | null;
  plp: { entrevistaqtd: number; promotores: number; neutros: number; detratores: number; score: number } | null;
}

export interface SemanaPrevidencia {
  numero_semana: number;
  data_inicio_semana: Date;
  data_fim_semana: Date;
  inativa: boolean;
  status: 'concluida' | 'disponivel' | 'indisponivel' | 'inativa';
  permite_lancamento: boolean;
  lancamento: LancamentoSemana | null;
}

export function gerarSemanas(
  dataInicio: Date,
  dataFim: Date,
  inativoDe: Date | null,
  inativoAte: Date | null,
  atualizacoes: any[],
): SemanaPrevidencia[] {
  const hoje = startOfDay(new Date());
  const totalSemanas = differenceInWeeks(dataFim, dataInicio) + 1;
  const semanas: SemanaPrevidencia[] = [];

  for (let i = 1; i <= totalSemanas; i++) {
    const inicioSemana = addWeeks(dataInicio, i - 1);
    const fimSemana = i < totalSemanas ? addDays(addWeeks(dataInicio, i), -1) : dataFim;

    const inativa = !!(
      inativoDe &&
      inativoAte &&
      (isWithinInterval(inicioSemana, { start: inativoDe, end: inativoAte }) ||
        isWithinInterval(fimSemana, { start: inativoDe, end: inativoAte }))
    );

    const atualizacao = atualizacoes.find((a) => a.numero_semana === i && !a.deletado_em);
    const plpRaw = atualizacao?.plps?.[0] ?? null;

    let status: SemanaPrevidencia['status'];
    let permite_lancamento: boolean;

    const disponivel = semanaJaDisponivel(inicioSemana, hoje);

    if (inativa) {
      status = 'inativa';
      permite_lancamento = false;
    } else if (atualizacao) {
      status = 'concluida';
      permite_lancamento = disponivel;
    } else if (disponivel) {
      status = 'disponivel';
      permite_lancamento = true;
    } else {
      status = 'indisponivel';
      permite_lancamento = false;
    }

    semanas.push({
      numero_semana: i,
      data_inicio_semana: inicioSemana,
      data_fim_semana: fimSemana,
      inativa,
      status,
      permite_lancamento,
      lancamento: atualizacao
        ? {
            id_atualizacao: atualizacao.id_atualizacao,
            realizado: atualizacao.placar_atual,
            compromisso: atualizacao.compromisso ?? null,
            plp: plpRaw
              ? {
                  entrevistaqtd: plpRaw.respondentes,
                  promotores: plpRaw.propagadores,
                  neutros: plpRaw.neutros,
                  detratores: plpRaw.detratores,
                  score: Number(plpRaw.plp),
                }
              : null,
          }
        : null,
    });
  }

  return semanas;
}

export function calcularMetaSemanal(
  placarInicial: number,
  placarDesejado: number,
  dataInicio: Date,
  dataFim: Date,
): number {
  const total = placarDesejado - placarInicial;
  const semanas = differenceInWeeks(dataFim, dataInicio) || 1;
  return Math.ceil(total / semanas);
}

export function calcularPlp(
  propagadores: number,
  detratores: number,
  respondentes: number,
): number {
  if (respondentes === 0) return 0;
  const pctPropagadores = (propagadores / respondentes) * 100;
  const pctDetratores = (detratores / respondentes) * 100;
  return parseFloat((pctPropagadores - pctDetratores).toFixed(2));
}

export function calcularMediaPlp(plps: number[]): number {
  if (plps.length === 0) return 0;
  const soma = plps.reduce((acc, val) => acc + val, 0);
  return parseFloat((soma / plps.length).toFixed(2));
}

export interface ProgressoPrevidencia {
  semanas_totais: number;
  semanas_inatividade: number;
  semanas_efetivas: number;
  valor_por_semana: number;
  semanas_decorridas: number;
  semanas_decorridas_ajustadas: number;
  valor_previsto_ate_hoje: number;
  valor_atual: number;
  percentual: number;
}

export function calcularProgressoPrevidencia(
  placarInicial: number,
  placarAtual: number,
  placarDesejado: number,
  dataInicio: Date,
  dataFim: Date,
  inativoDe?: Date | null,
  inativoAte?: Date | null,
): ProgressoPrevidencia {
  const hoje = new Date();
  const total = placarDesejado - placarInicial;
  const valorAtual = placarAtual - placarInicial;

  const semanasTotais = differenceInWeeks(dataFim, dataInicio) || 1;

  let semanasInatividade = 0;
  let semanasInativPercorridas = 0;

  if (inativoDe && inativoAte) {
    semanasInatividade = differenceInWeeks(inativoAte, inativoDe);

    const periodoDecorrido = { start: dataInicio, end: hoje < dataFim ? hoje : dataFim };
    if (
      isWithinInterval(inativoDe, periodoDecorrido) ||
      isWithinInterval(inativoAte, periodoDecorrido)
    ) {
      const inicioInativ = inativoDe > dataInicio ? inativoDe : dataInicio;
      const fimInativ = inativoAte < (hoje < dataFim ? hoje : dataFim)
        ? inativoAte
        : hoje < dataFim ? hoje : dataFim;
      semanasInativPercorridas = differenceInWeeks(fimInativ, inicioInativ);
    }
  }

  const semanasEfetivas = Math.max(semanasTotais - semanasInatividade, 1);
  const valorPorSemana = total / semanasEfetivas;

  const semanasDecorridas = differenceInWeeks(hoje < dataFim ? hoje : dataFim, dataInicio);
  const semanasDecorridasAjustadas = Math.max(
    Math.min(semanasDecorridas - semanasInativPercorridas, semanasEfetivas),
    0,
  );

  const valorPrevisto = parseFloat((valorPorSemana * semanasDecorridasAjustadas).toFixed(2));
  const percentual =
    valorPrevisto > 0 ? parseFloat(((valorAtual / valorPrevisto) * 100).toFixed(2)) : 0;

  return {
    semanas_totais: semanasTotais,
    semanas_inatividade: semanasInatividade,
    semanas_efetivas: semanasEfetivas,
    valor_por_semana: parseFloat(valorPorSemana.toFixed(2)),
    semanas_decorridas: semanasDecorridas,
    semanas_decorridas_ajustadas: semanasDecorridasAjustadas,
    valor_previsto_ate_hoje: valorPrevisto,
    valor_atual: valorAtual,
    percentual,
  };
}
