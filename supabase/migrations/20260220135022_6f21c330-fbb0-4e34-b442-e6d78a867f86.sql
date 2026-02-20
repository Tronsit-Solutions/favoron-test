
-- Tabla calificaciones al viajero
CREATE TABLE public.traveler_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL UNIQUE REFERENCES public.packages(id),
  traveler_id uuid NOT NULL REFERENCES public.profiles(id),
  shopper_id uuid NOT NULL REFERENCES public.profiles(id),
  trip_id uuid NOT NULL REFERENCES public.trips(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  product_condition text NOT NULL CHECK (product_condition IN ('bad', 'fair', 'good')),
  traveler_confirmed boolean NOT NULL DEFAULT false,
  delivered_on_time boolean NOT NULL DEFAULT false,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.traveler_ratings ENABLE ROW LEVEL SECURITY;

-- Tabla reviews de la plataforma
CREATE TABLE public.platform_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL UNIQUE REFERENCES public.packages(id),
  shopper_id uuid NOT NULL REFERENCES public.profiles(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  would_use_again text NOT NULL CHECK (would_use_again IN ('yes', 'no', 'maybe')),
  would_recommend boolean NOT NULL,
  process_was_clear boolean NOT NULL,
  communication_quality text NOT NULL CHECK (communication_quality IN ('good', 'fair', 'bad')),
  review_text text,
  consent_to_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- Columnas en profiles para stats del viajero
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS traveler_avg_rating numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS traveler_total_ratings integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS traveler_ontime_rate numeric;

-- Trigger para recalcular stats del viajero
CREATE OR REPLACE FUNCTION public.update_traveler_rating_stats()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles SET
    traveler_avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.traveler_ratings WHERE traveler_id = NEW.traveler_id
    ),
    traveler_total_ratings = (
      SELECT COUNT(*)::integer
      FROM public.traveler_ratings WHERE traveler_id = NEW.traveler_id
    ),
    traveler_ontime_rate = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE delivered_on_time = true)::numeric
         / NULLIF(COUNT(*), 0)) * 100, 1
      )
      FROM public.traveler_ratings WHERE traveler_id = NEW.traveler_id
    ),
    updated_at = now()
  WHERE id = NEW.traveler_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_traveler_rating_stats
  AFTER INSERT ON public.traveler_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_traveler_rating_stats();

-- RLS traveler_ratings
CREATE POLICY "Shoppers can rate their completed packages"
  ON public.traveler_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = shopper_id
    AND EXISTS (
      SELECT 1 FROM public.packages
      WHERE id = traveler_ratings.package_id AND user_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Shoppers can view own ratings"
  ON public.traveler_ratings FOR SELECT
  USING (auth.uid() = shopper_id);

CREATE POLICY "Admins can view all ratings"
  ON public.traveler_ratings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS platform_reviews
CREATE POLICY "Shoppers can review after rating traveler"
  ON public.platform_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = shopper_id
    AND EXISTS (
      SELECT 1 FROM public.traveler_ratings tr
      WHERE tr.package_id = platform_reviews.package_id
        AND tr.shopper_id = auth.uid()
    )
  );

CREATE POLICY "Shoppers can view own reviews"
  ON public.platform_reviews FOR SELECT
  USING (auth.uid() = shopper_id);

CREATE POLICY "Admins can view all reviews"
  ON public.platform_reviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public can view consented reviews"
  ON public.platform_reviews FOR SELECT
  USING (consent_to_publish = true);
