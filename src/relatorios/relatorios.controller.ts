import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL } from '../common/utils/permissoes.util';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { IsIn, IsNumber, IsOptional } from 'class-validator';

class StatusDto {
  @ApiPropertyOptional({
    description: "Resultado da meta ('success' ou 'unsuccess'). Quando o jogo tem meta (para), é calculado automaticamente a partir do valor e este campo é ignorado",
    example: 'success',
  })
  @IsOptional() @IsIn(['success', 'unsuccess']) status?: string;
  @ApiProperty({ description: 'Valor atingido do MCI', example: 100, type: Number })
  @IsNumber() valor: number;
}

@ApiTags('Relatórios')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @ApiOperation({
    summary: 'Lista os jogos de uma copa, cada um com suas previdências, incluindo meta semanal e progresso atual (até hoje) e total (anual) em percentual',
  })
  @Get('copa/:id/previdencias')
  listarPrevidenciasPorCopa(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.relatoriosService.listarPrevidenciasPorCopa(id, usuario);
  }

  @ApiOperation({ summary: 'Cria ou atualiza status de um jogo' })
  @Roles(ROLE_ADMIN_GLOBAL, ROLE_ADMIN_LOCAL)
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
