-- Part 1: Restore correct states for affected packages
-- Todos los paquetes con office_delivery y traveler_confirmation deben estar en delivered_to_office

UPDATE packages
SET status = 'delivered_to_office',
    updated_at = NOW()
WHERE updated_at = '2025-11-27 16:15:41.099736+00'
  AND status = 'in_transit'
  AND office_delivery IS NOT NULL
  AND traveler_confirmation IS NOT NULL;

-- Part 2: Fix the trigger to prevent future incorrect transitions
CREATE OR REPLACE FUNCTION public.auto_transition_to_in_transit()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo transicionar si:
  -- 1. purchase_confirmation se acaba de agregar (era NULL, ahora no lo es)
  -- 2. El paquete está en un estado pre-tránsito válido
  -- 3. NO está ya en un estado avanzado
  IF NEW.purchase_confirmation IS NOT NULL 
     AND OLD.purchase_confirmation IS NULL
     AND OLD.status IN ('pending_purchase', 'payment_confirmed', 'paid')
     AND NEW.status NOT IN ('received_by_traveler', 'pending_office_confirmation', 
                            'delivered_to_office', 'completed', 'cancelled')
  THEN
    NEW.status := 'in_transit';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;