-- ====================================================================
-- ARCHIVO DE MIGRACIÓN: OPTIMIZACIÓN DE CONSULTAS DE TUTORÍA Y NOTAS
-- ====================================================================
-- Objetivo: Crear índices compuestos de alto rendimiento para acelerar
-- drásticamente las consultas del Portal Docente (Calificaciones semanales,
-- bimestres, competencias, cargas académicas e incidencias).
-- ====================================================================

-- 1. Índices para la tabla calificacion (Notas Semanales)
-- Acelera el filtrado por estudiante_id, estado y los JOINs con semana y competencia
CREATE INDEX IF NOT EXISTS idx_calificacion_estudiante_estado_semana 
ON calificacion (estudiante_id, estado, semana_id, competencia_id);

CREATE INDEX IF NOT EXISTS idx_calificacion_competencia_escala 
ON calificacion (competencia_id, escala_id);

-- 2. Índices para la tabla calificacion_bimestral (Notas Bimestrales)
-- Acelera el filtrado por estudiante_id, estado y los JOINs con periodo y competencia
CREATE INDEX IF NOT EXISTS idx_calibimestral_estudiante_estado_periodo 
ON calificacion_bimestral (estudiante_id, estado, periodo_id, competencia_id);

CREATE INDEX IF NOT EXISTS idx_calibimestral_competencia_escala 
ON calificacion_bimestral (competencia_id, escala_id);

-- 3. Índices para la tabla competencia
-- Acelera la búsqueda de competencias por curso_id o carga_id y estado activo
CREATE INDEX IF NOT EXISTS idx_competencia_estado_curso_carga 
ON competencia (estado, curso_id, carga_id);

-- 4. Índices para la tabla carga_academica
-- Acelera la obtención de cursos asignados a un aula o docente específico
CREATE INDEX IF NOT EXISTS idx_carga_academica_aula_docente_estado 
ON carga_academica (aula_id, docente_id, estado);

CREATE INDEX IF NOT EXISTS idx_carga_academica_curso_id 
ON carga_academica (curso_id);

-- 5. Índices para la tabla incidencia
-- Acelera el filtrado de reportes de conducta por estudiante y estado
CREATE INDEX IF NOT EXISTS idx_incidencia_estudiante_estado 
ON incidencia (estudiante_id, estado);

CREATE INDEX IF NOT EXISTS idx_incidencia_registrado_por 
ON incidencia (registrado_por_id);

-- 6. Índices para la tabla estudiante
-- Acelera la carga del listado de estudiantes matriculados en un aula
CREATE INDEX IF NOT EXISTS idx_estudiante_aula_estado 
ON estudiante (aula_id, estado);

-- 7. Índices para semana_academica y periodo_academico
-- Acelera los JOINs de fechas y periodos
CREATE INDEX IF NOT EXISTS idx_semana_academica_periodo_estado 
ON semana_academica (periodo_id, estado, numero_semana);

CREATE INDEX IF NOT EXISTS idx_periodo_academico_anio_estado 
ON periodo_academico (anio_lectivo, estado, numero);
