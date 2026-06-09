import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { IsInt } from 'class-validator';

class MudarAnoDto {
  @ApiProperty({ description: 'Ano a ser ativado', example: 2026 })
  @IsInt()
  ano: number;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login — retorna JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', schema: {
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      token_type: 'bearer',
      expires_in: '8h',
      usuario: {
        id_usuario: 'uuid',
        nome: 'João Silva',
        email: 'joao@email.com',
        role: 'Admin Global',
        nivel: 'Franqueadora',
        id_role: 1,
        id_nivel: 1,
        relacao: null,
        ano_ativo: 2026,
      },
    },
  }})
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Logout (invalida sessão no cliente)' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return { mensagem: 'Logout realizado com sucesso' };
  }

  @ApiOperation({ summary: 'Retorna dados do usuário autenticado com ano ativo' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.authService.me(usuario.id_usuario);
  }

  @ApiOperation({ summary: 'Muda o ano ativo do usuário' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Patch('ano')
  mudarAno(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: MudarAnoDto) {
    return this.authService.mudarAno(usuario.id_usuario, dto.ano);
  }

  @ApiOperation({
    summary: 'Esqueci minha senha — envia código de 6 dígitos por e-mail',
    description:
      'Gera um código numérico de 6 dígitos válido por **15 minutos** e envia ao e-mail informado. ' +
      'Por segurança, a resposta é sempre a mesma independente de o e-mail existir ou não.',
  })
  @ApiBody({ type: EsqueciSenhaDto })
  @ApiResponse({
    status: 200,
    description: 'Código enviado (ou e-mail não encontrado — resposta idêntica por segurança)',
    schema: {
      example: {
        mensagem: 'Se o e-mail estiver cadastrado, você receberá um código de recuperação em breve.',
      },
    },
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('esqueci-senha')
  esqueciSenha(@Body() dto: EsqueciSenhaDto) {
    return this.authService.esqueciSenha(dto);
  }

  @ApiOperation({
    summary: 'Redefinir senha — valida código recebido por e-mail e define nova senha',
    description:
      'Fluxo: 1) chamar `POST /auth/esqueci-senha` para receber o código por e-mail; ' +
      '2) enviar o código + nova senha aqui. O código expira em 15 minutos e só pode ser usado uma vez.',
  })
  @ApiBody({ type: RedefinirSenhaDto })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
    schema: { example: { mensagem: 'Senha redefinida com sucesso' } },
  })
  @ApiResponse({ status: 400, description: 'Código inválido/expirado ou senhas não coincidem' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('redefinir-senha')
  redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.authService.redefinirSenha(dto);
  }

  @ApiOperation({
    summary: 'Alterar senha — usuário logado altera a própria senha',
    description:
      'Requer autenticação JWT. O usuário informa a senha atual para confirmação e a nova senha desejada.',
  })
  @ApiBody({ type: AlterarSenhaDto })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
    schema: { example: { mensagem: 'Senha alterada com sucesso' } },
  })
  @ApiResponse({ status: 400, description: 'Senha atual incorreta ou senhas não coincidem' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Patch('alterar-senha')
  alterarSenha(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: AlterarSenhaDto) {
    return this.authService.alterarSenha(usuario.id_usuario, dto);
  }
}
