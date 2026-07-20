import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// campos que representam um instante (data + hora), nao uma data pura,
// e por isso ficam de fora da truncagem para "YYYY-MM-DD"
const CAMPOS_COM_HORA = new Set(['data_hora']);

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformar(data)));
  }

  private transformar(valor: any, chave?: string): any {
    if (valor === null || valor === undefined) return valor;

    if (valor instanceof Date) {
      return chave && CAMPOS_COM_HORA.has(chave) ? valor : this.formatar(valor);
    }

    if (Array.isArray(valor)) return valor.map((item) => this.transformar(item, chave));

    if (typeof valor === 'object' && typeof valor.toNumber === 'function') {
      return valor.toNumber();
    }

    if (typeof valor === 'object') {
      const resultado: any = {};
      for (const propriedade of Object.keys(valor)) {
        resultado[propriedade] = this.transformar(valor[propriedade], propriedade);
      }
      return resultado;
    }

    return valor;
  }

  private formatar(data: Date): string {
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const ano = data.getUTCFullYear();
    return `${ano}-${mes}-${dia}`;
  }
}
