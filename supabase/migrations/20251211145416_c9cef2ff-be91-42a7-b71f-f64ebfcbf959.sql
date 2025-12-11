-- Primero, eliminar duplicados si existen (mantener el más reciente por trip_id)
DELETE FROM trip_payment_accumulator a
USING trip_payment_accumulator b
WHERE a.trip_id = b.trip_id 
  AND a.updated_at < b.updated_at;

-- Agregar constraint UNIQUE en trip_id para que ON CONFLICT funcione
ALTER TABLE trip_payment_accumulator 
ADD CONSTRAINT trip_payment_accumulator_trip_id_key UNIQUE (trip_id);