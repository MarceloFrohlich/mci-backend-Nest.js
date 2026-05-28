import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarDepartamentoDto {
  @ApiProperty({
    description: '[Obrigatório] Nome do departamento',
    example: 'Comercial',
    type: String,
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: '[Obrigatório] UUID da filial à qual este departamento pertence',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsUUID()
  id_filial: string;
}

export class AtualizarDepartamentoDto {
  @ApiPropertyOptional({
    description: '[Opcional] Novo nome do departamento',
    example: 'Comercial e Vendas',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] UUID da nova filial vinculada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_filial?: string;
}

export class FiltrarDepartamentoDto {
  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nome (busca parcial, sem distinção de maiúsculas)',
    example: 'Comercial',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pela filial vinculada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_filial?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pela franqueadora vinculada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    type: String,
  })
  @IsOptional()
  @IsUUID()
  id_franqueadora?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Retornar apenas departamentos que possuem copa ativa',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  com_copa?: boolean;
}
