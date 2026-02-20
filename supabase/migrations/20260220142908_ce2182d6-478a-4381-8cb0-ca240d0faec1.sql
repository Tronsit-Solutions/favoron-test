
ALTER TABLE packages ADD COLUMN feedback_completed boolean NOT NULL DEFAULT false;

-- Mark all existing completed packages
UPDATE packages SET feedback_completed = true WHERE status = 'completed';

-- Relax platform_reviews INSERT policy
DROP POLICY "Shoppers can review after rating traveler" ON platform_reviews;

CREATE POLICY "Shoppers can review completed packages"
  ON platform_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = shopper_id
    AND EXISTS (
      SELECT 1 FROM packages
      WHERE packages.id = platform_reviews.package_id
      AND packages.user_id = auth.uid()
      AND packages.status = 'completed'
    )
  );
