-- Eliminar el constraint existente
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_delivery_method_check;

-- Agregar el nuevo constraint con valores adicionales
ALTER TABLE trips ADD CONSTRAINT trips_delivery_method_check 
CHECK (delivery_method = ANY (ARRAY[
  'oficina',
  'mensajero',
  'pickup',
  'correo',
  'coordinacion_shopper'
]));