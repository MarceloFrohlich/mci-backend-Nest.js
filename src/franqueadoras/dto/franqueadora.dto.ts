import { IsOptional, IsString } from 'class-validator';

export class CriarFranqueadoraDto {
  @IsString()
  nome: string;
}

export class AtualizarFranqueadoraDto {
  @IsOptional()
  @IsString()
  nome?: string;
}

export class FiltrarFranqueadoraDto {
  @IsOptional()
  @IsString()
  nome?: string;
}
