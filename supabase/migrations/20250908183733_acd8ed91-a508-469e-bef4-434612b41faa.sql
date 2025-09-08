-- Backfill: recalculate trip_payment_accumulator fields based on updated business rules
-- - total_packages_count: only packages with status in ('in_transit','received_by_traveler','delivered_to_office','completed','delivered')
-- - delivered_packages_count: packages 'completed' OR ('delivered_to_office' with admin_confirmation=true)
-- - accumulated_amount: sum of quote->>'price' over delivered-eligible packages
-- - all_packages_delivered: delivered_packages_count == total_packages_count (and total > 0)

WITH agg AS (
  SELECT
    tpa.id,
    COALESCE(SUM(
      CASE 
        WHEN p.status = 'completed' 
             OR (p.status = 'delivered_to_office' AND COALESCE((p.office_delivery->>'admin_confirmation')::boolean, false)) 
        THEN COALESCE(NULLIF(p.quote->>'price','')::numeric, 0)
        ELSE 0
      END
    ), 0) AS accumulated_amount,
    COUNT(*) FILTER (
      WHERE p.status = 'completed' 
         OR (p.status = 'delivered_to_office' AND COALESCE((p.office_delivery->>'admin_confirmation')::boolean, false))
    ) AS delivered_packages_count,
    COUNT(*) FILTER (
      WHERE p.status = ANY (ARRAY['in_transit','received_by_traveler','delivered_to_office','completed','delivered'])
    ) AS total_packages_count
  FROM public.trip_payment_accumulator tpa
  LEFT JOIN public.packages p 
    ON p.matched_trip_id = tpa.trip_id
  GROUP BY tpa.id
)
UPDATE public.trip_payment_accumulator AS tpa
SET 
  accumulated_amount = a.accumulated_amount,
  delivered_packages_count = a.delivered_packages_count,
  total_packages_count = a.total_packages_count,
  all_packages_delivered = CASE 
    WHEN a.total_packages_count > 0 AND a.delivered_packages_count = a.total_packages_count THEN true 
    ELSE false 
  END,
  updated_at = NOW()
FROM agg a
WHERE a.id = tpa.id;