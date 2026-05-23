import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CriarUsuarioDto {
  @ApiProperty({ description: 'Nome completo do usuário', example: 'Maria Oliveira' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'E-mail do usuário', example: 'maria@mci.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ description: 'Senha (mínimo 6 caracteres)', example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @ApiProperty({ description: 'Confirmação de senha (deve ser igual à senha)', example: 'senha123' })
  @IsString()
  confirmacao_senha: string;

  @ApiProperty({ description: 'ID do perfil: 1 = Admin Global, 2 = Admin Local', example: 2 })
  @IsInt()
  id_role: number;

  @ApiProperty({ description: 'ID do nível: 1 = Franqueadora, 2 = Filial, 3 = Departamento', example: 2 })
  @IsInt()
  id_nivel: number;

  @ApiPropertyOptional({ description: 'UUID da entidade vinculada (filial ou departamento, conforme id_nivel)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  relacao?: string;
}
