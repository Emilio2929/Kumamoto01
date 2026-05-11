-- Script para actualizar la tabla de competencia con el campo Código
ALTER TABLE "competencia" ADD COLUMN IF NOT EXISTS "codigo" TEXT DEFAULT '';

-- Opcional: Rellenar códigos existentes
UPDATE "competencia" SET "codigo" = 'C' || "numero_orden" WHERE "codigo" = '' OR "codigo" IS NULL;
