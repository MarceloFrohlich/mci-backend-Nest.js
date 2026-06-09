import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GraficosService } from './graficos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Gráficos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('graficos')
export class GraficosController {
  constructor(private readonly graficosService: GraficosService) {}

  @ApiOperation({ summary: 'Retorna dados de previdências de uma copa para gráficos (histórico + progresso)' })
  @Get('previdencias/:id')
  graficoPrevidencias(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.graficosService.graficoPrevidencias(id, usuario);
  }

  @ApiOperation({ summary: 'Retorna dados de jogos de uma copa com progresso calculado por previdência' })
  @Get('jogos/:id')
  graficoJogos(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.graficosService.graficoJogos(id, usuario);
  }
}
