import { IsEmail, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;

  @IsOptional()
  @IsString()
  confirmacao_senha?: string;

  @IsOptional()
  @IsInt()
  id_role?: number;

  @IsOptional()
  @IsInt()
  id_nivel?: number;

  @IsOptional()
  @IsUUID()
  relacao?: string;
}
