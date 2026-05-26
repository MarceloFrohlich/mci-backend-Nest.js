/*
  Warnings:

  - Added the required column `id_lider` to the `copas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "copas" ADD COLUMN     "id_lider" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "copas_id_lider_idx" ON "copas"("id_lider");

-- AddForeignKey
ALTER TABLE "copas" ADD CONSTRAINT "copas_id_lider_fkey" FOREIGN KEY ("id_lider") REFERENCES "lideres"("id_lider") ON DELETE RESTRICT ON UPDATE CASCADE;
