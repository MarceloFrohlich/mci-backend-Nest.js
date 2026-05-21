import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarDepartamentoDto {
  @IsString()
  nome: string;

  @IsUUID()
  id_filial: string;
}

export class AtualizarDepartamentoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsUUID()
  id_filial?: string;
}

export class FiltrarDepartamentoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsUUID()
  id_filial?: string;

  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;

  @IsOptional()
  com_copa?: boolean;
}
