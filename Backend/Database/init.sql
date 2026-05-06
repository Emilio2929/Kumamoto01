-- =============================================================
-- SCRIPT COMPLETO: TABLAS + DATOS INICIALES
-- BASE DE DATOS: kumamoto
-- =============================================================
CREATE DATABASE kumamoto;
CREATE TABLE IF NOT EXISTS Rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Grado (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Seccion (
    id SERIAL PRIMARY KEY,
    letra CHAR(1) NOT NULL,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Curso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Competencia (
    id SERIAL PRIMARY KEY,
    curso_id INT REFERENCES Curso(id),
    nombre VARCHAR(255) NOT NULL,
    numero_orden INT NOT NULL,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1)),
    CONSTRAINT uc_curso_orden UNIQUE (curso_id, numero_orden)
);

CREATE TABLE IF NOT EXISTS Periodo_Academico (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    esta_cerrado BOOLEAN DEFAULT FALSE,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Usuario (
    id SERIAL PRIMARY KEY,
    dni CHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NULL,
    telefono VARCHAR(15) NULL,
    clave_hash TEXT NOT NULL,
    rol_id INT REFERENCES Rol(id),
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Aula (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100),
    capacidad INT NOT NULL,
    grado_id INT REFERENCES Grado(id),
    seccion_id INT REFERENCES Seccion(id),
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1)),
    CONSTRAINT uc_grado_seccion UNIQUE (grado_id, seccion_id)
);

CREATE TABLE IF NOT EXISTS Estudiante (
    id SERIAL PRIMARY KEY,
    dni CHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NULL,
    telefono VARCHAR(15) NULL,
    aula_id INT REFERENCES Aula(id),
    padre_id INT REFERENCES Usuario(id),
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Asignacion_Auxiliar (
    id SERIAL PRIMARY KEY,
    auxiliar_id INT REFERENCES Usuario(id),
    aula_id INT REFERENCES Aula(id),
    periodo_lectivo VARCHAR(10),
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Carga_Academica (
    id SERIAL PRIMARY KEY,
    docente_id INT REFERENCES Usuario(id),
    curso_id INT REFERENCES Curso(id),
    aula_id INT REFERENCES Aula(id),
    periodo_lectivo VARCHAR(10),
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Horario_Detalle (
    id SERIAL PRIMARY KEY,
    carga_id INT REFERENCES Carga_Academica(id),
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Calificacion (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES Estudiante(id),
    carga_id INT REFERENCES Carga_Academica(id),
    periodo_id INT REFERENCES Periodo_Academico(id),
    competencia_id INT REFERENCES Competencia(id),
    nota VARCHAR(2) NOT NULL CHECK (nota IN ('AD', 'A', 'B', 'C')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Asistencia (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES Estudiante(id),
    registrado_por_id INT REFERENCES Usuario(id),
    carga_academica_id INT REFERENCES Carga_Academica(id) NULL,
    asignacion_auxiliar_id INT REFERENCES Asignacion_Auxiliar(id) NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    valor CHAR(1) CHECK (valor IN ('P', 'F', 'T', 'J')),
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Incidencia (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES Estudiante(id),
    registrado_por_id INT REFERENCES Usuario(id),
    tipo_incidencia VARCHAR(50),
    descripcion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Alerta_Riesgo (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES Estudiante(id),
    nivel_riesgo VARCHAR(20),
    motivo TEXT,
    fecha_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT DEFAULT 1 CHECK (estado IN (0, 1))
);

-- =============================================================
-- SEED DATA
-- =============================================================

INSERT INTO Rol (nombre) VALUES ('Director'), ('Docente'), ('Auxiliar'), ('Padre')
    ON CONFLICT DO NOTHING;

INSERT INTO Grado (nombre) VALUES
    ('1ro Secundaria'), ('2do Secundaria'), ('3ro Secundaria'), ('4to Secundaria'), ('5to Secundaria')
    ON CONFLICT DO NOTHING;

INSERT INTO Seccion (letra) VALUES ('A'), ('B'), ('C')
    ON CONFLICT DO NOTHING;

INSERT INTO Curso (nombre) VALUES
    ('Matemática'), ('Comunicación'), ('Ciencias Sociales'), ('Desarrollo Personal, Ciudadanía y Cívica (DPCC)')
    ON CONFLICT DO NOTHING;

INSERT INTO Competencia (curso_id, nombre, numero_orden) VALUES
    (1, 'Resuelve problemas de cantidad', 1),
    (1, 'Resuelve problemas de regularidad, equivalencia y cambio', 2),
    (1, 'Resuelve problemas de forma, movimiento y localización', 3),
    (1, 'Resuelve problemas de gestión de datos e incertidumbre', 4),
    (2, 'Se comunica oralmente en su lengua materna', 1),
    (2, 'Lee diversos tipos de textos escritos en su lengua materna', 2),
    (2, 'Escribe diversos tipos de textos en su lengua materna', 3)
    ON CONFLICT DO NOTHING;

INSERT INTO Periodo_Academico (nombre, fecha_inicio, fecha_fin, esta_cerrado) VALUES
    ('1er Bimestre 2026', '2026-03-01', '2026-05-15', FALSE)
    ON CONFLICT DO NOTHING;

INSERT INTO Aula (descripcion, capacidad, grado_id, seccion_id) VALUES
    ('Aula 101 - Pabellón A', 30, 1, 1),
    ('Aula 102 - Pabellón A', 30, 1, 2),
    ('Aula 201 - Pabellón B', 30, 2, 1)
    ON CONFLICT ON CONSTRAINT uc_grado_seccion DO NOTHING;

INSERT INTO Usuario (dni, nombres, apellidos, correo, telefono, clave_hash, rol_id) VALUES
    ('11111111', 'Ana', 'Pérez', 'directora@kumamoto.edu.pe', '987654321', '123456', 1),
    ('22222222', 'Carlos', 'Mendoza', 'cmendoza@kumamoto.edu.pe', '999888777', '123456', 2),
    ('33333333', 'María', 'López', 'mlopez@kumamoto.edu.pe', '911222333', '123456', 2),
    ('44444444', 'Jorge', 'Salinas', 'jsalinas@kumamoto.edu.pe', '922333444', '123456', 3)
    ON CONFLICT (dni) DO NOTHING;

INSERT INTO Carga_Academica (docente_id, curso_id, aula_id, periodo_lectivo) VALUES (2, 1, 1, '2026')
    ON CONFLICT DO NOTHING;

INSERT INTO Horario_Detalle (carga_id, dia_semana, hora_inicio, hora_fin) VALUES
    (1, 'Martes', '08:00:00', '09:30:00'),
    (1, 'Jueves', '08:00:00', '09:30:00')
    ON CONFLICT DO NOTHING;
