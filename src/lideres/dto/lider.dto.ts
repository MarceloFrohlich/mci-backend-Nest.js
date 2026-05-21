import { IsOptional, IsString } from 'class-validator';

export class CriarLiderDto {
  @IsString()
  nome: string;
}

export class AtualizarLiderDto {
  @IsOptional()
  @IsString()
  nome?: string;
}

export class FiltrarLiderDto {
  @IsOptional()
  @IsString()
  nome?: string;
}
