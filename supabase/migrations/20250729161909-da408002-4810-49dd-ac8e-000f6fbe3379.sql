-- Agregar columna country_code a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN country_code TEXT DEFAULT '+502';

-- Actualizar datos existentes para separar código de país y número
-- Asumiendo que los números existentes tienen formato +502XXXXXXXX
UPDATE public.profiles 
SET 
  country_code = CASE 
    WHEN phone_number LIKE '+502%' THEN '+502'
    WHEN phone_number LIKE '+1%' THEN '+1'
    WHEN phone_number LIKE '+34%' THEN '+34'
    WHEN phone_number LIKE '+52%' THEN '+52'
    ELSE '+502'  -- Default para Guatemala
  END,
  phone_number = CASE 
    WHEN phone_number LIKE '+502%' THEN SUBSTRING(phone_number FROM 5)
    WHEN phone_number LIKE '+1%' THEN SUBSTRING(phone_number FROM 3)
    WHEN phone_number LIKE '+34%' THEN SUBSTRING(phone_number FROM 4)
    WHEN phone_number LIKE '+52%' THEN SUBSTRING(phone_number FROM 4)
    ELSE phone_number  -- Mantener como está si no tiene código
  END
WHERE phone_number IS NOT NULL AND phone_number != '';

-- Agregar constraint para asegurar que country_code tenga formato válido
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_country_code 
CHECK (country_code ~ '^\+[1-9][0-9]{0,3}$');