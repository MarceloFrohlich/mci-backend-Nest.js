import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

const TRADUCOES: [RegExp, string][] = [
  [/must be a valid ISO 8601 date string/, 'deve ser uma data válida no formato AAAA-MM-DD'],
  [/must be a UUID/, 'deve ser um identificador válido'],
  [/must be a boolean value/, 'deve ser verdadeiro ou falso'],
  [/must be an integer number/, 'deve ser um número inteiro'],
  [/must be a number conforming to the specified constraints/, 'deve ser um número'],
  [/must be a number/, 'deve ser um número'],
  [/must be a string/, 'deve ser um texto'],
  [/must be an array/, 'deve ser uma lista'],
  [/should not be empty/, 'não pode estar vazio'],
  [/is not allowed/, 'não é permitido'],
  [/must be one of the following values: (.+)/, 'deve ser um dos valores: $1'],
  [/must be shorter than or equal to (\d+) characters/, 'deve ter no máximo $1 caracteres'],
  [/must be longer than or equal to (\d+) characters/, 'deve ter no mínimo $1 caracteres'],
  [/must be a positive number/, 'deve ser um número positivo'],
  [/must not be less than (\d+)/, 'deve ser no mínimo $1'],
  [/must not be greater than (\d+)/, 'deve ser no máximo $1'],
];

const CAMPOS: Record<string, string> = {
  nome: 'nome',
  email: 'e-mail',
  senha: 'senha',
  data_inicio: 'data de início',
  data_fim: 'data de fim',
  inativo_de: 'início do período inativo',
  inativo_ate: 'fim do período inativo',
  placar_desejado: 'placar desejado',
  placar_atual: 'placar atual',
  unidade_medida: 'unidade de medida',
  excluir_periodo: 'excluir período',
  ids_copas: 'copas',
  id_copa: 'copa',
  id_jogo: 'jogo',
  id_lider: 'líder',
  id_usuario: 'usuário',
  tem_plp: 'possui PLP',
  realizado: 'valor realizado',
  compromisso: 'compromisso',
  entrevistaqtd: 'total de entrevistados',
  promotores: 'promotores',
  detratores: 'detratores',
  neutros: 'neutros',
  previdencias: 'previdências',
  verbo: 'verbo',
  medida: 'medida',
  observacao: 'observação',
};

function traduzirCampo(campo: string): string {
  const partes = campo.split('.');
  return partes
    .map((p) => (isNaN(Number(p)) ? (CAMPOS[p] ?? p.replace(/_/g, ' ')) : `item ${Number(p) + 1}`))
    .join(' › ');
}

function traduzirMensagem(msg: string): string {
  const match = msg.match(/^([^\s]+)\s(.+)$/);
  if (!match) return msg;

  const [, campo, resto] = match;
  let textoTraduzido = resto;

  for (const [padrao, traducao] of TRADUCOES) {
    if (padrao.test(textoTraduzido)) {
      textoTraduzido = textoTraduzido.replace(padrao, traducao);
      break;
    }
  }

  return `${traduzirCampo(campo)}: ${textoTraduzido}`;
}

function traduzirMensagens(mensagem: unknown): unknown {
  if (Array.isArray(mensagem)) return mensagem.map((m) => (typeof m === 'string' ? traduzirMensagem(m) : m));
  if (typeof mensagem === 'string') return traduzirMensagem(mensagem);
  return mensagem;
}

@Catch()
export class FiltroHttpException implements ExceptionFilter {
  catch(excecao: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const resposta = ctx.getResponse<Response>();
    const requisicao = ctx.getRequest<Request>();

    const status =
      excecao instanceof HttpException
        ? excecao.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const corpo =
      excecao instanceof HttpException
        ? excecao.getResponse()
        : 'Erro interno do servidor';

    const mensagemBruta =
      typeof corpo === 'object' && 'message' in (corpo as object)
        ? (corpo as any).message
        : corpo;

    resposta.status(status).json({
      sucesso: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: requisicao.url,
      mensagem: traduzirMensagens(mensagemBruta),
    });
  }
}
