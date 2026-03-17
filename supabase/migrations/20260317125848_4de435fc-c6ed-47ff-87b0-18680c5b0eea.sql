
ALTER TABLE public.package_assignments ALTER COLUMN status SET DEFAULT 'bid_pending';

UPDATE public.package_assignments SET status = 'bid_submitted' WHERE status = 'quote_sent';
UPDATE public.package_assignments SET status = 'bid_lost' WHERE status = 'rejected';
UPDATE public.package_assignments SET status = 'bid_pending' WHERE status = 'pending';
