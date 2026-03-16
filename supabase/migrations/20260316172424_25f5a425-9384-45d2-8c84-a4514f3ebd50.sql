
-- Create package_assignments junction table for multi-traveler assignment
CREATE TABLE public.package_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  admin_assigned_tip numeric NULL,
  quote jsonb NULL,
  quote_expires_at timestamp with time zone NULL,
  traveler_address jsonb NULL,
  matched_trip_dates jsonb NULL,
  products_data jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(package_id, trip_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_package_assignments_package_id ON public.package_assignments(package_id);
CREATE INDEX idx_package_assignments_trip_id ON public.package_assignments(trip_id);
CREATE INDEX idx_package_assignments_status ON public.package_assignments(status);

-- Enable RLS
ALTER TABLE public.package_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can do everything
CREATE POLICY "Admins can manage all assignments"
ON public.package_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- RLS: Travelers can view assignments for their trips
CREATE POLICY "Travelers can view their assignments"
ON public.package_assignments
FOR SELECT
USING (
  trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
);

-- RLS: Travelers can update their own assignments (accept/reject)
CREATE POLICY "Travelers can update their assignments"
ON public.package_assignments
FOR UPDATE
USING (
  trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
)
WITH CHECK (
  trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
);

-- RLS: Shoppers can view assignments for their packages
CREATE POLICY "Shoppers can view assignments for their packages"
ON public.package_assignments
FOR SELECT
USING (
  package_id IN (SELECT id FROM public.packages WHERE user_id = auth.uid())
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_package_assignments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_package_assignments_updated_at
  BEFORE UPDATE ON public.package_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_package_assignments_updated_at();
