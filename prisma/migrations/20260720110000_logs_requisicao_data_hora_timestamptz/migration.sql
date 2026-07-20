-- AlterTable
-- data_hora vira TIMESTAMPTZ para armazenar o instante sem ambiguidade de timezone;
-- os valores existentes eram lidos como UTC, entao a conversao abaixo preserva
-- a mesma leitura para os registros ja gravados.
ALTER TABLE "logs_requisicao"
  ALTER COLUMN "data_hora" TYPE TIMESTAMPTZ(3)
  USING "data_hora" AT TIME ZONE 'UTC';
