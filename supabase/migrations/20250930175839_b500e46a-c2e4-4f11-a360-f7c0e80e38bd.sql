-- Fix get_next_label_number function to include WHERE clause
CREATE OR REPLACE FUNCTION public.get_next_label_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  counter_id UUID;
BEGIN
  -- Get the first counter id (there should only be one)
  SELECT id INTO counter_id FROM public.label_counter LIMIT 1;
  
  -- If no counter exists, initialize one
  IF counter_id IS NULL THEN
    INSERT INTO public.label_counter (current_count, updated_at)
    VALUES (1, NOW())
    RETURNING current_count, id INTO next_number, counter_id;
  ELSE
    -- Update and return the new number atomically with WHERE clause
    UPDATE public.label_counter
    SET 
      current_count = current_count + 1,
      updated_at = NOW()
    WHERE id = counter_id
    RETURNING current_count INTO next_number;
  END IF;
  
  RETURN next_number;
END;
$function$;