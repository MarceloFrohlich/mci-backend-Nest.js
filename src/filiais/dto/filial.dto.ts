import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarFilialDto {
  @ApiProperty({ description: 'Nome da filial', example: 'Filial Centro' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'UUID da franqueadora vinculada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  id_franqueadora: string;
}

export class AtualizarFilialDto {
  @ApiPropertyOptional({ description: 'Novo nome da filial', example: 'Filial Centro Expandida' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'UUID da nova franqueadora vinculada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;
}

export class FiltrarFilialDto {
  @ApiPropertyOptional({ description: 'Filtrar pelo nome (parcial)', example: 'Centro' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtrar pela franqueadora', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;
}
