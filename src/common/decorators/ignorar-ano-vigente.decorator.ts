import { SetMetadata } from '@nestjs/common';

export const IGNORAR_ANO_VIGENTE_KEY = 'ignorarAnoVigente';

/**
 * Libera uma rota/controller de mutação mesmo quando o ano ativo do usuário
 * não é o ano vigente (ex.: trocar de ano, logout, alterar a própria senha).
 */
export const IgnorarAnoVigente = () => SetMetadata(IGNORAR_ANO_VIGENTE_KEY, true);
