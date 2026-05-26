import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EsqueciSenhaDto {
  @ApiProperty({
    description: 'E-mail cadastrado na conta',
    example: 'joao.silva@mci.com',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}
