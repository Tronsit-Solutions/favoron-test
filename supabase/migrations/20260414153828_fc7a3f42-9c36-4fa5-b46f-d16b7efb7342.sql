ALTER TABLE customer_experience_calls 
DROP CONSTRAINT customer_experience_calls_user_type_check;

ALTER TABLE customer_experience_calls 
ADD CONSTRAINT customer_experience_calls_user_type_check 
CHECK (user_type = ANY (ARRAY['shopper','traveler','cancelled']));