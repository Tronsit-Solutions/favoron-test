UPDATE profiles 
SET ui_preferences = jsonb_set(
  COALESCE(ui_preferences, '{}'::jsonb), 
  '{skip_trip_intro}', 
  'false'::jsonb
)
WHERE id = '5e3c944e-9130-4ea7-8165-b8ec9d5abf6f';