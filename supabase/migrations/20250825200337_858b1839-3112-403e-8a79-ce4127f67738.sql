
-- 1) Tabla para logs de errores del cliente
CREATE TABLE IF NOT EXISTS public.client_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  route TEXT,
  url TEXT,
  referrer TEXT,
  message TEXT NOT NULL,
  name TEXT,
  type TEXT,           -- 'error' | 'unhandledrejection' | 'console' (opcional)
  severity TEXT DEFAULT 'error', -- 'debug'|'info'|'warn'|'error'|'fatal'
  stack TEXT,
  browser JSONB,       -- { ua, platform, language, viewport, ... }
  context JSONB,       -- { extra: ... }
  fingerprint TEXT
);

-- 2) Habilitar RLS
ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

-- 3) Políticas
-- Solo administradores pueden ver
CREATE POLICY "Admins can view client errors"
  ON public.client_errors
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Solo administradores pueden borrar
CREATE POLICY "Admins can delete client errors"
  ON public.client_errors
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Usuarios autenticados pueden insertar sus propios errores (o con user_id = auth.uid())
CREATE POLICY "Authenticated users can log their own client errors"
  ON public.client_errors
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Nota: la Edge Function usará la service role y no requiere política adicional para insertar
-- (aunque RLS esté activo, la service role la evita). Se mantiene RLS por seguridad general.

-- 4) Índices útiles
CREATE INDEX IF NOT EXISTS idx_client_errors_created_at ON public.client_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_errors_severity ON public.client_errors (severity);
CREATE INDEX IF NOT EXISTS idx_client_errors_route ON public.client_errors (route);
CREATE INDEX IF NOT EXISTS idx_client_errors_user ON public.client_errors (user_id);
