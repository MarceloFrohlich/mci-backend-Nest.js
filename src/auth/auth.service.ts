import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { LoginDto } from './dto/login.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
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

  async esqueciSenha(dto: EsqueciSenhaDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email, deletado_em: null },
    });

    // Resposta genérica para não revelar se o e-mail existe
    const resposta = {
      mensagem: 'Se o e-mail estiver cadastrado, você receberá um código de recuperação em breve.',
    };

    if (!usuario) return resposta;

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.tokenRecuperacaoSenha.create({
      data: {
        id_usuario: usuario.id_usuario,
        codigo,
        expira_em: expiraEm,
      },
    });

    await this.mailerService.enviarCodigoRecuperacao(usuario.email, usuario.nome, codigo);

    return resposta;
  }

  async redefinirSenha(dto: RedefinirSenhaDto) {
    if (dto.nova_senha !== dto.confirmacao_senha) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email, deletado_em: null },
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const token = await this.prisma.tokenRecuperacaoSenha.findFirst({
      where: {
        id_usuario: usuario.id_usuario,
        codigo: dto.codigo,
        usado_em: null,
        expira_em: { gt: new Date() },
      },
      orderBy: { data_criacao: 'desc' },
    });

    if (!token) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    const senhaHash = await bcrypt.hash(dto.nova_senha, 10);

    await this.prisma.$transaction([
      this.prisma.tokenRecuperacaoSenha.update({
        where: { id_token: token.id_token },
        data: { usado_em: new Date() },
      }),
      this.prisma.usuario.update({
        where: { id_usuario: usuario.id_usuario },
        data: { senha: senhaHash, data_atualizacao: new Date() },
      }),
    ]);

    return { mensagem: 'Senha redefinida com sucesso' };
  }

  async alterarSenha(idUsuario: string, dto: AlterarSenhaDto) {
    if (dto.nova_senha !== dto.confirmacao_senha) {
      throw new BadRequestException('As senhas não coincidem');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: { id_usuario: idUsuario, deletado_em: null },
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const senhaCorreta = await bcrypt.compare(dto.senha_atual, usuario.senha);
    if (!senhaCorreta) {
      throw new BadRequestException('Senha atual incorreta');
    }

    if (dto.senha_atual === dto.nova_senha) {
      throw new BadRequestException('A nova senha deve ser diferente da senha atual');
    }

    const senhaHash = await bcrypt.hash(dto.nova_senha, 10);

    await this.prisma.usuario.update({
      where: { id_usuario: idUsuario },
      data: { senha: senhaHash, data_atualizacao: new Date() },
    });

    return { mensagem: 'Senha alterada com sucesso' };
  }
}
