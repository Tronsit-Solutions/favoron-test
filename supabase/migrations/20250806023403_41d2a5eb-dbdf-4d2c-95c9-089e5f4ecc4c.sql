-- Primero, eliminar las políticas existentes que causan recursión infinita
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Crear función security definer para verificar roles sin recursión
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$function$;

-- Crear nuevas políticas que no causen recursión
CREATE POLICY "Users can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can insert their own role only" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'user'::user_role);