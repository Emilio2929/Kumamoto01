-- =====================================================================
-- MIGRACIÓN: CREACIÓN DE TABLA DESBLOQUEO DE CALIFICACIÓN
-- Ejecutar en Supabase > SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.desbloqueo_calificacion (
    id SERIAL PRIMARY KEY,
    carga_id INT NOT NULL REFERENCES public.carga_academica(id) ON DELETE CASCADE,
    semana_id INT NOT NULL REFERENCES public.semana_academica(id) ON DELETE CASCADE,
    estudiante_id INT NOT NULL REFERENCES public.estudiante(id) ON DELETE CASCADE,
    habilitado_por_id INT NOT NULL REFERENCES public.usuario(id) ON DELETE CASCADE,
    fecha_autorizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMP NOT NULL,
    estado INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_desbloqueo_carga_semana ON public.desbloqueo_calificacion (carga_id, semana_id, estado);
CREATE INDEX IF NOT EXISTS idx_desbloqueo_estudiante ON public.desbloqueo_calificacion (estudiante_id, estado);
