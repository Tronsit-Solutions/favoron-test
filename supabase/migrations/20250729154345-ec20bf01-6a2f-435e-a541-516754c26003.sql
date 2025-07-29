-- Primero agregar la columna necesaria
ALTER TABLE public.trip_payment_accumulator 
ADD COLUMN IF NOT EXISTS all_packages_delivered boolean DEFAULT false;