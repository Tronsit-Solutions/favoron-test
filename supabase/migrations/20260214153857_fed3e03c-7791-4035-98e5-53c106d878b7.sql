UPDATE packages 
SET products_data = jsonb_set(
  products_data, 
  '{1,itemLink}', 
  '"https://www.amazon.com/-/es/gp/product/B0D9YJWVZG/ref=ox_sc_act_title_2?smid=A15WS6LMRQ88GU&psc=1"'
)
WHERE id = 'fa770514-d585-46be-882d-04b5e70c404b';