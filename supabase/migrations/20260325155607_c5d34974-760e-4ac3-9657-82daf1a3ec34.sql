ALTER TABLE public.customer_experience_calls 
  DROP CONSTRAINT customer_experience_calls_call_status_check;

ALTER TABLE public.customer_experience_calls 
  ADD CONSTRAINT customer_experience_calls_call_status_check 
  CHECK (call_status = ANY (ARRAY['pending', 'contacted', 'no_answer', 'completed', 'scheduled']));