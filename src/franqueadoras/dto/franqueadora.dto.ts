import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CriarFranqueadoraDto {
  @ApiProperty({
    description: '[Obrigatório] Nome da franqueadora',
    example: 'Unimed Central',
    type: String,
  })
  @IsString()
  nome: string;
}

export class AtualizarFranqueadoraDto {
  @ApiPropertyOptional({
    description: '[Opcional] Novo nome da franqueadora',
    example: 'Unimed Central SP',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;
}

export class FiltrarFranqueadoraDto {
  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nome (busca parcial, sem distinção de maiúsculas)',
    example: 'Unimed',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;
}
