-- Consolidar trust levels: earned/verified -> confiable con CASCADE
-- Estructura final: basic < confiable < prime

-- Paso 1: Remover el default temporalmente
ALTER TABLE public.profiles 
  ALTER COLUMN trust_level DROP DEFAULT;

-- Paso 2: Crear nuevo enum con nombres correctos
CREATE TYPE public.trust_level_new AS ENUM ('basic', 'confiable', 'prime');

-- Paso 3: Migrar columna para usar nuevo enum
ALTER TABLE public.profiles 
  ALTER COLUMN trust_level TYPE trust_level_new 
  USING (
    CASE trust_level::text
      WHEN 'basic' THEN 'basic'::trust_level_new
      WHEN 'earned' THEN 'confiable'::trust_level_new
      WHEN 'verified' THEN 'confiable'::trust_level_new
      WHEN 'prime' THEN 'prime'::trust_level_new
      ELSE 'basic'::trust_level_new
    END
  );

-- Paso 4: Eliminar enum viejo con CASCADE (esto recreará las funciones automáticamente)
DROP TYPE public.trust_level CASCADE;

-- Paso 5: Renombrar el nuevo enum
ALTER TYPE public.trust_level_new RENAME TO trust_level;

-- Paso 6: Re-establecer el default
ALTER TABLE public.profiles 
  ALTER COLUMN trust_level SET DEFAULT 'basic'::trust_level;

-- Paso 7: Comentar para documentación
COMMENT ON TYPE public.trust_level IS 'Niveles de confianza: basic (default) < confiable < prime';