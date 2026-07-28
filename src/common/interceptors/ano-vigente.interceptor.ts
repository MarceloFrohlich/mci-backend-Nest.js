import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IGNORAR_ANO_VIGENTE_KEY } from '../decorators/ignorar-ano-vigente.decorator';
import { UsuarioAutenticado } from '../types/usuario-autenticado.type';

const METODOS_MUTANTES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Bloqueia qualquer mutação (POST/PUT/PATCH/DELETE) enquanto o usuário estiver
 * navegando em um ano diferente do ano vigente (sysdate), permitindo apenas
 * visualização de dados de anos anteriores. Rotas marcadas com
 * @IgnorarAnoVigente() (ex.: trocar de ano, logout, alterar senha) escapam da regra.
 */
@Injectable()
export class AnoVigenteInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requisicao = context.switchToHttp().getRequest();
    const usuario = requisicao.user as UsuarioAutenticado | undefined;

    if (!usuario || !METODOS_MUTANTES.has(requisicao.method)) {
      return next.handle();
    }

    const ignorar = this.reflector.getAllAndOverride<boolean>(IGNORAR_ANO_VIGENTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!ignorar && usuario.ano_ativo !== new Date().getFullYear()) {
      throw new ForbiddenException('Não é permitida a atualização de dados de anos anteriores');
    }

    return next.handle();
  }
}
