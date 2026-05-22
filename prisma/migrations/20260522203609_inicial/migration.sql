-- CreateTable
CREATE TABLE "franqueadoras" (
    "id_franqueadora" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "franqueadoras_pkey" PRIMARY KEY ("id_franqueadora")
);

-- CreateTable
CREATE TABLE "filiais" (
    "id_filial" TEXT NOT NULL,
    "id_franqueadora" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "filiais_pkey" PRIMARY KEY ("id_filial")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id_departamento" TEXT NOT NULL,
    "id_filial" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id_departamento")
);

-- CreateTable
CREATE TABLE "roles" (
    "id_role" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "niveis_usuario" (
    "id_nivel" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "niveis_usuario_pkey" PRIMARY KEY ("id_nivel")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" TEXT NOT NULL,
    "id_role" INTEGER NOT NULL,
    "id_nivel" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "relacao" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "usuario_ano" (
    "id_usuario_ano" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "usuario_ano_pkey" PRIMARY KEY ("id_usuario_ano")
);

-- CreateTable
CREATE TABLE "copas" (
    "id_copa" TEXT NOT NULL,
    "id_departamento" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT,
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,
    "verbo" TEXT,
    "medida" TEXT,
    "de" DECIMAL(15,2),
    "ate" DECIMAL(15,2),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "copas_pkey" PRIMARY KEY ("id_copa")
);

-- CreateTable
CREATE TABLE "lideres" (
    "id_lider" TEXT NOT NULL,
    "id_franqueadora" TEXT,
    "nome" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "lideres_pkey" PRIMARY KEY ("id_lider")
);

-- CreateTable
CREATE TABLE "jogos" (
    "id_jogo" TEXT NOT NULL,
    "id_copa" TEXT NOT NULL,
    "id_lider" TEXT,
    "nome" TEXT NOT NULL,
    "verbo" TEXT,
    "medida" TEXT,
    "de" DECIMAL(15,2),
    "para" DECIMAL(15,2),
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "observacao" TEXT,
    "tem_plp" BOOLEAN NOT NULL DEFAULT false,
    "semanas" INTEGER,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "jogos_pkey" PRIMARY KEY ("id_jogo")
);

-- CreateTable
CREATE TABLE "previdencias" (
    "id_previdencia" TEXT NOT NULL,
    "id_jogo" TEXT NOT NULL,
    "unidade_medida" TEXT,
    "placar_atual" INTEGER NOT NULL DEFAULT 0,
    "placar_inicial" INTEGER NOT NULL DEFAULT 0,
    "placar_desejado" INTEGER NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "inativo_de" DATE,
    "inativo_ate" DATE,
    "plp_media" DECIMAL(10,2),
    "verbo" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "previdencias_pkey" PRIMARY KEY ("id_previdencia")
);

-- CreateTable
CREATE TABLE "atualizacoes_previdencia" (
    "id_atualizacao" TEXT NOT NULL,
    "id_previdencia" TEXT NOT NULL,
    "id_usuario" TEXT,
    "placar_atual" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "atualizacoes_previdencia_pkey" PRIMARY KEY ("id_atualizacao")
);

-- CreateTable
CREATE TABLE "plps" (
    "id_plp" TEXT NOT NULL,
    "id_previdencia" TEXT NOT NULL,
    "id_atualizacao" TEXT,
    "respondentes" INTEGER NOT NULL,
    "detratores" INTEGER NOT NULL,
    "propagadores" INTEGER NOT NULL,
    "neutros" INTEGER NOT NULL,
    "plp" DECIMAL(10,2) NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "plps_pkey" PRIMARY KEY ("id_plp")
);

-- CreateTable
CREATE TABLE "observacoes_previdencia" (
    "id_observacao" TEXT NOT NULL,
    "id_previdencia" TEXT NOT NULL,
    "observacao" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "observacoes_previdencia_pkey" PRIMARY KEY ("id_observacao")
);

-- CreateTable
CREATE TABLE "jogos_status" (
    "id_status" TEXT NOT NULL,
    "id_jogo" TEXT NOT NULL,
    "status" TEXT,
    "valor" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),

    CONSTRAINT "jogos_status_pkey" PRIMARY KEY ("id_status")
);

-- CreateIndex
CREATE INDEX "filiais_id_franqueadora_idx" ON "filiais"("id_franqueadora");

-- CreateIndex
CREATE INDEX "departamentos_id_filial_idx" ON "departamentos"("id_filial");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_id_role_idx" ON "usuarios"("id_role");

-- CreateIndex
CREATE INDEX "usuarios_id_nivel_idx" ON "usuarios"("id_nivel");

-- CreateIndex
CREATE INDEX "usuario_ano_id_usuario_idx" ON "usuario_ano"("id_usuario");

-- CreateIndex
CREATE INDEX "copas_id_departamento_idx" ON "copas"("id_departamento");

-- CreateIndex
CREATE INDEX "copas_inicio_fim_idx" ON "copas"("inicio", "fim");

-- CreateIndex
CREATE INDEX "lideres_id_franqueadora_idx" ON "lideres"("id_franqueadora");

-- CreateIndex
CREATE INDEX "jogos_id_copa_idx" ON "jogos"("id_copa");

-- CreateIndex
CREATE INDEX "jogos_id_lider_idx" ON "jogos"("id_lider");

-- CreateIndex
CREATE INDEX "previdencias_id_jogo_idx" ON "previdencias"("id_jogo");

-- CreateIndex
CREATE INDEX "atualizacoes_previdencia_id_previdencia_idx" ON "atualizacoes_previdencia"("id_previdencia");

-- CreateIndex
CREATE INDEX "plps_id_previdencia_idx" ON "plps"("id_previdencia");

-- CreateIndex
CREATE INDEX "observacoes_previdencia_id_previdencia_idx" ON "observacoes_previdencia"("id_previdencia");

-- CreateIndex
CREATE UNIQUE INDEX "jogos_status_id_jogo_key" ON "jogos_status"("id_jogo");

-- AddForeignKey
ALTER TABLE "filiais" ADD CONSTRAINT "filiais_id_franqueadora_fkey" FOREIGN KEY ("id_franqueadora") REFERENCES "franqueadoras"("id_franqueadora") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_id_filial_fkey" FOREIGN KEY ("id_filial") REFERENCES "filiais"("id_filial") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "roles"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_nivel_fkey" FOREIGN KEY ("id_nivel") REFERENCES "niveis_usuario"("id_nivel") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_ano" ADD CONSTRAINT "usuario_ano_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copas" ADD CONSTRAINT "copas_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "departamentos"("id_departamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lideres" ADD CONSTRAINT "lideres_id_franqueadora_fkey" FOREIGN KEY ("id_franqueadora") REFERENCES "franqueadoras"("id_franqueadora") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_id_copa_fkey" FOREIGN KEY ("id_copa") REFERENCES "copas"("id_copa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_id_lider_fkey" FOREIGN KEY ("id_lider") REFERENCES "lideres"("id_lider") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previdencias" ADD CONSTRAINT "previdencias_id_jogo_fkey" FOREIGN KEY ("id_jogo") REFERENCES "jogos"("id_jogo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacoes_previdencia" ADD CONSTRAINT "atualizacoes_previdencia_id_previdencia_fkey" FOREIGN KEY ("id_previdencia") REFERENCES "previdencias"("id_previdencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plps" ADD CONSTRAINT "plps_id_previdencia_fkey" FOREIGN KEY ("id_previdencia") REFERENCES "previdencias"("id_previdencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plps" ADD CONSTRAINT "plps_id_atualizacao_fkey" FOREIGN KEY ("id_atualizacao") REFERENCES "atualizacoes_previdencia"("id_atualizacao") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observacoes_previdencia" ADD CONSTRAINT "observacoes_previdencia_id_previdencia_fkey" FOREIGN KEY ("id_previdencia") REFERENCES "previdencias"("id_previdencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos_status" ADD CONSTRAINT "jogos_status_id_jogo_fkey" FOREIGN KEY ("id_jogo") REFERENCES "jogos"("id_jogo") ON DELETE RESTRICT ON UPDATE CASCADE;
