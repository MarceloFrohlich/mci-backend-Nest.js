import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarJogoDto {
  @ApiProperty({ description: 'UUID da copa vinculada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  id_copa: string;

  @ApiPropertyOptional({ description: 'UUID do líder responsável', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsOptional()
  @IsUUID()
  id_lider?: string;

  @ApiProperty({ description: 'Nome do jogo', example: 'Jogo de Captação Março' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ description: 'Verbo da meta (ex: Aumentar, Reduzir)', example: 'Aumentar' })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({ description: 'Unidade de medida', example: 'contratos' })
  @IsOptional()
  @IsString()
  medida?: string;

  @ApiPropertyOptional({ description: 'Valor inicial da meta', example: 80 })
  @IsOptional()
  @IsNumber()
  de?: number;

  @ApiPropertyOptional({ description: 'Valor alvo da meta', example: 120 })
  @IsOptional()
  @IsNumber()
  para?: number;

  @ApiProperty({ description: 'Data de início do jogo (formato ISO 8601)', example: '2025-01-01' })
  @IsDateString()
  data_inicio: string;

  @ApiProperty({ description: 'Data de fim do jogo (formato ISO 8601)', example: '2025-03-31' })
  @IsDateString()
  data_fim: string;

  @ApiPropertyOptional({ description: 'Observação adicional sobre o jogo', example: 'Foco em novos planos empresariais.' })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({ description: 'Indica se o jogo possui PLP (Pesquisa de Lealdade)', example: false })
  @IsOptional()
  @IsBoolean()
  tem_plp?: boolean;
}

export class AtualizarJogoDto {
  @ApiPropertyOptional({ description: 'UUID do novo líder responsável', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsOptional()
  @IsUUID()
  id_lider?: string;

  @ApiPropertyOptional({ description: 'Novo nome do jogo', example: 'Jogo de Captação Q1 Revisado' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Novo verbo da meta', example: 'Reduzir' })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({ description: 'Nova unidade de medida', example: 'cancelamentos' })
  @IsOptional()
  @IsString()
  medida?: string;

  @ApiPropertyOptional({ description: 'Novo valor inicial da meta', example: 10 })
  @IsOptional()
  @IsNumber()
  de?: number;

  @ApiPropertyOptional({ description: 'Novo valor alvo da meta', example: 5 })
  @IsOptional()
  @IsNumber()
  para?: number;

  @ApiPropertyOptional({ description: 'Nova data de início (formato ISO 8601)', example: '2025-02-01' })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({ description: 'Nova data de fim (formato ISO 8601)', example: '2025-04-30' })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({ description: 'Nova observação sobre o jogo', example: 'Revisado após reunião de diretoria.' })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({ description: 'Atualiza se o jogo possui PLP', example: true })
  @IsOptional()
  @IsBoolean()
  tem_plp?: boolean;
}

export class FiltrarJogoDto {
  @ApiPropertyOptional({ description: 'Filtrar pelo nome (parcial)', example: 'Captação' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtrar pela copa', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_copa?: string;

  @ApiPropertyOptional({ description: 'Filtrar pelo departamento', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_departamento?: string;

  @ApiPropertyOptional({ description: 'Filtrar pelo líder', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsOptional()
  @IsUUID()
  id_lider?: string;
}
