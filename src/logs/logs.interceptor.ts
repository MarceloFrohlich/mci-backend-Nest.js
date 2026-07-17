import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LogsService } from './logs.service';

// registra escritas e seus erros; GETs ficam de fora pelo volume
@Injectable()
export class LogsInterceptor implements NestInterceptor {
  constructor(private readonly logs: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const requisicao = context.switchToHttp().getRequest();
    const { method, url } = requisicao;

    if (method === 'GET') return next.handle();

    return next.handle().pipe(
      tap(() => {
        this.logs.registrar({
          metodo: method,
          rota: url,
          status: context.switchToHttp().getResponse().statusCode,
          sucesso: true,
          usuario: requisicao.user?.email,
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
}
