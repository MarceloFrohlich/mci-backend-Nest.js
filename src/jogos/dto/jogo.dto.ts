import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarJogoDto {
  @ApiProperty({
    description: '[Obrigatório] UUID da copa à qual este jogo pertence',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsUUID()
  id_copa: string;

  @ApiPropertyOptional({
    description: '[Opcional] UUID do líder responsável pelo jogo',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_lider?: string;

  @ApiProperty({
    description: '[Obrigatório] Nome do jogo',
    example: 'Jogo de Captação Março',
    type: String,
  })
  @IsString()
  nome: string;

  @ApiPropertyOptional({
    description: '[Opcional] Verbo da meta (ex: Aumentar, Reduzir, Manter)',
    example: 'Aumentar',
    type: String,
  })
  @IsOptional()
  @IsString()
  verbo?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Unidade de medida da meta',
    example: 'contratos',
    type: String,
  })
  @IsOptional()
  @IsString()
  medida?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Valor inicial da meta (ponto de partida)',
    example: 80,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  de?: number;

  @ApiPropertyOptional({
    description: '[Opcional] Valor alvo da meta (ponto de chegada)',
    example: 120,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  para?: number;

  @ApiProperty({
    description: '[Obrigatório] Data de início do jogo (formato ISO 8601: AAAA-MM-DD)',
    example: '2025-01-01',
    type: String,
  })
  @IsDateString()
  data_inicio: string;

  @ApiProperty({
    description: '[Obrigatório] Data de fim do jogo (formato ISO 8601: AAAA-MM-DD)',
    example: '2025-03-31',
    type: String,
  })
  @IsDateString()
  data_fim: string;

  @ApiPropertyOptional({
    description: '[Opcional] Observação adicional sobre o jogo',
    example: 'Foco em novos planos empresariais.',
    type: String,
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Indica se o jogo possui PLP (Pesquisa de Lealdade de Parceiros). Padrão: false',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  tem_plp?: boolean;
}

export class AtualizarJogoDto {
  @ApiPropertyOptional({
    description: '[Opcional] UUID do novo líder responsável pelo jogo',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_lider?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo nome do jogo',
    example: 'Jogo de Captação Q1 Revisado',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

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
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  de?: number;

  @ApiPropertyOptional({
    description: '[Opcional] Novo valor alvo da meta',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  para?: number;

  @ApiPropertyOptional({
    description: '[Opcional] Nova data de início (formato ISO 8601: AAAA-MM-DD)',
    example: '2025-02-01',
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
    description: '[Opcional] Nova observação sobre o jogo',
    example: 'Revisado após reunião de diretoria.',
    type: String,
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Atualiza se o jogo possui PLP',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  tem_plp?: boolean;
}

export class FiltrarJogoDto {
  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nome (busca parcial, sem distinção de maiúsculas)',
    example: 'Captação',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pela copa vinculada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_copa?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo departamento',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_departamento?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo líder responsável',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_lider?: string;
}
