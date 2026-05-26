import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @ApiProperty({
    description: 'E-mail cadastrado na conta',
    example: 'joao.silva@mci.com',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({
    description: 'Código de 6 dígitos recebido por e-mail',
    example: '482931',
  })
  @IsString()
  @Length(6, 6, { message: 'O código deve ter exatamente 6 dígitos' })
  codigo: string;

  @ApiProperty({
    description: 'Nova senha (mínimo 6 caracteres)',
    example: 'novaSenha@2026',
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  nova_senha: string;

  @ApiProperty({
    description: 'Confirmação da nova senha (deve ser idêntica a nova_senha)',
    example: 'novaSenha@2026',
  })
  @IsString()
  confirmacao_senha: string;
}
