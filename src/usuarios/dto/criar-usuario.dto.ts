import { IsEmail, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CriarUsuarioDto {
  @IsString()
  nome: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @IsString()
  confirmacao_senha: string;

  @IsInt()
  id_role: number;

  @IsInt()
  id_nivel: number;

  @IsOptional()
  @IsUUID()
  relacao?: string;
}
