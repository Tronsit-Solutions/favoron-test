-- Eliminar la función y trigger que automáticamente marca trips como completed usando CASCADE
DROP FUNCTION IF EXISTS public.check_trip_completion() CASCADE;

-- Agregar nuevo estado "completed_paid" para trips
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;

ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
CHECK (status IN (
  'pending_approval', 'approved', 'active', 'completed_paid', 'rejected'
));

-- Agregar comentario para documentar el nuevo estado
COMMENT ON COLUMN public.trips.status IS 'Estado del viaje: completed_paid significa que todos los paquetes fueron entregados y el viajero recibió su pago';