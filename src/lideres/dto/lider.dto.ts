import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CriarLiderDto {
  @ApiProperty({
    description: '[Obrigatório] Nome completo do líder',
    example: 'João Silva',
    type: String,
  })
  @IsString()
  nome: string;
}

export class AtualizarLiderDto {
  @ApiPropertyOptional({
    description: '[Opcional] Novo nome do líder',
    example: 'João Silva Junior',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;
}

export class FiltrarLiderDto {
  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nome (busca parcial, sem distinção de maiúsculas)',
    example: 'João',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pela franqueadora vinculada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsString()
  id_franqueadora?: string;
}
