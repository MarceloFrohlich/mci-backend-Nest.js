-- CreateTable
CREATE TABLE "tokens_recuperacao_senha" (
    "id_token" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacao_senha_pkey" PRIMARY KEY ("id_token")
);

-- CreateIndex
CREATE INDEX "tokens_recuperacao_senha_id_usuario_idx" ON "tokens_recuperacao_senha"("id_usuario");

-- AddForeignKey
ALTER TABLE "tokens_recuperacao_senha" ADD CONSTRAINT "tokens_recuperacao_senha_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
