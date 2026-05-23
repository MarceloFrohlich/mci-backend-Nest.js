import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CriarFranqueadoraDto {
  @ApiProperty({ description: 'Nome da franqueadora', example: 'Unimed Central' })
  @IsString()
  nome: string;
}

export class AtualizarFranqueadoraDto {
  @ApiPropertyOptional({ description: 'Novo nome da franqueadora', example: 'Unimed Central SP' })
  @IsOptional()
  @IsString()
  nome?: string;
}

export class FiltrarFranqueadoraDto {
  @ApiPropertyOptional({ description: 'Filtrar pelo nome (parcial)', example: 'Unimed' })
  @IsOptional()
  @IsString()
  nome?: string;
}
