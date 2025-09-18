-- Rename table and add company information fields
ALTER TABLE public.favoron_bank_accounts RENAME TO favoron_company_information;

-- Add new company and address columns
ALTER TABLE public.favoron_company_information 
ADD COLUMN company_name text,
ADD COLUMN address_line_1 text,
ADD COLUMN address_line_2 text,
ADD COLUMN city text,
ADD COLUMN state_department text,
ADD COLUMN postal_code text,
ADD COLUMN country text DEFAULT 'Guatemala',
ADD COLUMN phone_number text,
ADD COLUMN email text,
ADD COLUMN website text;

-- Update the trigger to use the new table name
DROP TRIGGER IF EXISTS update_favoron_bank_accounts_updated_at ON public.favoron_company_information;
CREATE TRIGGER update_favoron_company_information_updated_at
  BEFORE UPDATE ON public.favoron_company_information
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favoron_bank_accounts_updated_at();

-- Update RLS policies to use new table name
DROP POLICY IF EXISTS "Only admins can view bank accounts" ON public.favoron_company_information;
DROP POLICY IF EXISTS "Only admins can insert bank accounts" ON public.favoron_company_information;
DROP POLICY IF EXISTS "Only admins can update bank accounts" ON public.favoron_company_information;
DROP POLICY IF EXISTS "Only admins can delete bank accounts" ON public.favoron_company_information;

CREATE POLICY "Only admins can view company information" 
ON public.favoron_company_information 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::user_role))));

CREATE POLICY "Only admins can insert company information" 
ON public.favoron_company_information 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::user_role))));

CREATE POLICY "Only admins can update company information" 
ON public.favoron_company_information 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::user_role))));

CREATE POLICY "Only admins can delete company information" 
ON public.favoron_company_information 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::user_role))));