import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarJogoDto {
  @IsUUID()
  id_copa: string;

  @IsOptional()
  @IsUUID()
  id_lider?: string;

  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  verbo?: string;

  @IsOptional()
  @IsString()
  medida?: string;

  @IsOptional()
  @IsNumber()
  de?: number;

  @IsOptional()
  @IsNumber()
  para?: number;

  @IsDateString()
  data_inicio: string;

  @IsDateString()
  data_fim: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsBoolean()
  tem_plp?: boolean;
}

export class AtualizarJogoDto {
  @IsOptional()
  @IsUUID()
  id_lider?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  verbo?: string;

  @IsOptional()
  @IsString()
  medida?: string;

  @IsOptional()
  @IsNumber()
  de?: number;

  @IsOptional()
  @IsNumber()
  para?: number;

  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsBoolean()
  tem_plp?: boolean;
}

export class FiltrarJogoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsUUID()
  id_copa?: string;

  @IsOptional()
  @IsUUID()
  id_departamento?: string;

  @IsOptional()
  @IsUUID()
  id_lider?: string;
}
