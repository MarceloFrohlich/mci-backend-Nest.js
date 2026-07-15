import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CopasService } from './copas.service';
import { CriarCopaDto, AtualizarCopaDto, FiltrarCopaDto } from './dto/copa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL } from '../common/utils/permissoes.util';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Copas')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('copas')
export class CopasController {
  constructor(private readonly copasService: CopasService) {}

  @ApiOperation({ summary: 'Lista copas do ano ativo conforme permissões' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.listar(usuario);
  }

  @ApiOperation({ summary: 'Lista copas simplificadas (id + nome) para select' })
  @Get('select')
  listarParaSelect(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.listarParaSelect(usuario);
  }

  @ApiOperation({ summary: 'Lista copas de um departamento específico' })
  @Get('por-departamento/:id')
  porDepartamento(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.porDepartamento(id, usuario);
  }

  @ApiOperation({ summary: 'Busca copa por ID com dados hierárquicos completos' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria copa — aceita múltiplos departamentos (cria uma copa por departamento)' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post()
  criar(@Body() dto: CriarCopaDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.criar(dto, usuario);
  }

  @ApiOperation({ summary: 'Atualiza dados da copa' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarCopaDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove copa em cascata (jogos, previdências, atualizações, PLPs, observações)' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Filtra copas por nome, departamento, filial, franqueadora ou período' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarCopaDto) {
    return this.copasService.filtrar(usuario, dto);
  }
}
