INSERT INTO trips (
  user_id, from_city, from_country, to_city, to_country,
  first_day_packages, last_day_packages, arrival_date, delivery_date,
  package_receiving_address, available_space, status
) VALUES (
  '73c1d68d-2afd-4e5f-b9fa-c812939c5dc2',
  'Madrid', 'España',
  'Guatemala City', 'Guatemala',
  '2026-04-10 12:00:00+00', '2026-05-01 12:00:00+00',
  '2026-05-03 12:00:00+00', '2026-05-04 12:00:00+00',
  '{"accommodationType":"casa","cityArea":"Madrid","contactNumber":"+34610614976","hotelAirbnbName":"","postalCode":"28006","recipientName":"Rodrigo Zibara","streetAddress":"Calle del General Pardiñas 108","streetAddress2":"3D"}',
  10,
  'pending_approval'
);