-- =====================================================
-- A/B TESTING: Agregar columna ab_test_group a profiles
-- =====================================================

-- 1. Agregar columna ab_test_group a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ab_test_group TEXT DEFAULT NULL;

-- 2. Agregar comentario para documentación
COMMENT ON COLUMN public.profiles.ab_test_group IS 'A/B test group assignment: A = familiar tone, B = data-driven tone';

-- 3. Asignar aleatoriamente grupos A o B a usuarios existentes (50/50)
UPDATE public.profiles
SET ab_test_group = CASE 
  WHEN random() < 0.5 THEN 'A'
  ELSE 'B'
END
WHERE ab_test_group IS NULL;

-- 4. Modificar función handle_new_user para asignar grupo A/B automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    ab_test_group
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END
  );
  RETURN new;
END;
$$;

-- 5. Crear código de descuento GRACIAS5 (5% de descuento, uso único por usuario)
INSERT INTO public.discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  is_active,
  single_use_per_user,
  min_order_amount
)
VALUES (
  'GRACIAS5',
  'Descuento de bienvenida 5% para nuevos usuarios - A/B testing correos',
  'percentage',
  5,
  true,
  true,
  0
)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_value = EXCLUDED.discount_value,
  is_active = EXCLUDED.is_active,
  single_use_per_user = EXCLUDED.single_use_per_user,
  updated_at = NOW();