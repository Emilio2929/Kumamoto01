-- =============================================================
-- SCRIPT COMPLETO CONSOLIDADO: TABLAS + DATOS INICIALES
-- PROYECTO: Alerta Escolar Kumamoto
-- =============================================================

-- 1. ESTRUCTURA DE TABLAS (ORDENADO POR DEPENDENCIAS)

CREATE TABLE IF NOT EXISTS rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS grado (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS seccion (
    id SERIAL PRIMARY KEY,
    letra CHAR(1) NOT NULL,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS curso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS periodo_academico (
    id SERIAL PRIMARY KEY,
    anio_lectivo VARCHAR(4) NOT NULL DEFAULT '2026',
    numero INT NOT NULL CHECK (numero IN (1, 2, 3, 4)),
    nombre VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    esta_cerrado BOOLEAN DEFAULT FALSE,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS semana_academica (
    id SERIAL PRIMARY KEY,
    periodo_id INT REFERENCES periodo_academico(id),
    numero_semana INT NOT NULL,
    estado SMALLINT DEFAULT 1,
    CONSTRAINT uc_periodo_semana UNIQUE (periodo_id, numero_semana)
);

CREATE TABLE IF NOT EXISTS escala_calificacion (
    id SERIAL PRIMARY KEY,
    letra VARCHAR(2) UNIQUE NOT NULL,
    descripcion VARCHAR(50) NOT NULL,
    significado TEXT NOT NULL,
    requiere_intervencion BOOLEAN DEFAULT FALSE,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usuario (
    id SERIAL PRIMARY KEY,
    dni CHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NULL,
    telefono VARCHAR(15) NULL,
    clave_hash TEXT NOT NULL,
    rol_id INT REFERENCES rol(id),
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS aula (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100),
    capacidad INT NOT NULL,
    grado_id INT REFERENCES grado(id),
    seccion_id INT REFERENCES seccion(id),
    estado SMALLINT DEFAULT 1,
    CONSTRAINT uc_grado_seccion UNIQUE (grado_id, seccion_id)
);

CREATE TABLE IF NOT EXISTS estudiante (
    id SERIAL PRIMARY KEY,
    dni CHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NULL,
    telefono VARCHAR(15) NULL,
    aula_id INT REFERENCES aula(id),
    padre_id INT REFERENCES usuario(id),
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS asignacion_auxiliar (
    id SERIAL PRIMARY KEY,
    auxiliar_id INT REFERENCES usuario(id),
    aula_id INT REFERENCES aula(id),
    periodo_lectivo VARCHAR(10),
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS carga_academica (
    id SERIAL PRIMARY KEY,
    docente_id INT REFERENCES usuario(id),
    curso_id INT REFERENCES curso(id),
    aula_id INT REFERENCES aula(id),
    periodo_lectivo VARCHAR(10),
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS horario_curso (
    id SERIAL PRIMARY KEY,
    carga_id INT REFERENCES carga_academica(id),
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS competencia (
    id SERIAL PRIMARY KEY,
    curso_id INT REFERENCES curso(id),
    carga_id INT REFERENCES carga_academica(id) NULL,
    codigo VARCHAR(10) NULL,
    nombre VARCHAR(255) NOT NULL,
    numero_orden INT NOT NULL,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS calificacion (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES estudiante(id),
    competencia_id INT REFERENCES competencia(id),
    semana_id INT REFERENCES semana_academica(id),
    escala_id INT REFERENCES escala_calificacion(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT DEFAULT 1,
    CONSTRAINT uc_calificacion_semana UNIQUE (estudiante_id, competencia_id, semana_id)
);

CREATE TABLE IF NOT EXISTS calificacion_bimestral (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES estudiante(id),
    competencia_id INT REFERENCES competencia(id),
    periodo_id INT REFERENCES periodo_academico(id),
    escala_id INT REFERENCES escala_calificacion(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT DEFAULT 1,
    CONSTRAINT uc_calificacion_bimestral UNIQUE (estudiante_id, competencia_id, periodo_id)
);

CREATE TABLE IF NOT EXISTS asistencia (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES estudiante(id),
    registrado_por_id INT REFERENCES usuario(id),
    carga_academica_id INT REFERENCES carga_academica(id) NULL,
    asignacion_auxiliar_id INT REFERENCES asignacion_auxiliar(id) NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    valor CHAR(1) CHECK (valor IN ('P', 'F', 'T', 'J')),
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS incidencia (
    id SERIAL PRIMARY KEY,
    estudiante_id INT REFERENCES estudiante(id),
    registrado_por_id INT REFERENCES usuario(id),
    tipo_incidencia VARCHAR(50),
    descripcion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS alumno_riesgo (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiante(id),
    nivel_riesgo VARCHAR(20) NOT NULL DEFAULT 'Bajo',
    motivo TEXT,
    recomendacion TEXT,
    fecha_calculo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bimestre INTEGER,
    estado SMALLINT DEFAULT 1
);

-- 2. DATOS INICIALES (SEED DATA)

INSERT INTO rol (nombre) VALUES ('Director'), ('Docente'), ('Auxiliar'), ('Padre') ON CONFLICT DO NOTHING;
INSERT INTO grado (nombre) VALUES ('1ro Secundaria'), ('2do Secundaria'), ('3ro Secundaria'), ('4to Secundaria'), ('5to Secundaria') ON CONFLICT DO NOTHING;
INSERT INTO seccion (letra) VALUES ('A'), ('B'), ('C') ON CONFLICT DO NOTHING;
INSERT INTO curso (nombre) VALUES ('Matemática'), ('Comunicación'), ('Ciencias Sociales'), ('DPCC'), ('Inglés'), ('Arte') ON CONFLICT DO NOTHING;

INSERT INTO escala_calificacion (letra, descripcion, significado, requiere_intervencion) VALUES
    ('AD', 'Logro Destacado', 'Nivel superior a lo esperado.', FALSE),
    ('A', 'Logro Previsto', 'Cumple satisfactoriamente.', FALSE),
    ('B', 'En Proceso', 'Cerca del nivel esperado.', FALSE),
    ('C', 'En Inicio', 'Progreso mínimo.', TRUE)
    ON CONFLICT DO NOTHING;

INSERT INTO periodo_academico (anio_lectivo, numero, nombre, fecha_inicio, fecha_fin) VALUES
    ('2026', 1, '1° Bimestre', '2026-03-16', '2026-05-15'),
    ('2026', 2, '2° Bimestre', '2026-05-18', '2026-07-24'),
    ('2026', 3, '3° Bimestre', '2026-08-10', '2026-10-09'),
    ('2026', 4, '4° Bimestre', '2026-10-12', '2026-12-18')
    ON CONFLICT DO NOTHING;

-- Semanas para el primer bimestre
INSERT INTO semana_academica (periodo_id, numero_semana) 
SELECT 1, generate_series(1, 9) ON CONFLICT DO NOTHING;

-- Usuarios de prueba
INSERT INTO usuario (dni, nombres, apellidos, correo, telefono, clave_hash, rol_id) VALUES
    ('11111111', 'Ana', 'Directora', 'directora@kumamoto.edu.pe', '987654321', '123456', 1),
    ('22222222', 'Carlos', 'Docente', 'docente@kumamoto.edu.pe', '999888777', '123456', 2),
    ('33333333', 'Maria', 'Auxiliar', 'auxiliar@kumamoto.edu.pe', '911222333', '123456', 3),
    ('44444444', 'Jerso', 'Padre', 'padre@kumamoto.edu.pe', '922333444', '123456', 4)
    ON CONFLICT DO NOTHING;
