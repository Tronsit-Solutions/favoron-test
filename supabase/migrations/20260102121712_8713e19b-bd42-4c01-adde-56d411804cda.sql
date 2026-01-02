-- Create delivery_points table for international delivery locations
CREATE TABLE public.delivery_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  address_line_1 TEXT,
  address_line_2 TEXT,
  postal_code TEXT,
  state_province TEXT,
  phone_number TEXT,
  email TEXT,
  schedule TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_points ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view active delivery points
CREATE POLICY "Authenticated can view active delivery points"
  ON public.delivery_points FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins can manage all delivery points
CREATE POLICY "Admins can manage delivery points"
  ON public.delivery_points FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

-- Add to_country and delivery_point_id columns to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS to_country TEXT DEFAULT 'Guatemala';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS delivery_point_id UUID REFERENCES public.delivery_points(id);

-- Create trigger for updated_at on delivery_points
CREATE OR REPLACE FUNCTION public.update_delivery_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_delivery_points_updated_at
  BEFORE UPDATE ON public.delivery_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_delivery_points_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_delivery_points_city_country ON public.delivery_points(city, country);
CREATE INDEX idx_delivery_points_active ON public.delivery_points(is_active) WHERE is_active = true;