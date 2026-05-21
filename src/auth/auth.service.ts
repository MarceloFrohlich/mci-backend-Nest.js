import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email, deletado_em: null },
      include: { role: true, nivel: true },
    });

    if (!usuario) throw new UnauthorizedException('Credenciais inválidas');

    const senhaCorreta = await bcrypt.compare(dto.senha, usuario.senha);
    if (!senhaCorreta) throw new UnauthorizedException('Credenciais inválidas');

    const anoAtual = new Date().getFullYear();

    let usuarioAno = await this.prisma.usuarioAno.findFirst({
      where: { id_usuario: usuario.id_usuario, deletado_em: null },
      orderBy: { data_criacao: 'desc' },
    });

    if (!usuarioAno) {
      usuarioAno = await this.prisma.usuarioAno.create({
        data: { id_usuario: usuario.id_usuario, ano: anoAtual },
      });
    }

    const payload = { sub: usuario.id_usuario, email: usuario.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      token_type: 'bearer',
      expires_in: process.env.JWT_EXPIRATION ?? '8h',
      usuario: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role.nome,
        nivel: usuario.nivel.nome,
        id_role: usuario.id_role,
        id_nivel: usuario.id_nivel,
        relacao: usuario.relacao,
        ano_ativo: usuarioAno.ano,
      },
    };
  }

  async me(idUsuario: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id_usuario: idUsuario, deletado_em: null },
      include: {
        role: true,
        nivel: true,
        anos: {
          where: { deletado_em: null },
          orderBy: { data_criacao: 'desc' },
          take: 1,
        },
      },
    });

    if (!usuario) throw new UnauthorizedException('Usuário não encontrado');

    const anoAtivo = usuario.anos[0]?.ano ?? new Date().getFullYear();

    return {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role.nome,
      nivel: usuario.nivel.nome,
      id_role: usuario.id_role,
      id_nivel: usuario.id_nivel,
      relacao: usuario.relacao,
      ano_ativo: anoAtivo,
    };
  }

  async mudarAno(idUsuario: string, ano: number) {
    const registro = await this.prisma.usuarioAno.findFirst({
      where: { id_usuario: idUsuario, deletado_em: null },
      orderBy: { data_criacao: 'desc' },
    });

    if (registro) {
      return this.prisma.usuarioAno.update({
        where: { id_usuario_ano: registro.id_usuario_ano },
        data: { ano, data_atualizacao: new Date() },
      });
    }

    return this.prisma.usuarioAno.create({
      data: { id_usuario: idUsuario, ano },
    });
  }
}
