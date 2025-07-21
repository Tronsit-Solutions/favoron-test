-- Corregir el traveler_address del paquete problemático para incluir todos los campos del trip
UPDATE packages 
SET traveler_address = jsonb_build_object(
  'recipientName', 'Lucas Farias',
  'streetAddress', 'Calle de Julian Besteiro 26',
  'streetAddress2', '5A',
  'cityArea', 'Madrid',
  'postalCode', '28020',
  'contactNumber', '699459139',
  'hotelAirbnbName', '-',
  'accommodationType', 'casa'
)
WHERE id = '3bd9450e-c3d9-48f3-b779-90bc052cab21';