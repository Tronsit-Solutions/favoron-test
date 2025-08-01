-- Remove DPI field and add document type and number fields
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS dpi;

ALTER TABLE public.profiles 
ADD COLUMN document_type text,
ADD COLUMN document_number text;