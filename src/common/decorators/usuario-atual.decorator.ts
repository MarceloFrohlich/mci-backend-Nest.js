import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const requisicao = ctx.switchToHttp().getRequest();
    return requisicao.user;
  },
);
