-- Create prime_memberships table
CREATE TABLE public.prime_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 200,
  status text NOT NULL DEFAULT 'pending',
  receipt_url text,
  receipt_filename text,
  bank_name text NOT NULL,
  bank_account_holder text NOT NULL,
  bank_account_number text NOT NULL,
  bank_account_type text NOT NULL DEFAULT 'monetary',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  expires_at timestamptz,
  approved_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.prime_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for prime_memberships
CREATE POLICY "Users can create their own prime memberships"
ON public.prime_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own prime memberships"
ON public.prime_memberships
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all prime memberships"
ON public.prime_memberships
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE POLICY "Admins can update all prime memberships"
ON public.prime_memberships
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Trigger to automatically activate Prime membership when approved
CREATE OR REPLACE FUNCTION public.activate_prime_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only activate when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Set approved_at timestamp
    NEW.approved_at = NOW();
    
    -- Set expiration to 1 year from now
    NEW.expires_at = NOW() + INTERVAL '1 year';
    
    -- Update user profile to Prime
    UPDATE public.profiles 
    SET 
      trust_level = 'prime',
      prime_expires_at = NEW.expires_at,
      updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Create notification for user
    PERFORM create_notification(
      NEW.user_id,
      '🎉 ¡Membresía Prime activada!',
      'Tu membresía Prime ha sido aprobada y activada. Disfruta de todos los beneficios durante 1 año.',
      'prime',
      'high',
      NULL,
      jsonb_build_object(
        'prime_membership_id', NEW.id,
        'expires_at', NEW.expires_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER activate_prime_membership_trigger
BEFORE UPDATE ON public.prime_memberships
FOR EACH ROW
EXECUTE FUNCTION public.activate_prime_on_approval();

-- Update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_prime_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_prime_memberships_updated_at
BEFORE UPDATE ON public.prime_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_prime_memberships_updated_at();