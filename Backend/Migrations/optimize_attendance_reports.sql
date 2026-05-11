-- Índices para optimizar reportes de asistencia (usando snake_case para PostgreSQL)
CREATE INDEX IF NOT EXISTS "ix_asistencia_reporte_lookup" 
ON "asistencia" ("fecha", "carga_academica_id", "estudiante_id");

CREATE INDEX IF NOT EXISTS "ix_carga_academica_aula" 
ON "carga_academica" ("aula_id");

CREATE INDEX IF NOT EXISTS "ix_estudiante_aula" 
ON "estudiante" ("aula_id");
