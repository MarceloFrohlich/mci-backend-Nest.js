import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarFilialDto {
  @ApiProperty({
    description: '[Obrigatório] Nome da filial',
    example: 'Filial Centro',
    type: String,
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: '[Obrigatório] UUID da franqueadora à qual esta filial pertence',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsUUID()
  id_franqueadora: string;
}

export class AtualizarFilialDto {
  @ApiPropertyOptional({
    description: '[Opcional] Novo nome da filial',
    example: 'Filial Centro Expandida',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] UUID da nova franqueadora vinculada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;
}

export class FiltrarFilialDto {
  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nome (busca parcial, sem distinção de maiúsculas)',
    example: 'Centro',
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
  @IsUUID()
  id_franqueadora?: string;
}
