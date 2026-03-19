
CREATE TABLE public.customer_experience_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('shopper', 'traveler')),
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER,
  notes TEXT,
  call_status TEXT NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending', 'contacted', 'no_answer', 'completed')),
  call_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(package_id, user_type)
);

-- Validation trigger for rating
CREATE OR REPLACE FUNCTION validate_cx_call_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_cx_call_rating
  BEFORE INSERT OR UPDATE ON public.customer_experience_calls
  FOR EACH ROW EXECUTE FUNCTION validate_cx_call_rating();

ALTER TABLE public.customer_experience_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cx calls"
  ON public.customer_experience_calls FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
