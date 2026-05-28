import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AlterarSenhaDto {
  @ApiProperty({
    description: '[Obrigatório] Senha atual do usuário — usada para confirmar a identidade antes de alterar',
    example: 'senhaAtual123',
    type: String,
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  senha_atual: string;

  @ApiProperty({
    description: '[Obrigatório] Nova senha desejada — deve ser diferente da senha atual (mínimo 6 caracteres)',
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
