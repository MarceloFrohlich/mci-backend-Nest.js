import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarPrevidenciaDto {
  @ApiProperty({ description: 'UUID do jogo vinculado', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  id_jogo: string;

  @ApiPropertyOptional({ description: 'Unidade de medida do placar', example: 'pontos' })
  @IsOptional()
  @IsString()
  unidade_medida?: string;

  @ApiProperty({ description: 'Placar inicial (valor de partida)', example: 0 })
  @IsInt()
  placar_inicial: number;

  @ApiProperty({ description: 'Placar desejado (meta a atingir)', example: 100 })
  @IsInt()
  placar_desejado: number;

  @ApiProperty({ description: 'Data de início (formato ISO 8601)', example: '2025-01-01' })
  @IsDateString()
  data_inicio: string;

  @ApiProperty({ description: 'Data de fim (formato ISO 8601)', example: '2025-03-31' })
  @IsDateString()
  data_fim: string;

  @ApiPropertyOptional({ description: 'Data de início do período inativo (formato ISO 8601)', example: '2025-02-01' })
  @IsOptional()
  @IsDateString()
  inativo_de?: string;

  @ApiPropertyOptional({ description: 'Data de fim do período inativo (formato ISO 8601)', example: '2025-02-15' })
  @IsOptional()
  @IsDateString()
  inativo_ate?: string;

  @ApiPropertyOptional({ description: 'Verbo da meta (ex: Aumentar, Manter)', example: 'Aumentar' })
  @IsOptional()
  @IsString()
  verbo?: string;
}

export class AtualizarPrevidenciaDto {
  @ApiPropertyOptional({ description: 'Nova unidade de medida', example: 'vendas' })
  @IsOptional()
  @IsString()
  unidade_medida?: string;

  @ApiPropertyOptional({ description: 'Novo placar inicial', example: 10 })
  @IsOptional()
  @IsInt()
  placar_inicial?: number;

  @ApiPropertyOptional({ description: 'Novo placar desejado (meta)', example: 120 })
  @IsOptional()
  @IsInt()
  placar_desejado?: number;

  @ApiPropertyOptional({ description: 'Nova data de início (formato ISO 8601)', example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({ description: 'Nova data de fim (formato ISO 8601)', example: '2025-04-30' })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({ description: 'Nova data de início do período inativo', example: '2025-02-10' })
  @IsOptional()
  @IsDateString()
  inativo_de?: string;

  @ApiPropertyOptional({ description: 'Nova data de fim do período inativo', example: '2025-02-20' })
  @IsOptional()
  @IsDateString()
  inativo_ate?: string;

  @ApiPropertyOptional({ description: 'Novo verbo da meta', example: 'Manter' })
  @IsOptional()
  @IsString()
  verbo?: string;
}

export class AtualizarPlacarDto {
  @ApiProperty({ description: 'Novo valor do placar atual', example: 75 })
  @IsInt()
  placar_atual: number;
}
