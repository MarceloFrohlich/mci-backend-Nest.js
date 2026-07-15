import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { FiltrarUsuarioDto } from './dto/filtrar-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL } from '../common/utils/permissoes.util';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Usuários')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
// admins locais gerenciam apenas usuários da própria cadeia (validado no service)
@Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
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
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.usuariosService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria novo usuário' })
  @Post()
  criar(@Body() dto: CriarUsuarioDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.usuariosService.criar(dto, usuario);
  }

  @ApiOperation({ summary: 'Atualiza usuário' })
  @Put(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarUsuarioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.usuariosService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove usuário (soft delete — gera e-mail hash)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.usuariosService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Filtra usuários por nome, e-mail, role ou nível' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarUsuarioDto) {
    return this.usuariosService.filtrar(usuario, dto);
  }
}
