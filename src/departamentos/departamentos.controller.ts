import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepartamentosService } from './departamentos.service';
import { CriarDepartamentoDto, AtualizarDepartamentoDto, FiltrarDepartamentoDto } from './dto/departamento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL } from '../common/utils/permissoes.util';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Departamentos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departamentos')
export class DepartamentosController {
  constructor(private readonly departamentosService: DepartamentosService) {}

  @ApiOperation({ summary: 'Lista departamentos conforme permissões do solicitante' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.departamentosService.listar(usuario);
  }

  @ApiOperation({ summary: 'Lista departamentos que possuem ao menos uma copa ativa' })
  @Get('com-copa')
  comCopa(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.departamentosService.comCopa(usuario);
  }

  @ApiOperation({ summary: 'Lista filiais disponíveis (para select)' })
  @Get('filiais')
  listarFiliais() {
    return this.departamentosService.listarFiliais();
  }

  @ApiOperation({ summary: 'Busca departamento por ID' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.departamentosService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria novo departamento vinculado a uma filial' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post()
  criar(@Body() dto: CriarDepartamentoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.departamentosService.criar(dto, usuario);
  }

  @ApiOperation({ summary: 'Atualiza departamento' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarDepartamentoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.departamentosService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove departamento (soft delete)' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.departamentosService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Filtra departamentos por nome, filial, franqueadora ou com/sem copa' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarDepartamentoDto) {
    return this.departamentosService.filtrar(usuario, dto);
  }
}
