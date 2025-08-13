-- Actualizar el paquete Nike Jordan con la información de envío
UPDATE packages 
SET traveler_address = jsonb_build_object(
      'recipientName', 'Lucas Farias',
      'streetAddress', 'Calle de San Frutos 3',
      'streetAddress2', '3B',
      'cityArea', 'Segovia',
      'postalCode', '40001',
      'contactNumber', '+34699591457',
      'hotelAirbnbName', '-',
      'accommodationType', 'casa'
    ),
    matched_trip_dates = jsonb_build_object(
      'first_day_packages', '2025-08-13T22:00:00+00:00',
      'last_day_packages', '2025-09-06T22:00:00+00:00',
      'delivery_date', '2025-09-14T22:00:00+00:00',
      'arrival_date', '2025-09-09T22:00:00+00:00'
    )
WHERE id = 'adf152a3-20e8-416d-b678-1baf127c17b0';