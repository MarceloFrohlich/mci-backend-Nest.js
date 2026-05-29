import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

const transformarData = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);

export class CriarPrevidenciaDto {
  @ApiProperty({
    description: '[Obrigatório] UUID do jogo ao qual esta previdência pertence',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsUUID()
  id_jogo: string;

  @ApiPropertyOptional({
    description: '[Opcional] Unidade de medida do placar (ex: pontos, vendas, contratos)',
    example: 'pontos',
    type: String,
  })
  @IsOptional()
  @IsString()
  unidade_medida?: string;

  @ApiProperty({
    description: '[Obrigatório] Placar desejado — meta a ser atingida',
    example: 100,
    type: Number,
  })
  @IsInt()
  placar_desejado: number;

  @ApiProperty({
    description: '[Obrigatório] Data de início da previdência (formato ISO 8601: AAAA-MM-DD)',
    example: '2025-01-01',
    type: String,
  })
  @IsDateString()
  data_inicio: string;

  @ApiProperty({
    description: '[Obrigatório] Data de fim da previdência (formato ISO 8601: AAAA-MM-DD)',
    example: '2025-03-31',
    type: String,
  })
  @IsDateString()
  data_fim: string;

  @ApiPropertyOptional({
    description: '[Opcional] Data de início do período inativo — semanas sem lançamento de placar (formato ISO 8601)',
    example: '2025-02-01',
    type: String,
  })
  @Transform(transformarData)
  @IsOptional()
  @IsDateString()
  inativo_de?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Data de fim do período inativo (formato ISO 8601)',
    example: '2025-02-15',
    type: String,
  })
  @Transform(transformarData)
  @IsOptional()
  @IsDateString()
  inativo_ate?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Verbo da meta (ex: Aumentar, Manter, Reduzir)',
    example: 'Aumentar',
    type: String,
  })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Indica se o período de inatividade deve ser excluído do cálculo de semanas. Padrão: false',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  excluir_periodo?: boolean;
}

export class AtualizarPrevidenciaDto {
  @ApiPropertyOptional({
    description: '[Opcional] Nova unidade de medida do placar',
    example: 'vendas',
    type: String,
  })
  @IsOptional()
  @IsString()
  unidade_medida?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo placar desejado (meta)',
    example: 120,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  placar_desejado?: number;

  @ApiPropertyOptional({
    description: '[Opcional] Nova data de início (formato ISO 8601: AAAA-MM-DD)',
    example: '2025-01-15',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Nova data de fim (formato ISO 8601: AAAA-MM-DD)',
    example: '2025-04-30',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Nova data de início do período inativo (formato ISO 8601)',
    example: '2025-02-10',
    type: String,
  })
  @Transform(transformarData)
  @IsOptional()
  @IsDateString()
  inativo_de?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Nova data de fim do período inativo (formato ISO 8601)',
    example: '2025-02-20',
    type: String,
  })
  @Transform(transformarData)
  @IsOptional()
  @IsDateString()
  inativo_ate?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo verbo da meta',
    example: 'Manter',
    type: String,
  })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Atualiza se o período de inatividade deve ser excluído do cálculo',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  excluir_periodo?: boolean;
}

export class AtualizarPlacarDto {
  @ApiProperty({
    description: '[Obrigatório] Novo valor do placar atual — representa o progresso acumulado até o momento',
    example: 75,
    type: Number,
  })
  @IsInt()
  placar_atual: number;
}

export class LancarSemanaDto {
  @ApiProperty({ description: '[Obrigatório] Valor realizado acumulado até esta semana', example: 100, type: Number })
  @IsInt()
  realizado: number;

  @ApiProperty({ description: '[Obrigatório] Valor de compromisso da semana', example: 120, type: Number })
  @IsInt()
  compromisso: number;

  @ApiPropertyOptional({ description: '[Opcional] Total de entrevistados — necessário quando tem_plp = true', example: 10, type: Number })
  @IsOptional()
  @IsInt()
  entrevistaqtd?: number;

  @ApiPropertyOptional({ description: '[Opcional] Promotores — necessário quando tem_plp = true', example: 9, type: Number })
  @IsOptional()
  @IsInt()
  promotores?: number;

  @ApiPropertyOptional({ description: '[Opcional] Neutros — necessário quando tem_plp = true', example: 1, type: Number })
  @IsOptional()
  @IsInt()
  neutros?: number;

  @ApiPropertyOptional({ description: '[Opcional] Detratores — necessário quando tem_plp = true', example: 0, type: Number })
  @IsOptional()
  @IsInt()
  detratores?: number;
}
