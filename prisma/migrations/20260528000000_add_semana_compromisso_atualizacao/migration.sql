ALTER TABLE "atualizacoes_previdencia" ADD COLUMN "numero_semana" INTEGER;
ALTER TABLE "atualizacoes_previdencia" ADD COLUMN "compromisso" INTEGER;
ALTER TABLE "previdencias" ADD COLUMN "excluir_periodo" BOOLEAN NOT NULL DEFAULT false;
