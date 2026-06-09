import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { IsOptional, IsString } from 'class-validator';

class StatusDto {
  @ApiPropertyOptional({ description: 'Status do jogo', example: 'ativo' })
  @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ description: 'Valor associado ao status', example: '100' })
  @IsOptional() @IsString() valor?: string;
}

@ApiTags('Relatórios')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @ApiOperation({
    summary: 'Gera relatório completo de uma copa com cálculos de progresso, meta semanal e PLP por previdência',
  })
  @Get('copa/:id')
  gerarRelatorio(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.relatoriosService.gerarRelatorio(id, usuario);
  }

  @ApiOperation({ summary: 'Cria ou atualiza status de um jogo' })
  @Post('status/:idJogo')
  criarStatus(@Param('idJogo', ParseUUIDPipe) idJogo: string, @Body() dto: StatusDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.relatoriosService.criarStatus(idJogo, dto.status, dto.valor, usuario);
  }

  @ApiOperation({ summary: 'Atualiza status existente de um jogo' })
  @Patch('status/:id')
  atualizarStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StatusDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.relatoriosService.atualizarStatus(id, dto.status, dto.valor, usuario);
  }
}
