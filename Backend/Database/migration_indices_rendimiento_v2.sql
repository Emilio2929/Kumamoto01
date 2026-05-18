-- ====================================================================
-- MIGRACIÓN DE ÍNDICES DE RENDIMIENTO V2 — PROYECTO KUMAMOTO
-- Optimización específica para tiempos de carga en Portales y Configuración
-- Ejecutar en Supabase > SQL Editor
-- ====================================================================

-- 1. Optimización para Configuración del Año Lectivo (ConfiguracionAnioEndpoints)
CREATE INDEX IF NOT EXISTS idx_periodo_anio_estado
    ON public.periodo_academico (anio_lectivo, estado);

-- 2. Optimización para el Carrusel de Comunicados (ComunicadosEndpoints)
CREATE INDEX IF NOT EXISTS idx_comunicado_estado_fecha
    ON public.comunicado (estado, fecha_publicacion DESC);

-- 3. Optimización para Carga de Catálogos Generales (Aulas, Cursos, Grados, Secciones)
CREATE INDEX IF NOT EXISTS idx_aula_estado
    ON public.aula (estado)
    WHERE estado = 1;

CREATE INDEX IF NOT EXISTS idx_curso_estado
    ON public.curso (estado)
    WHERE estado = 1;

CREATE INDEX IF NOT EXISTS idx_grado_estado
    ON public.grado (estado)
    WHERE estado = 1;

CREATE INDEX IF NOT EXISTS idx_seccion_estado
    ON public.seccion (estado)
    WHERE estado = 1;

-- 4. Optimización para Búsquedas Rápidas de Usuarios por Estado y Rol
CREATE INDEX IF NOT EXISTS idx_usuario_estado_rol
    ON public.usuario (estado, rol_id)
    WHERE estado = 1;

-- 5. Optimización para Calificaciones Semanales y Bimestrales por Semana/Periodo
CREATE INDEX IF NOT EXISTS idx_calificacion_semana_estado
    ON public.calificacion (semana_id, estado)
    WHERE estado = 1;

CREATE INDEX IF NOT EXISTS idx_calif_bimestral_periodo_estado
    ON public.calificacion_bimestral (periodo_id, estado)
    WHERE estado = 1;

-- ====================================================================
-- FIN DE LA MIGRACIÓN
-- ====================================================================
