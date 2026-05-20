-- Script para agregar grado_id a la tabla competencia y hacer que sea administrado a nivel de Curso + Grado
ALTER TABLE competencia ADD COLUMN IF NOT EXISTS grado_id INT REFERENCES grado(id);

-- Para las competencias existentes, asociarlas a un grado basándonos en la carga_academica actual si existe
UPDATE competencia c
SET grado_id = a.grado_id
FROM carga_academica ca
JOIN aula a ON ca.aula_id = a.id
WHERE c.carga_id = ca.id AND c.grado_id IS NULL;
