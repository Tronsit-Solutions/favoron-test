-- Limpiar fotos base64 de TODOS los paquetes afectados
-- Reemplaza las fotos base64 con null para permitir operaciones sin timeout

UPDATE packages 
SET products_data = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'receivedPhoto' LIKE 'data:image%' 
      THEN jsonb_set(elem, '{receivedPhoto}', 'null'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(products_data) elem
),
updated_at = now()
WHERE id IN (
  SELECT p.id FROM packages p
  WHERE products_data IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(p.products_data) elem 
    WHERE elem->>'receivedPhoto' LIKE 'data:image%'
  )
);