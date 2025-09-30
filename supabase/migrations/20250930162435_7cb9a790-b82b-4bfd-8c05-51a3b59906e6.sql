-- Update label counter to reflect only packages that have required physical labels (70)
-- These are packages in states: paid, pending_purchase, purchased, shipped, in_transit, 
-- received_by_traveler, pending_office_confirmation, delivered_to_office, out_for_delivery, completed

UPDATE public.label_counter
SET current_count = 70,
    updated_at = NOW()
WHERE id = (SELECT id FROM public.label_counter LIMIT 1);

-- Add comment to document the criteria
COMMENT ON FUNCTION public.get_next_label_number() IS 
'Generates sequential label numbers for packages that require physical labels.
Only call this function for packages in eligible states: paid, pending_purchase, purchased, 
shipped, in_transit, received_by_traveler, pending_office_confirmation, delivered_to_office, 
out_for_delivery, completed.';
