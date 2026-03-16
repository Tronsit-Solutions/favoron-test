
-- Data correction: Move quote from package to assignment for "lulu shoes" multi-assignment

-- 1. Move quote data to Lucas Farias's assignment
UPDATE public.package_assignments
SET 
  status = 'quote_sent',
  quote = '{"adminAssignedTipAccepted": true, "deliveryFee": 0, "message": "", "price": 120, "serviceFee": 60, "totalPrice": 180}'::jsonb,
  quote_expires_at = now() + interval '48 hours',
  updated_at = now()
WHERE id = '3ee66370-d834-401f-a83b-383ee44ba38f';

-- 2. Reset the package back to competing state
UPDATE public.packages
SET 
  status = 'matched',
  quote = NULL,
  quote_expires_at = NULL,
  updated_at = now()
WHERE id = '5c90d55b-2e35-44d1-bb59-fda5aeab277c';
