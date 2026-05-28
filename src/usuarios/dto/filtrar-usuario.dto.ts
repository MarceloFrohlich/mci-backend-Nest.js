import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrarUsuarioDto {
  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nome (busca parcial, sem distinção de maiúsculas)',
    example: 'Maria',
    type: String,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo e-mail (busca parcial, sem distinção de maiúsculas)',
    example: 'maria@',
    type: String,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo perfil: 1 = Admin Global, 2 = Admin Local',
    example: 2,
    type: Number,
    enum: [1, 2],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_role?: number;

  @ApiPropertyOptional({
    description: '[Opcional] Filtrar pelo nível: 1 = Franqueadora, 2 = Filial, 3 = Departamento',
    example: 2,
    type: Number,
    enum: [1, 2, 3],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_nivel?: number;
}
