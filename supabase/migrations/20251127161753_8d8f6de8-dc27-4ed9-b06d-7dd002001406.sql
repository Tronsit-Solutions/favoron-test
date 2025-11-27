-- Fix security warning: Set explicit search_path for the trigger function
CREATE OR REPLACE FUNCTION auto_transition_to_in_transit()
RETURNS TRIGGER AS $$
BEGIN
  -- If purchase_confirmation is added and package is in valid pre-transit state
  IF NEW.purchase_confirmation IS NOT NULL 
     AND OLD.purchase_confirmation IS NULL
     AND NEW.status IN ('pending_purchase', 'payment_confirmed', 'paid') THEN
    NEW.status := 'in_transit';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';