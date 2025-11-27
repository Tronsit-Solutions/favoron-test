-- Tabla de códigos de descuento
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  single_use_per_user BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de uso de códigos (solo registra usos CONFIRMADOS al aprobar pago)
CREATE TABLE IF NOT EXISTS public.discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(discount_code_id, package_id)
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(LOWER(code));
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code_id ON public.discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_user_id ON public.discount_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_package_id ON public.discount_code_usage(package_id);

-- RLS Policies
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Admins pueden hacer todo con discount_codes
CREATE POLICY "Admins can do everything with discount_codes"
  ON public.discount_codes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Users pueden ver códigos activos (para validación)
CREATE POLICY "Users can view active discount_codes"
  ON public.discount_codes
  FOR SELECT
  USING (is_active = true);

-- Admins pueden ver todo el uso de códigos
CREATE POLICY "Admins can view all discount_code_usage"
  ON public.discount_code_usage
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Users pueden ver su propio uso
CREATE POLICY "Users can view their own discount_code_usage"
  ON public.discount_code_usage
  FOR SELECT
  USING (user_id = auth.uid());

-- Función para validar códigos de descuento (sin registrar uso)
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  _code TEXT,
  _order_amount NUMERIC,
  _user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discount_record RECORD;
  usage_count INTEGER;
  user_usage_count INTEGER;
  calculated_discount NUMERIC;
  result JSONB;
BEGIN
  -- Buscar el código (case-insensitive)
  SELECT * INTO discount_record
  FROM public.discount_codes
  WHERE LOWER(code) = LOWER(_code)
    AND is_active = true;
  
  -- Código no existe o inactivo
  IF discount_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Código no válido o inactivo'
    );
  END IF;
  
  -- Verificar expiración
  IF discount_record.expires_at IS NOT NULL AND discount_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Código expirado'
    );
  END IF;
  
  -- Verificar monto mínimo
  IF _order_amount < discount_record.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'El pedido no cumple con el monto mínimo de Q' || discount_record.min_order_amount
    );
  END IF;
  
  -- Contar usos totales CONFIRMADOS (en discount_code_usage)
  SELECT COUNT(*) INTO usage_count
  FROM public.discount_code_usage
  WHERE discount_code_id = discount_record.id;
  
  -- Verificar máximo de usos
  IF discount_record.max_uses IS NOT NULL AND usage_count >= discount_record.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Este código ha alcanzado su límite de usos'
    );
  END IF;
  
  -- Verificar uso por usuario
  IF discount_record.single_use_per_user THEN
    SELECT COUNT(*) INTO user_usage_count
    FROM public.discount_code_usage
    WHERE discount_code_id = discount_record.id
      AND user_id = _user_id;
    
    IF user_usage_count > 0 THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Ya has usado este código anteriormente'
      );
    END IF;
  END IF;
  
  -- Calcular descuento
  IF discount_record.discount_type = 'percentage' THEN
    calculated_discount := (_order_amount * discount_record.discount_value / 100);
  ELSE
    calculated_discount := discount_record.discount_value;
  END IF;
  
  -- Aplicar máximo de descuento si existe
  IF discount_record.max_discount_amount IS NOT NULL THEN
    calculated_discount := LEAST(calculated_discount, discount_record.max_discount_amount);
  END IF;
  
  -- No puede ser mayor al monto de la orden
  calculated_discount := LEAST(calculated_discount, _order_amount);
  
  -- Retornar resultado válido
  RETURN jsonb_build_object(
    'valid', true,
    'discountCodeId', discount_record.id,
    'code', discount_record.code,
    'discountType', discount_record.discount_type,
    'discountValue', discount_record.discount_value,
    'calculatedDiscount', calculated_discount,
    'description', discount_record.description
  );
END;
$$;

-- Trigger para registrar uso de código SOLO al aprobar pago
CREATE OR REPLACE FUNCTION public.register_discount_usage_on_payment_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  discount_code_id UUID;
  discount_amount NUMERIC;
BEGIN
  -- Solo actuar cuando el paquete pasa a pending_purchase desde payment_pending_approval, quote_accepted, o payment_pending
  IF NEW.status = 'pending_purchase' 
     AND OLD.status IN ('payment_pending_approval', 'quote_accepted', 'payment_pending')
     AND NEW.quote IS NOT NULL
     AND NEW.quote ? 'discountCodeId' THEN
    
    discount_code_id := (NEW.quote->>'discountCodeId')::UUID;
    discount_amount := (NEW.quote->>'discountAmount')::NUMERIC;
    
    -- Insertar registro de uso (usar ON CONFLICT por si acaso)
    INSERT INTO public.discount_code_usage (
      discount_code_id,
      package_id,
      user_id,
      discount_amount,
      used_at
    ) VALUES (
      discount_code_id,
      NEW.id,
      NEW.user_id,
      discount_amount,
      NOW()
    )
    ON CONFLICT (discount_code_id, package_id) DO NOTHING;
    
    RAISE NOTICE 'Registered discount code usage for package % with code %', NEW.id, discount_code_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_register_discount_usage ON public.packages;
CREATE TRIGGER trigger_register_discount_usage
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.register_discount_usage_on_payment_approval();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_discount_codes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_discount_codes_updated_at ON public.discount_codes;
CREATE TRIGGER trigger_update_discount_codes_updated_at
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discount_codes_updated_at();