-- Agregar columnas de comprobante de pago al trip_payment_accumulator
ALTER TABLE public.trip_payment_accumulator 
ADD COLUMN payment_receipt_url text,
ADD COLUMN payment_receipt_filename text,
ADD COLUMN payment_completed_at timestamp with time zone,
ADD COLUMN payment_completed_by uuid;

-- Función para sincronizar información del comprobante desde payment_orders
CREATE OR REPLACE FUNCTION public.sync_payment_receipt_to_accumulator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Solo actualizar cuando se complete un pago y se suba un comprobante
  IF NEW.status = 'completed' AND NEW.receipt_url IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.receipt_url IS NULL) THEN
    
    -- Actualizar el trip_payment_accumulator correspondiente
    UPDATE public.trip_payment_accumulator
    SET 
      payment_receipt_url = NEW.receipt_url,
      payment_receipt_filename = NEW.receipt_filename,
      payment_completed_at = NEW.completed_at,
      payment_completed_by = auth.uid(),
      updated_at = NOW()
    WHERE trip_id = NEW.trip_id 
      AND traveler_id = NEW.traveler_id;
      
    RAISE NOTICE 'Synced payment receipt to accumulator for trip % and traveler %', NEW.trip_id, NEW.traveler_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear trigger para sincronización automática
CREATE TRIGGER sync_payment_receipt_trigger
  AFTER UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_payment_receipt_to_accumulator();

-- Migrar datos existentes de payment_orders completadas al trip_payment_accumulator
UPDATE public.trip_payment_accumulator
SET 
  payment_receipt_url = po.receipt_url,
  payment_receipt_filename = po.receipt_filename,
  payment_completed_at = po.completed_at,
  updated_at = NOW()
FROM public.payment_orders po
WHERE po.trip_id = trip_payment_accumulator.trip_id
  AND po.traveler_id = trip_payment_accumulator.traveler_id
  AND po.status = 'completed'
  AND po.receipt_url IS NOT NULL
  AND trip_payment_accumulator.payment_receipt_url IS NULL;