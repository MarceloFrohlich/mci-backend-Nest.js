import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID } from 'class-validator';

export class CriarPlpDto {
  @ApiProperty({
    description: '[Obrigatório] UUID da previdência à qual este PLP está vinculado',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsUUID()
  id_previdencia: string;

  @ApiPropertyOptional({
    description: '[Opcional] UUID da atualização de placar relacionada a este PLP',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_atualizacao?: string;

  @ApiProperty({
    description: '[Obrigatório] Total de respondentes da pesquisa de lealdade',
    example: 200,
    type: Number,
  })
  @IsInt()
  respondentes: number;

  @ApiProperty({
    description: '[Obrigatório] Quantidade de detratores (respondentes com nota 0 a 6)',
    example: 30,
    type: Number,
  })
  @IsInt()
  detratores: number;

  @ApiProperty({
    description: '[Obrigatório] Quantidade de propagadores (respondentes com nota 9 ou 10)',
    example: 120,
    type: Number,
  })
  @IsInt()
  propagadores: number;

  @ApiProperty({
    description: '[Obrigatório] Quantidade de neutros (respondentes com nota 7 ou 8)',
    example: 50,
    type: Number,
  })
  @IsInt()
  neutros: number;
}
