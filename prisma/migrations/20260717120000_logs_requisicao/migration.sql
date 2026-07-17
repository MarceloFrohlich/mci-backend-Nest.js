-- CreateTable
CREATE TABLE "logs_requisicao" (
    "id_log" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL,
    "rota" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "mensagem_erro" TEXT,
    "usuario" TEXT,

    CONSTRAINT "logs_requisicao_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE INDEX "logs_requisicao_data_hora_idx" ON "logs_requisicao"("data_hora");
