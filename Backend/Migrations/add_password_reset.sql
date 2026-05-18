-- =====================================================================
-- MIGRACIÓN: SISTEMA DE RECUPERACIÓN DE CONTRASEÑA E ÍNDICES DE LOGIN
-- Ejecutar en Supabase > SQL Editor
-- =====================================================================

-- 1. Añadir columnas para código de recuperación de contraseña en tabla usuario
ALTER TABLE public.usuario 
ADD COLUMN IF NOT EXISTS codigo_recuperacion VARCHAR(10),
ADD COLUMN IF NOT EXISTS fecha_expiracion_codigo TIMESTAMP;

-- 2. Crear el índice de alto rendimiento para inicios de sesión (correo + estado)
-- Esencial para soportar miles de usuarios iniciando sesión simultáneamente
CREATE INDEX IF NOT EXISTS idx_usuario_correo_estado 
ON public.usuario (correo, estado) 
WHERE estado = 1;

-- 3. Crear índice para búsqueda rápida del código de recuperación
CREATE INDEX IF NOT EXISTS idx_usuario_codigo_recup 
ON public.usuario (codigo_recuperacion, estado) 
WHERE codigo_recuperacion IS NOT NULL AND estado = 1;
