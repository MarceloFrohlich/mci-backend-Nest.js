import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID } from 'class-validator';

export class CriarPlpDto {
  @ApiProperty({ description: 'UUID da previdência vinculada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  id_previdencia: string;

  @ApiPropertyOptional({ description: 'UUID da atualização de placar relacionada', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsOptional()
  @IsUUID()
  id_atualizacao?: string;

  @ApiProperty({ description: 'Total de respondentes da pesquisa', example: 200 })
  @IsInt()
  respondentes: number;

  @ApiProperty({ description: 'Quantidade de detratores (nota 0–6)', example: 30 })
  @IsInt()
  detratores: number;

  @ApiProperty({ description: 'Quantidade de propagadores (nota 9–10)', example: 120 })
  @IsInt()
  propagadores: number;

  @ApiProperty({ description: 'Quantidade de neutros (nota 7–8)', example: 50 })
  @IsInt()
  neutros: number;
}
