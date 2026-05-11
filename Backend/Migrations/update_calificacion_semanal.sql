-- Eliminar la restricción de unicidad anterior (que solo permitía 1 nota por competencia y periodo)
ALTER TABLE calificacion DROP CONSTRAINT IF EXISTS uc_calificacion_unica;
DROP INDEX IF EXISTS uc_calificacion_unica;

-- Añadir la columna de semana si no existe
ALTER TABLE calificacion ADD COLUMN IF NOT EXISTS semana_numero INT DEFAULT 1;

-- Crear el nuevo índice de unicidad que incluye la semana
CREATE UNIQUE INDEX IF NOT EXISTS uc_calificacion_semana 
    ON calificacion(estudiante_id, competencia_id, periodo_id, semana_numero)
    WHERE estado = 1;
