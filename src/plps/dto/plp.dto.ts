import { IsInt, IsOptional, IsUUID } from 'class-validator';

export class CriarPlpDto {
  @IsUUID()
  id_previdencia: string;

  @IsOptional()
  @IsUUID()
  id_atualizacao?: string;

  @IsInt()
  respondentes: number;

  @IsInt()
  detratores: number;

  @IsInt()
  propagadores: number;

  @IsInt()
  neutros: number;
}
