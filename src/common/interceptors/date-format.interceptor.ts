import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformar(data)));
  }

  private transformar(valor: any): any {
    if (valor === null || valor === undefined) return valor;

    if (valor instanceof Date) return this.formatar(valor);

    if (Array.isArray(valor)) return valor.map((item) => this.transformar(item));

    if (typeof valor === 'object') {
      const resultado: any = {};
      for (const chave of Object.keys(valor)) {
        resultado[chave] = this.transformar(valor[chave]);
      }
      return resultado;
    }

    return valor;
  }

  private formatar(data: Date): string {
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const ano = data.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  }
}
