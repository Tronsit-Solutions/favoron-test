UPDATE refund_orders 
SET status = 'completed', 
    completed_at = now(), 
    updated_at = now()
WHERE id = 'bfd0e375-07a6-4742-bde9-3a2e9ffa1aec' 
  AND status = 'approved'