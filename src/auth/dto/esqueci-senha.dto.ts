import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EsqueciSenhaDto {
  @ApiProperty({
    description: '[Obrigatório] E-mail cadastrado na conta — um código de 6 dígitos válido por 15 minutos será enviado para este endereço',
    example: 'joao.silva@mci.com',
    type: String,
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}
