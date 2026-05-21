import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

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

    const mensagem =
      excecao instanceof HttpException
        ? excecao.getResponse()
        : 'Erro interno do servidor';

    resposta.status(status).json({
      sucesso: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: requisicao.url,
      mensagem:
        typeof mensagem === 'object' && 'message' in (mensagem as object)
          ? (mensagem as any).message
          : mensagem,
    });
  }
}
