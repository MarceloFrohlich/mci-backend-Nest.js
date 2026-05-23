import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrarUsuarioDto {
  @ApiPropertyOptional({ description: 'Filtrar pelo nome (parcial)', example: 'Maria' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtrar pelo e-mail (parcial)', example: 'maria@' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Filtrar pelo ID do perfil: 1 = Admin Global, 2 = Admin Local', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_role?: number;

  @ApiPropertyOptional({ description: 'Filtrar pelo ID do nível: 1 = Franqueadora, 2 = Filial, 3 = Departamento', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_nivel?: number;
}
