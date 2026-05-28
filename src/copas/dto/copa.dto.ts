import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarCopaDto {
  @ApiProperty({
    description: '[Obrigatório] Nome da copa',
    example: 'Copa Q1 2025',
    type: String,
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: '[Obrigatório] Lista de UUIDs dos departamentos participantes',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  ids_departamentos: string[];

  @ApiProperty({
    description: '[Obrigatório] UUID do líder responsável pela copa',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsUUID('4')
  id_lider: string;

  @ApiProperty({
    description: '[Obrigatório] Data de início (formato ISO 8601)',
    example: '2025-01-01',
    type: String,
  })
  @IsDateString()
  inicio: string;

  @ApiProperty({
    description: '[Obrigatório] Data de fim (formato ISO 8601)',
    example: '2025-03-31',
    type: String,
  })
  @IsDateString()
  fim: string;

  @ApiPropertyOptional({
    description: '[Opcional] Objetivo geral da copa — campo de apoio para uso futuro',
    example: 'Aumentar captação de novos clientes',
    type: String,
  })
  @IsOptional()
  @IsString()
  objetivo?: string;

  @ApiProperty({
    description: '[Obrigatório] Verbo da meta (ex: Aumentar, Reduzir)',
    example: 'Aumentar',
    type: String,
  })
  @IsString()
  verbo: string;

  @ApiProperty({
    description: '[Obrigatório] Unidade de medida da meta',
    example: 'contratos',
    type: String,
  })
  @IsString()
  medida: string;

  @ApiProperty({
    description: '[Obrigatório] Valor inicial da meta',
    example: 100,
    type: Number,
  })
  @IsNumber()
  de: number;

  @ApiProperty({
    description: '[Obrigatório] Valor final (alvo) da meta',
    example: 150,
    type: Number,
  })
  @IsNumber()
  ate: number;
}

export class AtualizarCopaDto {
  @ApiPropertyOptional({
    description: '[Opcional] Novo nome da copa',
    example: 'Copa Q1 2025 Revisada',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] UUID do novo líder responsável',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID('4')
  id_lider?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Nova data de início (formato ISO 8601)',
    example: '2025-01-15',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Nova data de fim (formato ISO 8601)',
    example: '2025-04-15',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  fim?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo objetivo da copa',
    example: 'Fidelizar clientes existentes',
    type: String,
  })
  @IsOptional()
  @IsString()
  objetivo?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo verbo da meta',
    example: 'Reduzir',
    type: String,
  })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Nova unidade de medida',
    example: 'cancelamentos',
    type: String,
  })
  @IsOptional()
  @IsString()
  medida?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo valor inicial da meta',
    example: 50,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  de?: number;

  @ApiPropertyOptional({
    description: '[Opcional] Novo valor alvo da meta',
    example: 20,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  ate?: number;
}

export class FiltrarCopaDto {
  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nome (parcial)',
    example: 'Q1',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo departamento',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_departamento?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pela filial',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_filial?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pela franqueadora',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar por data de início (formato ISO 8601)',
    example: '2025-01-01',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar por data de fim (formato ISO 8601)',
    example: '2025-12-31',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  fim?: string;
}
