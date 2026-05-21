import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarFilialDto {
  @IsString()
  nome: string;

  @IsUUID()
  id_franqueadora: string;
}

export class AtualizarFilialDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;
}

export class FiltrarFilialDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;
}
