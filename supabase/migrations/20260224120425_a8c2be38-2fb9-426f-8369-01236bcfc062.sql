
CREATE TABLE public.incident_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.incident_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage incident costs"
ON public.incident_costs
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
));
