import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsUUID } from 'class-validator';

export class AtualizarUsuarioDto {
  @ApiPropertyOptional({ description: 'Novo nome do usuário', example: 'Maria Oliveira Santos' })
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional({ description: 'Novo e-mail do usuário', example: 'maria.santos@mci.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'ID do perfil: 1 = Admin Global, 2 = Admin Local', example: 1 })
  @IsOptional()
  @IsInt()
  id_role?: number;

  @ApiPropertyOptional({ description: 'ID do nível: 1 = Franqueadora, 2 = Filial, 3 = Departamento', example: 3 })
  @IsOptional()
  @IsInt()
  id_nivel?: number;

  @ApiPropertyOptional({ description: 'UUID da entidade vinculada (filial ou departamento)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  relacao?: string;
}
