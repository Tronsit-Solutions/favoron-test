
-- Step 1: Update existing package to keep only first 2 products
UPDATE packages
SET 
  products_data = '[
    {"additionalNotes":"Confirmar que si sean los precios correctos","estimatedPrice":"135","itemDescription":"Mochila negra","itemLink":"https://www.nike.com/us/es/t/mochila-collectors-31-5-l-jordan-sRl0Xc/MA0944-023","needsOriginalPackaging":true,"quantity":"1","requestType":"online"},
    {"additionalNotes":"Confirmar que si sean los precios correctos","estimatedPrice":"175","itemDescription":"Mochila de cuero","itemLink":"https://www.nike.com/us/es/t/mochila-31l-jordan-fly-elite-vFR64l/J1012174-053","needsOriginalPackaging":true,"quantity":"1","requestType":"online"}
  ]'::jsonb,
  estimated_price = 310,
  item_description = 'Pedido de 2 productos: Mochila negra, Mochila de cuero',
  updated_at = now()
WHERE id = '8dae2158-9f91-4536-b98c-70f57dc58091';

-- Step 2: Insert new package with products 3-4
INSERT INTO packages (
  user_id, purchase_origin, package_destination, package_destination_country,
  delivery_method, delivery_deadline, status, payment_method,
  confirmed_delivery_address, additional_notes, estimated_price,
  item_description, products_data
) VALUES (
  '1aa11049-b816-4dc7-b784-9eb064def192',
  'Estados Unidos',
  'Quetzaltenango',
  'Guatemala',
  'delivery',
  '2026-04-01 06:00:00+00',
  'approved',
  'bank_transfer',
  '{"cityArea":"San juan Ostuncalco Quetzaltenango ","contactNumber":"52616496","hotelAirbnbName":"","streetAddress":"2da av 5-35 zona 2 san juan Ostuncalco Quetzaltenango "}'::jsonb,
  'Confirmar que si sean los precios correctos',
  171,
  'Pedido de 2 productos: Mochila roja, Guantes talla M',
  '[
    {"additionalNotes":"Confirmar que si sean los precios correctos","estimatedPrice":"135","itemDescription":"Mochila roja","itemLink":"https://www.nike.com/us/es/t/mochila-collectors-31-5-l-jordan-2ukayLD1/MA0944-R78","needsOriginalPackaging":true,"quantity":"1","requestType":"online"},
    {"additionalNotes":"Confirmar que si sean los precios correctos","estimatedPrice":"36","itemDescription":"Guantes talla M","itemLink":"https://www.nike.com/us/es/t/jordan-tour-guante-de-golf-izquierdo-de-tipo-cadete-DbC3T1/J1008925-017","needsOriginalPackaging":true,"quantity":"1","requestType":"online"}
  ]'::jsonb
);
