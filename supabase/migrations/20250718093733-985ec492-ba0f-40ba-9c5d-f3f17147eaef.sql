-- Modificar payment_orders para pagos por viaje en lugar de por paquete
-- Agregar trip_id y hacer package_id opcional
ALTER TABLE public.payment_orders 
ADD COLUMN trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
ALTER COLUMN package_id DROP NOT NULL;

-- Crear índice para mejorar rendimiento de consultas por viaje
CREATE INDEX idx_payment_orders_trip_id ON public.payment_orders(trip_id);

-- Agregar constraint para asegurar que o hay trip_id o package_id (no ambos nulos)
ALTER TABLE public.payment_orders 
ADD CONSTRAINT payment_orders_trip_or_package_check 
CHECK (trip_id IS NOT NULL OR package_id IS NOT NULL);

-- Actualizar política RLS para incluir traveler via trip_id
DROP POLICY IF EXISTS "Travelers can view their own payment orders" ON public.payment_orders;

CREATE POLICY "Travelers can view their own payment orders" 
ON public.payment_orders 
FOR SELECT 
USING (
  auth.uid() = traveler_id OR 
  trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
);

-- Crear tabla para tracking de tips acumulados por viaje
CREATE TABLE public.trip_payment_accumulator (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accumulated_amount DECIMAL NOT NULL DEFAULT 0,
  delivered_packages_count INTEGER NOT NULL DEFAULT 0,
  total_packages_count INTEGER NOT NULL DEFAULT 0,
  payment_order_created BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, traveler_id)
);

-- Enable RLS
ALTER TABLE public.trip_payment_accumulator ENABLE ROW LEVEL SECURITY;

-- RLS policies para trip_payment_accumulator
CREATE POLICY "Travelers can view their own trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR SELECT 
USING (auth.uid() = traveler_id);

CREATE POLICY "Travelers can update their own trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR UPDATE 
USING (auth.uid() = traveler_id);

CREATE POLICY "System can insert trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all trip payment accumulators" 
ON public.trip_payment_accumulator 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Crear función para actualizar el acumulador cuando se entrega un paquete
CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
RETURNS TRIGGER AS $$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
BEGIN
  -- Solo procesar si el paquete se marca como entregado en oficina
  IF NEW.status = 'delivered_to_office' AND OLD.status != 'delivered_to_office' THEN
    -- Obtener el traveler_id del viaje matched
    SELECT t.user_id INTO trip_traveler_id
    FROM public.trips t
    WHERE t.id = NEW.matched_trip_id;
    
    -- Obtener el tip del quote
    tip_amount := COALESCE((NEW.quote->>'price')::DECIMAL, 0);
    
    -- Contar total de paquetes del viaje
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id;
    
    -- Contar paquetes entregados del viaje
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office';
    
    -- Insertar o actualizar el acumulador
    INSERT INTO public.trip_payment_accumulator (
      trip_id, 
      traveler_id, 
      accumulated_amount, 
      delivered_packages_count,
      total_packages_count
    )
    VALUES (
      NEW.matched_trip_id, 
      trip_traveler_id, 
      tip_amount,
      delivered_packages,
      total_packages
    )
    ON CONFLICT (trip_id, traveler_id) 
    DO UPDATE SET
      accumulated_amount = trip_payment_accumulator.accumulated_amount + tip_amount,
      delivered_packages_count = delivered_packages,
      total_packages_count = total_packages,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar acumulador automáticamente
CREATE TRIGGER update_trip_payment_accumulator_trigger
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trip_payment_accumulator();

-- Trigger para actualizar updated_at
CREATE TRIGGER update_trip_payment_accumulator_updated_at
  BEFORE UPDATE ON public.trip_payment_accumulator
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();