-- Eliminar la payment order existente del admin
DELETE FROM payment_orders WHERE id = 'f95de85a-be7c-4013-8aa2-345f67bbd30a';

-- Resetear el trip_payment_accumulator para permitir nueva solicitud
UPDATE trip_payment_accumulator 
SET payment_order_created = false
WHERE id = '60a13378-f622-455f-a746-98b5ebb64a07';