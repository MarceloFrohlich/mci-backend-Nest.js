import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LogsService } from './logs.service';

// campos cujo valor nunca deve ser persistido (senha, código de recuperação, tokens etc.)
const CHAVE_SENSIVEL = /senha|password|token|secret|codigo/i;
const TAMANHO_MAXIMO_PAYLOAD = 20_000; // bytes (JSON serializado)

// registra escritas e seus erros; GETs ficam de fora pelo volume
@Injectable()
export class LogsInterceptor implements NestInterceptor {
  constructor(private readonly logs: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const requisicao = context.switchToHttp().getRequest();
    const { method, url } = requisicao;

    if (method === 'GET') return next.handle();

    const payload = this.extrairPayload(requisicao.body);

    return next.handle().pipe(
      tap(() => {
        this.logs.registrar({
          metodo: method,
          rota: url,
          status: context.switchToHttp().getResponse().statusCode,
          sucesso: true,
          usuario: requisicao.user?.email,
          payload,
        });
      }),
      catchError((erro) => {
        this.logs.registrar({
          metodo: method,
          rota: url,
          status: erro instanceof HttpException ? erro.getStatus() : 500,
          sucesso: false,
          mensagem_erro: this.extrairMensagem(erro),
          usuario: requisicao.user?.email,
          payload,
        });

        return throwError(() => erro);
      }),
    );
  }

  private extrairMensagem(erro: unknown): string {
    if (erro instanceof HttpException) {
      const resposta = erro.getResponse();
      if (typeof resposta === 'string') return resposta;

      const mensagem = (resposta as { message?: string | string[] }).message;
      return Array.isArray(mensagem) ? mensagem.join('; ') : (mensagem ?? erro.message);
    }

    return erro instanceof Error ? erro.message : String(erro);
  }

  private extrairPayload(body: unknown): Prisma.InputJsonObject | undefined {
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return undefined;
    }

    const sanitizado = this.redigir(body as Record<string, unknown>);
    if (JSON.stringify(sanitizado).length > TAMANHO_MAXIMO_PAYLOAD) {
      return { aviso: 'payload maior que o limite e não foi armazenado' };
    }

    return sanitizado;
  }

  private redigir(valor: Record<string, unknown>): Prisma.InputJsonObject {
    const resultado: Record<string, unknown> = {};

    for (const [chave, dado] of Object.entries(valor)) {
      if (CHAVE_SENSIVEL.test(chave)) {
        resultado[chave] = '[REDACTED]';
      } else if (dado && typeof dado === 'object' && !Array.isArray(dado)) {
        resultado[chave] = this.redigir(dado as Record<string, unknown>);
      } else {
        resultado[chave] = dado;
      }
    }

    return resultado as Prisma.InputJsonObject;
  }
}
