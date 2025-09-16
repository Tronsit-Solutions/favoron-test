-- Add completePrice to all existing quotes
UPDATE packages 
SET quote = quote || jsonb_build_object('completePrice', 
  COALESCE((quote->>'price')::numeric, 0) + 
  COALESCE((quote->>'serviceFee')::numeric, 0) + 
  COALESCE((quote->>'deliveryFee')::numeric, 0)
)
WHERE quote IS NOT NULL 
  AND NOT (quote ? 'completePrice');