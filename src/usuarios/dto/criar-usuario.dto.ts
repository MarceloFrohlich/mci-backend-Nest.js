import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CriarUsuarioDto {
  @ApiProperty({
    description: '[Obrigatório] Nome completo do usuário',
    example: 'Maria Oliveira',
    type: String,
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: '[Obrigatório] E-mail do usuário — deve ser único no sistema',
    example: 'maria@mci.com',
    type: String,
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({
    description: '[Obrigatório] Senha inicial do usuário (mínimo 6 caracteres)',
    example: 'senha123',
    type: String,
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @ApiProperty({
    description: '[Obrigatório] Confirmação de senha — deve ser idêntica ao campo senha',
    example: 'senha123',
    type: String,
  })
  @IsString()
  confirmacao_senha: string;

  @ApiProperty({
    description: '[Obrigatório] Perfil de acesso: 1 = Admin Global, 2 = Admin Local',
    example: 2,
    type: Number,
    enum: [1, 2],
  })
  @IsInt()
  @IsIn([1, 2], { message: 'Perfil de acesso inválido' })
  id_role: number;

  @ApiProperty({
    description: '[Obrigatório] Nível hierárquico: 1 = Franqueadora, 2 = Filial, 3 = Departamento',
    example: 2,
    type: Number,
    enum: [1, 2, 3],
  })
  @IsInt()
  @IsIn([1, 2, 3], { message: 'Nível hierárquico inválido' })
  id_nivel: number;

  @ApiPropertyOptional({
    description: '[Opcional] UUID da entidade vinculada — obrigatório para nível 2 (Filial) e nível 3 (Departamento); ignorado para nível 1 (Franqueadora)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  relacao?: string;
}
