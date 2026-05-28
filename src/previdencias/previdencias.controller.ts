import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrevidenciasService } from './previdencias.service';
import { CriarPrevidenciaDto, AtualizarPrevidenciaDto, AtualizarPlacarDto, LancarSemanaDto } from './dto/previdencia.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Previdências')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('previdencias')
export class PrevidenciasController {
  constructor(private readonly previdenciasService: PrevidenciasService) {}

  @ApiOperation({ summary: 'Lista previdências de um jogo com meta semanal e progresso calculados' })
  @Get('por-jogo/:id')
  listarPorJogo(@Param('id', ParseUUIDPipe) id: string) {
    return this.previdenciasService.listarPorJogo(id);
  }

  @ApiOperation({ summary: 'Lista previdências de um departamento com cálculos de progresso' })
  @Get('por-departamento/:id')
  listarPorDepartamento(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.previdenciasService.listarPorDepartamento(id, usuario);
  }

  @ApiOperation({ summary: 'Lista histórico de atualizações de placar de uma previdência' })
  @Get(':id/atualizacoes')
  listarAtualizacoes(@Param('id', ParseUUIDPipe) id: string) {
    return this.previdenciasService.listarAtualizacoes(id);
  }

  @ApiOperation({ summary: 'Busca previdência por ID com meta semanal calculada' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.previdenciasService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Cria previdência — placar_atual inicializado com placar_inicial' })
  @Post()
  criar(@Body() dto: CriarPrevidenciaDto) {
    return this.previdenciasService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualiza dados da previdência (datas, placares, inatividade, verbo)' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarPrevidenciaDto) {
    return this.previdenciasService.atualizar(id, dto);
  }

  @ApiOperation({ summary: 'Remove previdência e todo seu histórico em cascata' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.previdenciasService.remover(id);
  }

  @ApiOperation({ summary: 'Duplica previdência (reinicia placar_atual para placar_inicial)' })
  @Post(':id/duplicar')
  duplicar(@Param('id', ParseUUIDPipe) id: string) {
    return this.previdenciasService.duplicar(id);
  }

  @ApiOperation({ summary: 'Registra atualização semanal de placar — cria histórico e atualiza placar_atual' })
  @Post(':id/placar')
  atualizarPlacar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarPlacarDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.previdenciasService.atualizarPlacar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Lança ou corrige o placar de uma semana específica (upsert)' })
  @Post(':id/semanas/:numero')
  lancarSemana(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('numero', ParseIntPipe) numero: number,
    @Body() dto: LancarSemanaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.previdenciasService.lancarSemana(id, numero, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove uma atualização de placar específica do histórico' })
  @Delete('atualizacoes/:id')
  removerAtualizacao(@Param('id', ParseUUIDPipe) id: string) {
    return this.previdenciasService.removerAtualizacao(id);
  }
}
