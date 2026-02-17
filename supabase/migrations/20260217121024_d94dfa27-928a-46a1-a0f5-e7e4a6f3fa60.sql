-- Remove the silent 'guatemala' default from package_destination_country
ALTER TABLE public.packages ALTER COLUMN package_destination_country DROP DEFAULT;

-- Fix known incorrect packages: cities clearly in Spain but country set to 'guatemala'
UPDATE public.packages SET package_destination_country = 'España'
WHERE package_destination_country = 'guatemala'
  AND (
    package_destination ILIKE '%Madrid%'
    OR package_destination ILIKE '%Barcelona%'
    OR package_destination ILIKE '%Sevilla%'
    OR package_destination ILIKE '%Málaga%'
    OR package_destination ILIKE '%Bilbao%'
    OR package_destination ILIKE '%Valencia%'
  );

-- Fix Paris case
UPDATE public.packages SET package_destination_country = 'Francia'
WHERE package_destination_country = 'guatemala'
  AND package_destination ILIKE '%Paris%';