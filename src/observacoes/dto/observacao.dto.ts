import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarObservacaoDto {
  @ApiProperty({
    description: '[Obrigatório] UUID da previdência à qual esta observação será vinculada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsUUID()
  id_previdencia: string;

  @ApiProperty({
    description: '[Obrigatório] Texto da observação',
    example: 'Meta atingida no segundo semestre graças ao reforço da equipe.',
    type: String,
  })
  @IsString()
  observacao: string;
}

export class AtualizarObservacaoDto {
  @ApiPropertyOptional({
    description: '[Opcional] Novo texto da observação',
    example: 'Meta revisada após auditoria interna de resultados.',
    type: String,
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}
