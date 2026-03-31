
-- Restore package to quote_sent status
UPDATE packages 
SET status = 'quote_sent', 
    matched_trip_id = '278dbf7f-1df8-43e6-b446-00ec9b6c1a3e', 
    quote_expires_at = now() + interval '48 hours', 
    updated_at = now() 
WHERE id = 'b4df2001-861b-423d-a2b8-0fe94adb6d7c';

-- Restore assignment to bid_submitted status
UPDATE package_assignments 
SET status = 'bid_submitted', 
    expires_at = now() + interval '48 hours', 
    quote_expires_at = now() + interval '48 hours', 
    updated_at = now() 
WHERE id = 'a539d64e-cb20-41e9-8b9a-ff53ebd4615d';
