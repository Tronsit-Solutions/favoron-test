-- One-time data cleanup: clear stale quote/traveler_address/matched_trip_dates
-- These were written by legacy code before the unified assignment flow was fixed
UPDATE packages
SET quote = NULL, traveler_address = NULL, matched_trip_dates = NULL
WHERE id = '5c90d55b-2e35-44d1-bb59-fda5aeab277c'
  AND status = 'matched'
  AND matched_trip_id IS NULL;