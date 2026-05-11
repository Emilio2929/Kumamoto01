-- 1. Modificar Periodo_Academico
ALTER TABLE Periodo_Academico ADD COLUMN IF NOT EXISTS anio_lectivo VARCHAR(4) NOT NULL DEFAULT '2026';
ALTER TABLE Periodo_Academico ADD COLUMN IF NOT EXISTS numero INT NOT NULL DEFAULT 1 CHECK (numero IN (1, 2, 3, 4));

-- Insertar los 4 bimestres (Si no existen)
INSERT INTO Periodo_Academico (anio_lectivo, numero, nombre, fecha_inicio, fecha_fin, esta_cerrado) VALUES
    ('2026', 1, '1° Bimestre', '2026-03-16', '2026-05-15', FALSE),
    ('2026', 2, '2° Bimestre', '2026-05-18', '2026-07-24', FALSE),
    ('2026', 3, '3° Bimestre', '2026-08-10', '2026-10-09', FALSE),
    ('2026', 4, '4° Bimestre', '2026-10-12', '2026-12-18', FALSE)
    ON CONFLICT DO NOTHING;

-- 2. Crear Tabla Semana_Academica
CREATE TABLE IF NOT EXISTS Semana_Academica (
    id SERIAL PRIMARY KEY,
    periodo_id INT REFERENCES Periodo_Academico(id),
    numero_semana INT NOT NULL,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1)),
    CONSTRAINT uc_periodo_semana UNIQUE (periodo_id, numero_semana)
);

-- Insertar las semanas para los 4 bimestres
INSERT INTO Semana_Academica (periodo_id, numero_semana) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9),
    (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9),
    (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9),
    (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 9), (4, 10)
    ON CONFLICT DO NOTHING;

-- 3. Crear Catálogo de Notas (Escala_Calificacion MINEDU)
CREATE TABLE IF NOT EXISTS Escala_Calificacion (
    id SERIAL PRIMARY KEY,
    letra VARCHAR(2) UNIQUE NOT NULL,
    descripcion VARCHAR(50) NOT NULL,
    significado TEXT NOT NULL,
    requiere_intervencion BOOLEAN DEFAULT FALSE,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

INSERT INTO Escala_Calificacion (letra, descripcion, significado, requiere_intervencion) VALUES
    ('AD', 'Logro Destacado', 'El estudiante evidencia un nivel superior a lo esperado respecto a la competencia.', FALSE),
    ('A', 'Logro Previsto', 'El estudiante cumple satisfactoriamente con el nivel esperado en el tiempo programado.', FALSE),
    ('B', 'En Proceso', 'El estudiante está próximo o cerca del nivel esperado y requiere acompañamiento.', FALSE),
    ('C', 'En Inicio', 'El estudiante muestra un progreso mínimo y necesita intervención pedagógica urgente.', TRUE)
    ON CONFLICT DO NOTHING;

-- 4. Modificar Calificacion (Migración a 5NF)
-- Ya no usaremos carga_id, periodo_id ni nota. Usaremos semana_id y escala_id.
-- Para evitar errores de datos huérfanos en pruebas, truncamos las calificaciones de prueba
TRUNCATE TABLE Calificacion CASCADE;

ALTER TABLE Calificacion DROP COLUMN IF EXISTS carga_id;
ALTER TABLE Calificacion DROP COLUMN IF EXISTS periodo_id;
ALTER TABLE Calificacion DROP COLUMN IF EXISTS semana_numero;
ALTER TABLE Calificacion DROP COLUMN IF EXISTS nota;

ALTER TABLE Calificacion ADD COLUMN IF NOT EXISTS semana_id INT REFERENCES Semana_Academica(id);
ALTER TABLE Calificacion ADD COLUMN IF NOT EXISTS escala_id INT REFERENCES Escala_Calificacion(id);

-- Restricción de unicidad estricta para el registro semanal
ALTER TABLE Calificacion DROP CONSTRAINT IF EXISTS uc_calificacion_semana;
DROP INDEX IF EXISTS uc_calificacion_semana;

ALTER TABLE Calificacion ADD CONSTRAINT uc_calificacion_semana UNIQUE (estudiante_id, competencia_id, semana_id);

-- 5. Crear Tabla Consolidado Bimestral (Libretas)
CREATE TABLE IF NOT EXISTS Calificacion_Bimestral (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES Estudiante(id),
    competencia_id INT REFERENCES Competencia(id),
    periodo_id INT REFERENCES Periodo_Academico(id),
    escala_id INT REFERENCES Escala_Calificacion(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1)),
    CONSTRAINT uc_calificacion_bimestral UNIQUE (estudiante_id, competencia_id, periodo_id)
);
