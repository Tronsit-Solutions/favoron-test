-- This is a data update, using a DO block to update the quote JSON
UPDATE public.packages 
SET quote = jsonb_set(
  jsonb_set(
    quote::jsonb,
    '{referralCreditApplied}',
    'false'::jsonb
  ),
  '{referralCreditAmount}',
  '0'::jsonb
),
referral_credit_applied = null
WHERE id = '92c2b405-f6f2-45a8-a1dd-e41c0facdd00';