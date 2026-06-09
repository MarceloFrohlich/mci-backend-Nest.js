import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UsuarioAutenticado } from '../types/usuario-autenticado.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesNecessarias = this.reflector.getAllAndOverride<number[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesNecessarias || rolesNecessarias.length === 0) return true;

    const requisicao = context.switchToHttp().getRequest();
    const usuario = requisicao.user as UsuarioAutenticado | undefined;

    if (!usuario || !rolesNecessarias.includes(usuario.id_role)) {
      throw new ForbiddenException('Acesso restrito: permissão insuficiente');
    }

    return true;
  }
}
