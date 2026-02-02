-- Agregar nueva columna para país de destino
ALTER TABLE packages 
ADD COLUMN package_destination_country TEXT DEFAULT 'guatemala';

-- Comentario para documentación
COMMENT ON COLUMN packages.package_destination_country IS 'Country key matching src/lib/countries.ts values (e.g., guatemala, estados-unidos, espana)';