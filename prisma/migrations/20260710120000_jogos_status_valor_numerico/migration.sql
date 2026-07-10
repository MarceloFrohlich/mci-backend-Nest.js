-- Converte jogos_status.valor de texto para numerico (avaliacao de MCI usa o
-- valor atingido em comparacoes com a meta). Valores nao numericos viram NULL.
ALTER TABLE "jogos_status"
  ALTER COLUMN "valor" TYPE DECIMAL(15,2)
  USING (
    CASE
      WHEN trim("valor") ~ '^-?[0-9]+([.,][0-9]+)?$'
        THEN replace(trim("valor"), ',', '.')::DECIMAL(15,2)
      ELSE NULL
    END
  );
