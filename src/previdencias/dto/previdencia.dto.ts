import { IsDateString, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarPrevidenciaDto {
  @IsUUID()
  id_jogo: string;

  @IsOptional()
  @IsString()
  unidade_medida?: string;

  @IsInt()
  placar_inicial: number;

  @IsInt()
  placar_desejado: number;

  @IsDateString()
  data_inicio: string;

  @IsDateString()
  data_fim: string;

  @IsOptional()
  @IsDateString()
  inativo_de?: string;

  @IsOptional()
  @IsDateString()
  inativo_ate?: string;

  @IsOptional()
  @IsString()
  verbo?: string;
}

export class AtualizarPrevidenciaDto {
  @IsOptional()
  @IsString()
  unidade_medida?: string;

  @IsOptional()
  @IsInt()
  placar_inicial?: number;

  @IsOptional()
  @IsInt()
  placar_desejado?: number;

  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @IsOptional()
  @IsDateString()
  inativo_de?: string;

  @IsOptional()
  @IsDateString()
  inativo_ate?: string;

  @IsOptional()
  @IsString()
  verbo?: string;
}

export class AtualizarPlacarDto {
  @IsInt()
  placar_atual: number;
}
