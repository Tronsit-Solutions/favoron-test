-- Corregir el paquete de Katia Leal que ya tiene auto_approved:true pero status incorrecto
UPDATE packages
SET status = 'pending_purchase'
WHERE id = '64c21f31-8e4e-4a83-87f6-d5ac4cdf2da3'
  AND user_id = '4601ef02-e28a-400a-9dd5-a9550b58920a'
  AND status = 'payment_pending_approval'
  AND payment_receipt->>'auto_approved' = 'true';