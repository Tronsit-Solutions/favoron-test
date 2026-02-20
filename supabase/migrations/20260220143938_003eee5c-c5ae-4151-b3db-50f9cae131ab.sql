UPDATE packages 
SET status = 'completed'
WHERE status = 'archived_by_shopper' 
  AND label_number IS NOT NULL;