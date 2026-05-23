import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarObservacaoDto {
  @ApiProperty({ description: 'ID da previdência vinculada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  id_previdencia: string;

  @ApiProperty({ description: 'Texto da observação', example: 'Meta atingida no segundo semestre.' })
  @IsString()
  observacao: string;
}

export class AtualizarObservacaoDto {
  @ApiPropertyOptional({ description: 'Novo texto da observação', example: 'Meta revisada após auditoria.' })
  @IsOptional()
  @IsString()
  observacao?: string;
}
