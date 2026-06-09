import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LideresService } from './lideres.service';
import { CriarLiderDto, AtualizarLiderDto, FiltrarLiderDto } from './dto/lider.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Líderes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('lideres')
export class LideresController {
  constructor(private readonly lideresService: LideresService) {}

  @ApiOperation({ summary: 'Lista líderes — admin global vê todos, demais veem apenas da sua franqueadora' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.lideresService.listar(usuario);
  }

  @ApiOperation({ summary: 'Busca líder por ID' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.lideresService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria líder (vinculado automaticamente à franqueadora do usuário)' })
  @Post()
  criar(@Body() dto: CriarLiderDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.lideresService.criar(dto, usuario);
  }

  @ApiOperation({ summary: 'Atualiza nome do líder' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarLiderDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.lideresService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove líder (soft delete)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.lideresService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Filtra líderes por nome' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarLiderDto) {
    return this.lideresService.filtrar(usuario, dto);
  }
}
