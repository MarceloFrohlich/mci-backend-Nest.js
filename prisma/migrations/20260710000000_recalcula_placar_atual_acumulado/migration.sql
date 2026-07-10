-- Corrige placar_atual das previdencias: antes armazenava apenas o realizado da
-- ultima semana lancada; passa a ser o acumulado (placar_inicial + soma do
-- realizado de todas as semanas lancadas ativas).
UPDATE previdencias p
SET placar_atual = p.placar_inicial + COALESCE((
  SELECT SUM(a.placar_atual)
  FROM atualizacoes_previdencia a
  WHERE a.id_previdencia = p.id_previdencia
    AND a.deletado_em IS NULL
    AND a.numero_semana IS NOT NULL
), 0)
WHERE p.deletado_em IS NULL
  AND EXISTS (
    SELECT 1
    FROM atualizacoes_previdencia a
    WHERE a.id_previdencia = p.id_previdencia
      AND a.deletado_em IS NULL
      AND a.numero_semana IS NOT NULL
  );
