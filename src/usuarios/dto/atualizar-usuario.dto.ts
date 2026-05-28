import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsUUID } from 'class-validator';

export class AtualizarUsuarioDto {
  @ApiPropertyOptional({
    description: '[Opcional] Novo nome completo do usuário',
    example: 'Maria Oliveira Santos',
    type: String,
  })
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo e-mail do usuário — deve ser único no sistema',
    example: 'maria.santos@mci.com',
    type: String,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Novo perfil de acesso: 1 = Admin Global, 2 = Admin Local',
    example: 1,
    type: Number,
    enum: [1, 2],
  })
  @IsOptional()
  @IsInt()
  id_role?: number;

  @ApiPropertyOptional({
    description: '[Opcional] Novo nível hierárquico: 1 = Franqueadora, 2 = Filial, 3 = Departamento',
    example: 3,
    type: Number,
    enum: [1, 2, 3],
  })
  @IsOptional()
  @IsInt()
  id_nivel?: number;

  @ApiPropertyOptional({
    description: '[Opcional] UUID da nova entidade vinculada (filial ou departamento). Para alterar senha, use PATCH /auth/alterar-senha',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  relacao?: string;
}
