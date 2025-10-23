-- Extend active quote expirations from 24h to 48h
-- This migration updates all packages with status 'quote_sent' that have not expired yet
-- to extend their expiration time to 48 hours from when the quote was sent

UPDATE packages
SET quote_expires_at = updated_at + INTERVAL '48 hours'
WHERE status = 'quote_sent'
  AND quote_expires_at IS NOT NULL
  AND quote_expires_at > NOW();