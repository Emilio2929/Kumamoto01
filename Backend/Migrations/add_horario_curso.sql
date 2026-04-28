-- Tabla para horarios de cada carga académica (docente-curso-aula)
CREATE TABLE IF NOT EXISTS horario_curso (
    id             SERIAL PRIMARY KEY,
    carga_id       INT NOT NULL REFERENCES carga_academica(id) ON DELETE CASCADE,
    dia_semana     VARCHAR(15) NOT NULL,  -- 'Lunes','Martes','Miércoles','Jueves','Viernes'
    hora_inicio    TIME NOT NULL,
    hora_fin       TIME NOT NULL
);
