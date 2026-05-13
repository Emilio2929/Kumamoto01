-- ================================================================
-- ÍNDICES DE RENDIMIENTO — PROYECTO KUMAMOTO
-- Ejecutar en Supabase > SQL Editor
-- Actualizado: 2026-05-13 — Análisis completo de todos los endpoints
--
-- ÍNDICES YA EXISTENTES en la BD (NO duplicados aquí):
--   ix_asistencia_reporte_lookup   → asistencia(fecha, carga_academica_id, estudiante_id)
--   ix_carga_academica_aula        → carga_academica(aula_id)
--   ix_estudiante_aula             → estudiante(aula_id)
--   idx_alumno_riesgo_estudiante   → alumno_riesgo(estudiante_id)
-- ================================================================

-- ── alerta_riesgo (EarlyWarningService + Dashboard Director) ──────────────────
-- EarlyWarningService: desactivar alertas previas del estudiante
CREATE INDEX IF NOT EXISTS idx_alerta_riesgo_estudiante_estado
    ON public.alerta_riesgo (estudiante_id, estado);

-- Dashboard director: contar alertas por nivel (ahora en 1 query GroupBy)
CREATE INDEX IF NOT EXISTS idx_alerta_riesgo_estado_nivel
    ON public.alerta_riesgo (estado, nivel_riesgo);

-- ── asistencia ────────────────────────────────────────────────────────────────
-- AlertaTempranaService + PadresEndpoints resumen: stats por estudiante
CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante_fecha_estado
    ON public.asistencia (estudiante_id, fecha, estado);

-- Dashboard director: asistencia de hoy (ahora GroupBy en 1 query)
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha_estado
    ON public.asistencia (fecha, estado);

-- Portal auxiliar: asistencias de hoy en aulas del auxiliar
CREATE INDEX IF NOT EXISTS idx_asistencia_valor_estado
    ON public.asistencia (valor, estado)
    WHERE estado = 1;                          -- índice parcial: sólo activos

-- ── alumno_riesgo (AlertaTempranaService upsert + Portal Padre) ──────────────
-- AlertaTempranaService: buscar riesgo existente por estudiante+bimestre
CREATE INDEX IF NOT EXISTS idx_alumno_riesgo_estudiante_bimestre
    ON public.alumno_riesgo (estudiante_id, bimestre, estado);

-- Portal padre multi-hijo: todos los riesgos activos de varios estudiantes
CREATE INDEX IF NOT EXISTS idx_alumno_riesgo_estudiante_fecha
    ON public.alumno_riesgo (estudiante_id, estado, fecha_calculo DESC);

-- ── calificacion ──────────────────────────────────────────────────────────────
-- EarlyWarningService + Portal Padre: notas activas del estudiante
CREATE INDEX IF NOT EXISTS idx_calificacion_estudiante_estado
    ON public.calificacion (estudiante_id, estado);

-- Planilla docente + Reporte bimestral: notas por semana y competencia
CREATE INDEX IF NOT EXISTS idx_calificacion_semana_competencia
    ON public.calificacion (semana_id, competencia_id, estado);

-- Portal padre (libreta): todas las notas del estudiante con fecha
CREATE INDEX IF NOT EXISTS idx_calificacion_estudiante_fecha
    ON public.calificacion (estudiante_id, fecha_registro DESC)
    WHERE estado = 1;                          -- índice parcial: sólo activos

-- ── calificacion_bimestral ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_calificacion_bimestral_estudiante
    ON public.calificacion_bimestral (estudiante_id, estado);

-- ── carga_academica ───────────────────────────────────────────────────────────
-- Portal docente + Calificaciones: cursos del docente autenticado
CREATE INDEX IF NOT EXISTS idx_carga_docente_estado
    ON public.carga_academica (docente_id, estado);

-- ── horario_detalle ───────────────────────────────────────────────────────────
-- Portal docente (clases-hoy): horario por docente + día de semana
CREATE INDEX IF NOT EXISTS idx_horario_detalle_carga_dia
    ON public.horario_detalle (carga_id, dia_semana, estado);

-- ── competencia ───────────────────────────────────────────────────────────────
-- Planilla + Competencias por carga
CREATE INDEX IF NOT EXISTS idx_competencia_carga_estado
    ON public.competencia (carga_id, estado);

-- ── asignacion_auxiliar ───────────────────────────────────────────────────────
-- Portal auxiliar: aulas del auxiliar autenticado
CREATE INDEX IF NOT EXISTS idx_asignacion_auxiliar_auxiliar_estado
    ON public.asignacion_auxiliar (auxiliar_id, estado);

-- ── usuario ───────────────────────────────────────────────────────────────────
-- Listado de padres: filtro frecuente por rol
CREATE INDEX IF NOT EXISTS idx_usuario_rol_estado
    ON public.usuario (rol_id, estado);

-- Búsqueda de padre por DNI (BuscarPadrePorDni)
CREATE INDEX IF NOT EXISTS idx_usuario_dni
    ON public.usuario (dni)
    WHERE estado = 1;                          -- índice parcial: sólo activos

-- ── periodo_academico ─────────────────────────────────────────────────────────
-- AlertaTempranaService: periodo vigente por fecha (query muy frecuente)
CREATE INDEX IF NOT EXISTS idx_periodo_fechas_estado
    ON public.periodo_academico (fecha_inicio, fecha_fin, estado);

-- ── semana_academica ──────────────────────────────────────────────────────────
-- Reporte bimestral: semanas de un periodo
CREATE INDEX IF NOT EXISTS idx_semana_periodo_estado
    ON public.semana_academica (periodo_id, estado);

-- ── estudiante ────────────────────────────────────────────────────────────────
-- Portal padre: buscar hijo por padre_id (muy frecuente)
CREATE INDEX IF NOT EXISTS idx_estudiante_padre_estado
    ON public.estudiante (padre_id, estado);
