import { differenceInWeeks, isWithinInterval, parseISO } from 'date-fns';

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
