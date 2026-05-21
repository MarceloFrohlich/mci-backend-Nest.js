import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ObservacoesService } from './observacoes.service';
import { CriarObservacaoDto, AtualizarObservacaoDto } from './dto/observacao.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Observações')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('observacoes')
export class ObservacoesController {
  constructor(private readonly observacoesService: ObservacoesService) {}

  @ApiOperation({ summary: 'Lista observações de uma previdência' })
  @Get('por-previdencia/:id')
  listarPorPrevidencia(@Param('id', ParseUUIDPipe) id: string) {
    return this.observacoesService.listarPorPrevidencia(id);
  }

  @ApiOperation({ summary: 'Busca observação por ID' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.observacoesService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Cria observação vinculada a uma previdência' })
  @Post()
  criar(@Body() dto: CriarObservacaoDto) {
    return this.observacoesService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualiza texto da observação' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarObservacaoDto) {
    return this.observacoesService.atualizar(id, dto);
  }

  @ApiOperation({ summary: 'Remove observação (soft delete)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.observacoesService.remover(id);
  }
}
