-- Actualizar el traveler_address del paquete de Nicolas con la información del viaje asociado
UPDATE packages 
SET traveler_address = (
  SELECT trips.package_receiving_address 
  FROM trips 
  WHERE trips.id = packages.matched_trip_id
),
matched_trip_dates = (
  SELECT jsonb_build_object(
    'first_day_packages', trips.first_day_packages,
    'last_day_packages', trips.last_day_packages,  
    'delivery_date', trips.delivery_date,
    'arrival_date', trips.arrival_date
  )
  FROM trips 
  WHERE trips.id = packages.matched_trip_id
)
WHERE id = '371a7d98-50af-44e6-935c-3f0943d47679' -- Paquete de Nicolas
  AND traveler_address IS NULL 
  AND matched_trip_id IS NOT NULL;