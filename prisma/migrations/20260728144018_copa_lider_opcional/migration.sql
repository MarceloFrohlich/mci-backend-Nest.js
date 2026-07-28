-- DropForeignKey
ALTER TABLE "copas" DROP CONSTRAINT "copas_id_lider_fkey";

-- AlterTable
ALTER TABLE "copas" ALTER COLUMN "id_lider" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "copas" ADD CONSTRAINT "copas_id_lider_fkey" FOREIGN KEY ("id_lider") REFERENCES "lideres"("id_lider") ON DELETE SET NULL ON UPDATE CASCADE;
