-- Corregir los paquetes de Gabriela Gadsden que ya tienen auto_approved:true pero status incorrecto
UPDATE packages
SET status = 'pending_purchase'
WHERE user_id = 'e22f180b-b5b4-4b2d-8e37-51b5e2126919'
  AND id IN (
    '1ccfb346-e33b-4e30-8bc3-b9e0199951f7',  -- libro hebreo hilarius
    '64ea8769-ca4e-4a35-ba2f-995f60183df5'   -- Herramientas de cocina para niños toddlers
  )
  AND status = 'payment_pending_approval'
  AND payment_receipt->>'auto_approved' = 'true';