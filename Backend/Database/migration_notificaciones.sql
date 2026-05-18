-- ================================================================
-- MIGRACIÓN: TABLA DE NOTIFICACIONES DIRECTAS AL PADRE
-- Proyecto Kumamoto
-- Fecha: 2026-05-17
-- ================================================================

CREATE TABLE IF NOT EXISTS public.notificacion (
    id SERIAL PRIMARY KEY,
    usuario_destino_id INT NOT NULL,              -- ID del padre (o usuario que recibe)
    estudiante_id INT,                            -- Opcional: ID del estudiante relacionado
    remitente_id INT NOT NULL,                    -- ID del directivo, auxiliar o docente que envía
    tipo character varying(50) NOT NULL,          -- Ej: 'Académica', 'Conductual', 'Asistencia', 'Directiva'
    titulo character varying(200) NOT NULL,
    mensaje text NOT NULL,
    fecha_envio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    leido smallint DEFAULT 0,                     -- 0 = No leído, 1 = Leído
    estado smallint DEFAULT 1,                    -- 1 = Activo, 0 = Archivado/Eliminado
    CONSTRAINT fk_notificacion_destino FOREIGN KEY (usuario_destino_id) REFERENCES public.usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_notificacion_remitente FOREIGN KEY (remitente_id) REFERENCES public.usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_notificacion_estudiante FOREIGN KEY (estudiante_id) REFERENCES public.estudiante(id) ON DELETE SET NULL
);

-- Índices de rendimiento para búsquedas instantáneas
CREATE INDEX IF NOT EXISTS idx_notificacion_destino_leido ON public.notificacion (usuario_destino_id, leido, estado);
CREATE INDEX IF NOT EXISTS idx_notificacion_estudiante ON public.notificacion (estudiante_id, estado);
