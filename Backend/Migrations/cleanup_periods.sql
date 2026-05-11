-- 1. Limpiar datos duplicados de periodos y semanas
-- Primero eliminamos las calificaciones porque dependen de semanas
TRUNCATE TABLE Calificacion CASCADE;
TRUNCATE TABLE Calificacion_Bimestral CASCADE;
TRUNCATE TABLE Semana_Academica CASCADE;
TRUNCATE TABLE Periodo_Academico CASCADE;

-- 2. Insertar los 4 bimestres oficiales de forma limpia
INSERT INTO Periodo_Academico (id, anio_lectivo, numero, nombre, fecha_inicio, fecha_fin, esta_cerrado) VALUES
    (1, '2026', 1, '1° Bimestre', '2026-03-16', '2026-05-15', FALSE),
    (2, '2026', 2, '2° Bimestre', '2026-05-18', '2026-07-24', FALSE),
    (3, '2026', 3, '3° Bimestre', '2026-08-10', '2026-10-09', FALSE),
    (4, '2026', 4, '4° Bimestre', '2026-10-12', '2026-12-18', FALSE);

-- 3. Insertar las semanas oficiales de forma limpia
INSERT INTO Semana_Academica (periodo_id, numero_semana) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9),
    (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9),
    (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9),
    (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 9), (4, 10);

-- 4. Agregar restricción de unicidad para evitar que esto vuelva a pasar
ALTER TABLE Periodo_Academico ADD CONSTRAINT uc_periodo_anio_numero UNIQUE (anio_lectivo, numero);
