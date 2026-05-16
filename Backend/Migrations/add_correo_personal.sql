-- Agregar columna correo_personal a la tabla usuario para almacenar el correo personal del padre/usuario separadamente del correo institucional de login
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS correo_personal VARCHAR(255);
