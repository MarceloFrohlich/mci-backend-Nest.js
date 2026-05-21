import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id_usuario: payload.sub, deletado_em: null },
      include: { role: true, nivel: true, anos: { where: { deletado_em: null } } },
    });

    if (!usuario) throw new UnauthorizedException('Usuário não encontrado');

    const anoAtivo =
      usuario.anos.sort((a, b) => b.data_criacao.getTime() - a.data_criacao.getTime())[0]?.ano ??
      new Date().getFullYear();

    return {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      id_role: usuario.id_role,
      id_nivel: usuario.id_nivel,
      relacao: usuario.relacao,
      ano_ativo: anoAtivo,
    };
  }
}
