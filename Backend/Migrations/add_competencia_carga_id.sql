-- Vincular competencias a la carga académica (docente-curso-aula) del docente
ALTER TABLE competencia ADD COLUMN IF NOT EXISTS carga_id INT REFERENCES carga_academica(id);
ALTER TABLE competencia ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2) DEFAULT 1.0;

-- Índice de unicidad: un alumno no puede tener 2 notas para la misma competencia+periodo
CREATE UNIQUE INDEX IF NOT EXISTS uc_calificacion_unica 
    ON calificacion(estudiante_id, competencia_id, periodo_id)
    WHERE estado = 1;
