import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarCopaDto {
  @ApiProperty({ description: 'Nome da copa', example: 'Copa Q1 2025' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Lista de UUIDs dos departamentos participantes', example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids_departamentos: string[];

  @ApiProperty({ description: 'Data de início (formato ISO 8601)', example: '2025-01-01' })
  @IsDateString()
  inicio: string;

  @ApiProperty({ description: 'Data de fim (formato ISO 8601)', example: '2025-03-31' })
  @IsDateString()
  fim: string;

  @ApiPropertyOptional({ description: 'Objetivo da copa', example: 'Aumentar captação de novos clientes' })
  @IsOptional()
  @IsString()
  objetivo?: string;

  @ApiPropertyOptional({ description: 'Verbo da meta (ex: Aumentar, Reduzir)', example: 'Aumentar' })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({ description: 'Unidade de medida da meta', example: 'contratos' })
  @IsOptional()
  @IsString()
  medida?: string;

  @ApiPropertyOptional({ description: 'Valor inicial da meta', example: 100 })
  @IsOptional()
  @IsNumber()
  de?: number;

  @ApiPropertyOptional({ description: 'Valor final (alvo) da meta', example: 150 })
  @IsOptional()
  @IsNumber()
  ate?: number;
}

export class AtualizarCopaDto {
  @ApiPropertyOptional({ description: 'Novo nome da copa', example: 'Copa Q1 2025 Revisada' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Nova data de início (formato ISO 8601)', example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({ description: 'Nova data de fim (formato ISO 8601)', example: '2025-04-15' })
  @IsOptional()
  @IsDateString()
  fim?: string;

  @ApiPropertyOptional({ description: 'Novo objetivo da copa', example: 'Fidelizar clientes existentes' })
  @IsOptional()
  @IsString()
  objetivo?: string;

  @ApiPropertyOptional({ description: 'Novo verbo da meta', example: 'Reduzir' })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({ description: 'Nova unidade de medida', example: 'cancelamentos' })
  @IsOptional()
  @IsString()
  medida?: string;

  @ApiPropertyOptional({ description: 'Novo valor inicial da meta', example: 50 })
  @IsOptional()
  @IsNumber()
  de?: number;

  @ApiPropertyOptional({ description: 'Novo valor alvo da meta', example: 20 })
  @IsOptional()
  @IsNumber()
  ate?: number;
}

export class FiltrarCopaDto {
  @ApiPropertyOptional({ description: 'Filtrar pelo nome (parcial)', example: 'Q1' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtrar pelo departamento', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_departamento?: string;

  @ApiPropertyOptional({ description: 'Filtrar pela filial', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_filial?: string;

  @ApiPropertyOptional({ description: 'Filtrar pela franqueadora', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;

  @ApiPropertyOptional({ description: 'Filtrar por data de início (formato ISO 8601)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({ description: 'Filtrar por data de fim (formato ISO 8601)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  fim?: string;
}
