-- =====================================================
-- SECURITY FIX: Reforzar RLS en user_financial_data
-- Proteger datos financieros sensibles contra acceso anónimo
-- =====================================================

-- 1. Crear función helper para verificar autenticación
CREATE OR REPLACE FUNCTION public.verify_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

COMMENT ON FUNCTION public.verify_authenticated() IS 
'Security helper function to verify user is authenticated. Returns true only if auth.uid() IS NOT NULL.';

-- 2. Asegurar que user_id no pueda ser NULL (prevenir inserción maliciosa)
ALTER TABLE public.user_financial_data 
ALTER COLUMN user_id SET NOT NULL;

-- 3. Agregar índice para performance de RLS
CREATE INDEX IF NOT EXISTS idx_user_financial_data_user_id 
ON public.user_financial_data(user_id);

-- 4. Eliminar políticas vulnerables existentes
DROP POLICY IF EXISTS "Users can view own financial data only" ON public.user_financial_data;
DROP POLICY IF EXISTS "Admins can view financial data with verification" ON public.user_financial_data;
DROP POLICY IF EXISTS "Users can insert own financial data only" ON public.user_financial_data;
DROP POLICY IF EXISTS "Users can update own financial data only" ON public.user_financial_data;

-- 5. POLÍTICA DE NEGACIÓN EXPLÍCITA PARA USUARIOS ANÓNIMOS
CREATE POLICY "Block all anonymous access to financial data"
ON public.user_financial_data
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 6. SELECT: Usuario autenticado puede ver solo sus propios datos
CREATE POLICY "Authenticated users can view own financial data"
ON public.user_financial_data
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 7. SELECT: Admin autenticado puede ver todos los datos
CREATE POLICY "Authenticated admins can view all financial data"
ON public.user_financial_data
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- 8. INSERT: Solo usuario autenticado puede insertar sus propios datos
CREATE POLICY "Authenticated users can insert own financial data"
ON public.user_financial_data
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- 9. UPDATE: Solo usuario autenticado puede actualizar sus propios datos
CREATE POLICY "Authenticated users can update own financial data"
ON public.user_financial_data
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- 10. DELETE: Bloquear todas las eliminaciones (datos financieros no deben eliminarse)
CREATE POLICY "Prevent deletion of financial data"
ON public.user_financial_data
FOR DELETE
TO authenticated
USING (false);

-- 11. Agregar comentario de documentación de seguridad
COMMENT ON TABLE public.user_financial_data IS 
'⚠️ CRITICAL SECURITY TABLE - Contains sensitive financial data (bank accounts, document numbers).
RLS POLICIES ENFORCED:
- RESTRICTIVE policy blocks ALL anonymous access (auth.uid() IS NULL)
- Users can only view/modify their own data when authenticated
- Admins can view all data when authenticated
- All DELETE operations are blocked
- user_id column is NOT NULL to prevent NULL-based attacks
- Indexed on user_id for RLS performance

NEVER disable RLS on this table. NEVER allow public access.';

-- 12. Asegurar que RLS esté habilitado (en caso de que se haya deshabilitado)
ALTER TABLE public.user_financial_data ENABLE ROW LEVEL SECURITY;

-- 13. Forzar RLS incluso para el owner de la tabla
ALTER TABLE public.user_financial_data FORCE ROW LEVEL SECURITY;