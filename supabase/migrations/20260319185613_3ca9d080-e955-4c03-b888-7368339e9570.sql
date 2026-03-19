UPDATE packages 
SET status = 'approved', 
    admin_assigned_tip = NULL,
    updated_at = now()
WHERE id = 'a78db663-8380-45f2-838b-78b182e7080b';