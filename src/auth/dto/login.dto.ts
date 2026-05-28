import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '[Obrigatório] E-mail cadastrado na conta',
    example: 'admin@mci.com',
    type: String,
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({
    description: '[Obrigatório] Senha do usuário (mínimo 6 caracteres)',
    example: 'admin123',
    type: String,
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;
}
