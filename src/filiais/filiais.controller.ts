import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FiliaisService } from './filiais.service';
import { CriarFilialDto, AtualizarFilialDto, FiltrarFilialDto } from './dto/filial.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL } from '../common/utils/permissoes.util';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Filiais')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('filiais')
export class FiliaisController {
  constructor(private readonly filiaisService: FiliaisService) {}

  @ApiOperation({ summary: 'Lista filiais conforme permissões do solicitante' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.filiaisService.listar(usuario);
  }

  @ApiOperation({ summary: 'Lista todas as franqueadoras (para select)' })
  @Get('franqueadoras')
  listarFranqueadoras() {
    return this.filiaisService.listarFranqueadoras();
  }

  @ApiOperation({ summary: 'Busca filial por ID' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.filiaisService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria nova filial vinculada a uma franqueadora' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post()
  criar(@Body() dto: CriarFilialDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.filiaisService.criar(dto, usuario);
  }

  @ApiOperation({ summary: 'Atualiza filial' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarFilialDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.filiaisService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove filial em cascata (departamentos)' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.filiaisService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Filtra filiais por nome ou franqueadora' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarFilialDto) {
    return this.filiaisService.filtrar(usuario, dto);
  }
}
