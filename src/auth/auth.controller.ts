import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
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
}
