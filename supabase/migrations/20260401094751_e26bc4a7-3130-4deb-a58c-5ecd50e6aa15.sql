UPDATE packages 
SET quote = jsonb_set(jsonb_set(quote, '{deliveryFee}', '45'), '{totalPrice}', '420')
WHERE id = '840cd3c1-7686-48a7-be39-248985922051';

UPDATE packages 
SET quote = jsonb_set(jsonb_set(quote, '{deliveryFee}', '45'), '{totalPrice}', '487.5')
WHERE id = 'f3f6b5ec-76d6-43dc-9567-4701657daeb1';