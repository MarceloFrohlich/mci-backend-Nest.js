import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FranqueadorasService } from './franqueadoras.service';
import { CriarFranqueadoraDto, AtualizarFranqueadoraDto, FiltrarFranqueadoraDto } from './dto/franqueadora.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL } from '../common/utils/permissoes.util';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Franqueadoras')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('franqueadoras')
export class FranqueadorasController {
  constructor(private readonly franqueadorasService: FranqueadorasService) {}

  @ApiOperation({ summary: 'Lista franqueadoras conforme permissões do solicitante' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.franqueadorasService.listar(usuario);
  }

  @ApiOperation({ summary: 'Busca franqueadora por ID' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.franqueadorasService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria nova franqueadora' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post()
  criar(@Body() dto: CriarFranqueadoraDto) {
    return this.franqueadorasService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualiza franqueadora' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarFranqueadoraDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.franqueadorasService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove franqueadora em cascata (filiais e departamentos)' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.franqueadorasService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Filtra franqueadoras por nome' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarFranqueadoraDto) {
    return this.franqueadorasService.filtrar(usuario, dto);
  }
}
