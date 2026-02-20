UPDATE packages 
SET feedback_completed = false 
WHERE user_id = '5e3c944e-9130-4ea7-8165-b8ec9d5abf6f' 
  AND status = 'completed' 
  AND feedback_completed = true;