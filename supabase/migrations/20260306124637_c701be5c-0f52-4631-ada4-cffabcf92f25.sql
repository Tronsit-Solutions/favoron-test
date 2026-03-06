
-- Create traveler_surveys table
CREATE TABLE public.traveler_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  would_recommend boolean NOT NULL,
  process_difficulty text NOT NULL,
  would_register_again text NOT NULL,
  tip_satisfaction text NOT NULL,
  review_text text,
  consent_to_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(traveler_id, trip_id)
);

ALTER TABLE public.traveler_surveys ENABLE ROW LEVEL SECURITY;

-- Travelers can insert own survey
CREATE POLICY "Travelers can submit own survey"
  ON public.traveler_surveys FOR INSERT
  WITH CHECK (auth.uid() = traveler_id);

-- Travelers can view own surveys
CREATE POLICY "Travelers can view own surveys"
  ON public.traveler_surveys FOR SELECT
  USING (auth.uid() = traveler_id);

-- Admins can view all
CREATE POLICY "Admins can view all traveler surveys"
  ON public.traveler_surveys FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Public can view consented
CREATE POLICY "Public can view consented traveler surveys"
  ON public.traveler_surveys FOR SELECT
  USING (consent_to_publish = true);

-- Add traveler_feedback_completed to trips
ALTER TABLE public.trips ADD COLUMN traveler_feedback_completed boolean NOT NULL DEFAULT false;
