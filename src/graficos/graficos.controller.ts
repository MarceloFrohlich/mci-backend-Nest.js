import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GraficosService } from './graficos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Gráficos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('graficos')
export class GraficosController {
  constructor(private readonly graficosService: GraficosService) {}

  @ApiOperation({ summary: 'Retorna dados de previdências de uma copa para gráficos (histórico + progresso)' })
  @Get('previdencias/:id')
  graficoPrevidencias(@Param('id', ParseUUIDPipe) id: string) {
    return this.graficosService.graficoPrevidencias(id);
  }

  @ApiOperation({ summary: 'Retorna dados de jogos de uma copa com progresso calculado por previdência' })
  @Get('jogos/:id')
  graficoJogos(@Param('id', ParseUUIDPipe) id: string) {
    return this.graficosService.graficoJogos(id);
  }
}
