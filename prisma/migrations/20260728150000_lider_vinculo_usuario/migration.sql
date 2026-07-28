-- AlterTable
ALTER TABLE "lideres" ADD COLUMN     "id_usuario" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "lideres_id_usuario_key" ON "lideres"("id_usuario");

-- AddForeignKey
ALTER TABLE "lideres" ADD CONSTRAINT "lideres_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
