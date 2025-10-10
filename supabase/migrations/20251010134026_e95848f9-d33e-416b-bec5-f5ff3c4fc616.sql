-- Crear bucket privado para fotos de productos personales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-photos',
  'product-photos',
  false,
  5242880, -- 5MB por foto
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Usuarios pueden subir fotos solo de sus propios paquetes
CREATE POLICY "Users can upload product photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuarios pueden ver sus propias fotos
CREATE POLICY "Users can view own product photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Viajeros asignados pueden ver fotos del paquete
CREATE POLICY "Travelers can view assigned package photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-photos' 
  AND EXISTS (
    SELECT 1 FROM packages p
    JOIN trips t ON t.id = p.matched_trip_id
    WHERE t.user_id = auth.uid()
    AND (storage.foldername(name))[1] = p.user_id::text
  )
);

-- Admins pueden ver todas las fotos
CREATE POLICY "Admins can view all product photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-photos' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins pueden eliminar fotos si es necesario
CREATE POLICY "Admins can delete product photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-photos' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);