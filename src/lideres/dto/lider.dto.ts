import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CriarLiderDto {
  @ApiProperty({ description: 'Nome do líder', example: 'João Silva' })
  @IsString()
  nome: string;
}

export class AtualizarLiderDto {
  @ApiPropertyOptional({ description: 'Novo nome do líder', example: 'João Silva Junior' })
  @IsOptional()
  @IsString()
  nome?: string;
}

export class FiltrarLiderDto {
  @ApiPropertyOptional({ description: 'Filtrar pelo nome (parcial)', example: 'João' })
  @IsOptional()
  @IsString()
  nome?: string;
}
