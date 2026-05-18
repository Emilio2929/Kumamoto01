-- ====================================================================
-- SCRIPT DE LIMPIEZA Y REINICIO DE MATRIZ ACADÉMICA — PROYECTO KUMAMOTO
-- Ejecutar en Supabase > SQL Editor
-- Propósito: Eliminar duplicados/basura de pruebas y establecer una línea base limpia.
-- ====================================================================

-- 1. Limpiar datos de periodos, semanas y calificaciones dependientes
TRUNCATE TABLE public.calificacion CASCADE;
TRUNCATE TABLE public.calificacion_bimestral CASCADE;
TRUNCATE TABLE public.semana_academica CASCADE;
TRUNCATE TABLE public.periodo_academico CASCADE;

-- 2. Insertar los 4 bimestres oficiales de forma limpia y estructurada
INSERT INTO public.periodo_academico (id, anio_lectivo, numero, nombre, fecha_inicio, fecha_fin, esta_cerrado, estado) VALUES
    (1, '2026', 1, '1° Bimestre', '2026-03-16', '2026-05-15', FALSE, 1),
    (2, '2026', 2, '2° Bimestre', '2026-05-18', '2026-07-24', FALSE, 1),
    (3, '2026', 3, '3° Bimestre', '2026-08-10', '2026-10-09', FALSE, 1),
    (4, '2026', 4, '4° Bimestre', '2026-10-12', '2026-12-18', FALSE, 1);

-- 3. Insertar las semanas oficiales correspondientes a cada bimestre (con estado activo = 1)
INSERT INTO public.semana_academica (periodo_id, numero_semana, estado) VALUES
    -- 1° Bimestre (9 semanas)
    (1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 4, 1), (1, 5, 1), (1, 6, 1), (1, 7, 1), (1, 8, 1), (1, 9, 1),
    -- 2° Bimestre (9 semanas)
    (2, 1, 1), (2, 2, 1), (2, 3, 1), (2, 4, 1), (2, 5, 1), (2, 6, 1), (2, 7, 1), (2, 8, 1), (2, 9, 1),
    -- 3° Bimestre (9 semanas)
    (3, 1, 1), (3, 2, 1), (3, 3, 1), (3, 4, 1), (3, 5, 1), (3, 6, 1), (3, 7, 1), (3, 8, 1), (3, 9, 1),
    -- 4° Bimestre (10 semanas)
    (4, 1, 1), (4, 2, 1), (4, 3, 1), (4, 4, 1), (4, 5, 1), (4, 6, 1), (4, 7, 1), (4, 8, 1), (4, 9, 1), (4, 10, 1);

-- 4. Sincronizar las secuencias de IDs para evitar errores de colisión en futuros inserts de EF Core
SELECT setval('public.periodo_academico_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.periodo_academico));
SELECT setval('public.semana_academica_id_seq', (SELECT COALESCE(MAX(id), 1) FROM public.semana_academica));

-- 5. Asegurar las restricciones de unicidad en la base de datos
ALTER TABLE ONLY public.periodo_academico
    DROP CONSTRAINT IF EXISTS uc_periodo_anio_numero;
ALTER TABLE ONLY public.periodo_academico
    ADD CONSTRAINT uc_periodo_anio_numero UNIQUE (anio_lectivo, numero);

ALTER TABLE ONLY public.semana_academica
    DROP CONSTRAINT IF EXISTS uc_periodo_semana;
ALTER TABLE ONLY public.semana_academica
    ADD CONSTRAINT uc_periodo_semana UNIQUE (periodo_id, numero_semana);

-- ====================================================================
-- FIN DEL SCRIPT
-- ====================================================================
