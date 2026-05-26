import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AlterarSenhaDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'senhaAtual123',
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha_atual: string;

  @ApiProperty({
    description: 'Nova senha desejada (mínimo 6 caracteres)',
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
