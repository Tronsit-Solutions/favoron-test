-- Agregar campos de información bancaria a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN bank_account_holder TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN bank_account_type TEXT,
ADD COLUMN bank_account_number TEXT,
ADD COLUMN bank_swift_code TEXT;