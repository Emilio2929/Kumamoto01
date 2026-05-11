-- Crear tabla para el motor de Alerta Temprana
CREATE TABLE IF NOT EXISTS alumno_riesgo (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiante(id),
    nivel_riesgo VARCHAR(20) NOT NULL DEFAULT 'Bajo',
    motivo TEXT,
    recomendacion TEXT,
    fecha_calculo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bimestre INTEGER,
    estado SMALLINT DEFAULT 1
);

-- Índice para búsquedas rápidas por estudiante
CREATE INDEX IF NOT EXISTS idx_alumno_riesgo_estudiante ON alumno_riesgo(estudiante_id);
