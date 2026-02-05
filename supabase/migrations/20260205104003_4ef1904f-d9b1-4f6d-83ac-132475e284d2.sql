-- Agregar referencia "Zona Bernabéu" al delivery point de Madrid
UPDATE delivery_points 
SET instructions = 'Zona Bernabéu', updated_at = now()
WHERE id = 'aeb8aa05-3674-4ce8-9574-e4e2f975539c';