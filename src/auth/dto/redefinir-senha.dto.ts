import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @ApiProperty({
    description: '[Obrigatório] E-mail cadastrado na conta',
    example: 'joao.silva@mci.com',
    type: String,
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({
    description: '[Obrigatório] Código de 6 dígitos recebido por e-mail (válido por 15 minutos, uso único)',
    example: '482931',
    type: String,
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'O código deve ter exatamente 6 dígitos' })
  codigo: string;

  @ApiProperty({
    description: '[Obrigatório] Nova senha desejada (mínimo 6 caracteres)',
    example: 'novaSenha@2026',
    type: String,
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  nova_senha: string;

  @ApiProperty({
    description: '[Obrigatório] Confirmação da nova senha — deve ser idêntica a nova_senha',
    example: 'novaSenha@2026',
    type: String,
  })
  @IsString()
  confirmacao_senha: string;
}
