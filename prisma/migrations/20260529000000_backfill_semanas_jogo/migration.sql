UPDATE "jogos"
SET "semanas" = FLOOR(("data_fim" - "data_inicio") / 7)::INTEGER + 1
WHERE "semanas" IS NULL;
