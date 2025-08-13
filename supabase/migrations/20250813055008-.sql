-- Garantizar un único usuario por correo (insensible a mayúsculas y espacios)
-- 1) Verificar duplicados antes de crear el índice
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (
      SELECT lower(trim(email)) AS e, COUNT(*)
      FROM public.profiles
      WHERE email IS NOT NULL
      GROUP BY 1
      HAVING COUNT(*) > 1
    ) dup
  ) THEN
    RAISE EXCEPTION 'No se puede crear índice único: existen correos duplicados (ignorando mayúsculas/espacios). Resuélvelos antes de continuar.';
  END IF;
END;
$$;

-- 2) Crear índice único parcial sobre la expresión normalizada
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_ci
ON public.profiles ((lower(trim(email))))
WHERE email IS NOT NULL;