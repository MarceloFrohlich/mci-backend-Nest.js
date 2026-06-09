import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { FiltrarUsuarioDto } from './dto/filtrar-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE_ADMIN_GLOBAL } from '../common/utils/permissoes.util';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Usuários')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE_ADMIN_GLOBAL)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @ApiOperation({ summary: 'Lista usuários conforme permissões do solicitante' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.usuariosService.listar(usuario);
  }

  @ApiOperation({ summary: 'Retorna roles, níveis, franqueadoras, filiais e departamentos para formulário' })
  @Get('formulario')
  dadosFormulario() {
    return this.usuariosService.dadosFormulario();
  }

  @ApiOperation({ summary: 'Busca usuário por ID' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Cria novo usuário' })
  @Post()
  criar(@Body() dto: CriarUsuarioDto) {
    return this.usuariosService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualiza usuário' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarUsuarioDto) {
    return this.usuariosService.atualizar(id, dto);
  }

  @ApiOperation({ summary: 'Remove usuário (soft delete — gera e-mail hash)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.remover(id);
  }

  @ApiOperation({ summary: 'Filtra usuários por nome, e-mail, role ou nível' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarUsuarioDto) {
    return this.usuariosService.filtrar(usuario, dto);
  }
}
