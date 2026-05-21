import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FiliaisService } from './filiais.service';
import { CriarFilialDto, AtualizarFilialDto, FiltrarFilialDto } from './dto/filial.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Filiais')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
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
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.filiaisService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Cria nova filial vinculada a uma franqueadora' })
  @Post()
  criar(@Body() dto: CriarFilialDto) {
    return this.filiaisService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualiza filial' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarFilialDto) {
    return this.filiaisService.atualizar(id, dto);
  }

  @ApiOperation({ summary: 'Remove filial em cascata (departamentos)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.filiaisService.remover(id);
  }

  @ApiOperation({ summary: 'Filtra filiais por nome ou franqueadora' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarFilialDto) {
    return this.filiaisService.filtrar(usuario, dto);
  }
}
