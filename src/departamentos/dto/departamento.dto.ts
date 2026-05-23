import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarDepartamentoDto {
  @ApiProperty({ description: 'Nome do departamento', example: 'Comercial' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'UUID da filial vinculada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  id_filial: string;
}

export class AtualizarDepartamentoDto {
  @ApiPropertyOptional({ description: 'Novo nome do departamento', example: 'Comercial e Vendas' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'UUID da nova filial vinculada', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_filial?: string;
}

export class FiltrarDepartamentoDto {
  @ApiPropertyOptional({ description: 'Filtrar pelo nome (parcial)', example: 'Comercial' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtrar pela filial', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_filial?: string;

  @ApiPropertyOptional({ description: 'Filtrar pela franqueadora', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;

  @ApiPropertyOptional({ description: 'Retornar apenas departamentos com copa ativa', example: true })
  @IsOptional()
  @IsBoolean()
  com_copa?: boolean;
}
