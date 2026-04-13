UPDATE public.packages
SET status = 'pending_purchase',
    payment_method = 'card',
    payment_receipt = jsonb_build_object(
      'method', 'card',
      'provider', 'recurrente',
      'manual_verification', true,
      'verified_by', 'admin',
      'verified_at', now()::text,
      'note', 'Payment confirmed manually - webhook did not fire and checkout_id was cleared'
    ),
    updated_at = now()
WHERE id::text LIKE '8e8c9866%'
  AND status = 'payment_pending';