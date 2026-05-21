import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CriarObservacaoDto {
  @IsUUID()
  id_previdencia: string;

  @IsString()
  observacao: string;
}

export class AtualizarObservacaoDto {
  @IsOptional()
  @IsString()
  observacao?: string;
}
