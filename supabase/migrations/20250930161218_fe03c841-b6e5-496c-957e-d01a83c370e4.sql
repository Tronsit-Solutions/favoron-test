-- Create label_counter table to track historical label generation
CREATE TABLE IF NOT EXISTS public.label_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial counter record
INSERT INTO public.label_counter (current_count)
SELECT 195 -- Starting from current package count
WHERE NOT EXISTS (SELECT 1 FROM public.label_counter);

-- Enable RLS
ALTER TABLE public.label_counter ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view the counter
CREATE POLICY "Anyone authenticated can view label counter"
  ON public.label_counter
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can update the counter
CREATE POLICY "Only admins can update label counter"
  ON public.label_counter
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to increment and get next label number
CREATE OR REPLACE FUNCTION public.get_next_label_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Update and return the new number atomically
  UPDATE public.label_counter
  SET 
    current_count = current_count + 1,
    updated_at = NOW()
  RETURNING current_count INTO next_number;
  
  RETURN next_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_next_label_number() TO authenticated;