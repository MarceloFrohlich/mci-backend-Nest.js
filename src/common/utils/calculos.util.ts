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
  data_previsto_lancamento: Date;
  inativa: boolean;
  status: 'concluida' | 'disponivel' | 'indisponivel' | 'inativa';
  permite_lancamento: boolean;
  lancamento: LancamentoSemana | null;
}

function adicionarDiasUTC(data: Date, dias: number): Date {
  return new Date(Date.UTC(
    data.getUTCFullYear(),
    data.getUTCMonth(),
    data.getUTCDate() + dias,
  ));
}

function primeiraQuintaUTC(data: Date): Date {
  const dayUTC = data.getUTCDay(); // 0=Dom, 4=Qui
  const diasAteQuinta = (4 - dayUTC + 7) % 7;
  return adicionarDiasUTC(data, diasAteQuinta);
}

function limitesSemana(
  dataInicio: Date,
  dataFim: Date,
  i: number,
  totalSemanas: number,
): { inicioSemana: Date; fimSemana: Date } {
  const inicioSemana = addWeeks(dataInicio, i - 1);
  const fimSemana = i < totalSemanas ? addDays(addWeeks(dataInicio, i), -1) : dataFim;
  return { inicioSemana, fimSemana };
}

function semanaInativa(
  inicioSemana: Date,
  fimSemana: Date,
  inativoDe: Date | null | undefined,
  inativoAte: Date | null | undefined,
): boolean {
  return !!(
    inativoDe &&
    inativoAte &&
    (isWithinInterval(inicioSemana, { start: inativoDe, end: inativoAte }) ||
      isWithinInterval(fimSemana, { start: inativoDe, end: inativoAte }))
  );
}

export function gerarSemanas(
  dataInicio: Date,
  dataFim: Date,
  inativoDe: Date | null,
  inativoAte: Date | null,
  atualizacoes: any[],
): SemanaPrevidencia[] {
  const hoje = startOfDay(new Date());
  const totalSemanas = contarSemanas(dataInicio, dataFim);
  const semanas: SemanaPrevidencia[] = [];
  const primeiraQuinta = primeiraQuintaUTC(dataInicio);

  for (let i = 1; i <= totalSemanas; i++) {
    const { inicioSemana, fimSemana } = limitesSemana(dataInicio, dataFim, i, totalSemanas);

    const inativa = semanaInativa(inicioSemana, fimSemana, inativoDe, inativoAte);

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

    const dataPrevistoLancamento = adicionarDiasUTC(primeiraQuinta, (i - 1) * 7);

    semanas.push({
      numero_semana: i,
      data_inicio_semana: inicioSemana,
      data_fim_semana: fimSemana,
      data_previsto_lancamento: dataPrevistoLancamento,
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

export function contarSemanas(dataInicio: Date, dataFim: Date): number {
  return differenceInWeeks(dataFim, dataInicio) + 1;
}

/**
 * Conta apenas as semanas ATIVAS (descontando as que caem no período de
 * inatividade). Usa a mesma regra do gerarSemanas, então o saldo bate
 * exatamente com as semanas devolvidas ao front.
 */
export function contarSemanasAtivas(
  dataInicio: Date,
  dataFim: Date,
  inativoDe?: Date | null,
  inativoAte?: Date | null,
): number {
  const totalSemanas = contarSemanas(dataInicio, dataFim);
  if (!inativoDe || !inativoAte) return totalSemanas;

  let ativas = 0;
  for (let i = 1; i <= totalSemanas; i++) {
    const { inicioSemana, fimSemana } = limitesSemana(dataInicio, dataFim, i, totalSemanas);
    if (!semanaInativa(inicioSemana, fimSemana, inativoDe, inativoAte)) ativas++;
  }
  return Math.max(ativas, 1);
}

/** Nº de semanas ATIVAS já decorridas até hoje (base do "previsto até hoje"). */
function contarSemanasAtivasDecorridas(
  dataInicio: Date,
  dataFim: Date,
  inativoDe: Date | null | undefined,
  inativoAte: Date | null | undefined,
  hoje: Date,
): number {
  if (hoje < dataInicio) return 0;
  const totalSemanas = contarSemanas(dataInicio, dataFim);
  const fimContagem = hoje < dataFim ? hoje : dataFim;
  const decorridas = Math.min(contarSemanas(dataInicio, fimContagem), totalSemanas);

  let ativas = 0;
  for (let i = 1; i <= decorridas; i++) {
    const { inicioSemana, fimSemana } = limitesSemana(dataInicio, dataFim, i, totalSemanas);
    if (!semanaInativa(inicioSemana, fimSemana, inativoDe, inativoAte)) ativas++;
  }
  return ativas;
}

export function calcularMetaSemanal(
  placarInicial: number,
  placarDesejado: number,
  dataInicio: Date,
  dataFim: Date,
  inativoDe?: Date | null,
  inativoAte?: Date | null,
): number {
  const total = placarDesejado - placarInicial;
  const semanas = contarSemanasAtivas(dataInicio, dataFim, inativoDe, inativoAte);
  return Math.ceil(total / semanas);
}

export interface SugestaoMetaInteira {
  semanas: number;
  meta_semanal: number;
  por_semana_abaixo: number;
  por_semana_acima: number;
  sugestao_abaixo: number;
  sugestao_acima: number;
}

/**
 * Verifica se a meta (placarDesejado) se divide em valor inteiro por semana.
 * Retorna null quando já é inteira; caso contrário, retorna as metas inteiras
 * imediatamente abaixo e acima.
 */
export function sugerirMetaInteira(
  placarInicial: number,
  placarDesejado: number,
  dataInicio: Date,
  dataFim: Date,
  inativoDe?: Date | null,
  inativoAte?: Date | null,
): SugestaoMetaInteira | null {
  const semanas = contarSemanasAtivas(dataInicio, dataFim, inativoDe, inativoAte);
  const total = placarDesejado - placarInicial;

  if (total % semanas === 0) return null;

  const passo = total / semanas;
  const porSemanaAbaixo = Math.floor(passo);
  const porSemanaAcima = Math.ceil(passo);

  return {
    semanas,
    meta_semanal: parseFloat(passo.toFixed(2)),
    por_semana_abaixo: porSemanaAbaixo,
    por_semana_acima: porSemanaAcima,
    sugestao_abaixo: placarInicial + porSemanaAbaixo * semanas,
    sugestao_acima: placarInicial + porSemanaAcima * semanas,
  };
}

export function mensagemMetaNaoInteira(
  placarDesejado: number,
  s: SugestaoMetaInteira,
): string {
  return (
    `A meta ${placarDesejado} dividida em ${s.semanas} semanas resulta em ` +
    `${s.meta_semanal} por semana, que não é um valor inteiro. ` +
    `Use ${s.sugestao_abaixo} (${s.por_semana_abaixo}/semana) ou ` +
    `${s.sugestao_acima} (${s.por_semana_acima}/semana) para uma meta semanal inteira.`
  );
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

  const semanasTotais = contarSemanas(dataInicio, dataFim);
  const semanasEfetivas = contarSemanasAtivas(dataInicio, dataFim, inativoDe, inativoAte);
  const semanasInatividade = semanasTotais - semanasEfetivas;

  const valorPorSemana = total / semanasEfetivas;

  const fimContagem = hoje < dataFim ? hoje : dataFim;
  const semanasDecorridas = hoje < dataInicio ? 0 : contarSemanas(dataInicio, fimContagem);
  const semanasDecorridasAjustadas = contarSemanasAtivasDecorridas(
    dataInicio,
    dataFim,
    inativoDe,
    inativoAte,
    hoje,
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
