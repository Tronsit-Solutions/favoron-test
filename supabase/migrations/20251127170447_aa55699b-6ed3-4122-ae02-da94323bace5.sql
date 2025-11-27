-- Update the 21 affected packages to completed status
UPDATE packages
SET status = 'completed',
    updated_at = NOW()
WHERE updated_at >= '2025-11-27 17:01:35.308246'
  AND updated_at <= '2025-11-27 17:01:35.308246'
  AND status = 'delivered_to_office'
  AND office_delivery IS NOT NULL
  AND traveler_confirmation IS NOT NULL;