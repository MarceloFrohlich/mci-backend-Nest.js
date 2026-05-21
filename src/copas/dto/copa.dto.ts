import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarCopaDto {
  @IsString()
  nome: string;

  @IsArray()
  @IsUUID('4', { each: true })
  ids_departamentos: string[];

  @IsDateString()
  inicio: string;

  @IsDateString()
  fim: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

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
  ate?: number;
}

export class AtualizarCopaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fim?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

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
  ate?: number;
}

export class FiltrarCopaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsUUID()
  id_departamento?: string;

  @IsOptional()
  @IsUUID()
  id_filial?: string;

  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fim?: string;
}
