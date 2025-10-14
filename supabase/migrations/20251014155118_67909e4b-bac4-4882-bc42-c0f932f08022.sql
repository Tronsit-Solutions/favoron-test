-- Add label_number column to packages table
ALTER TABLE public.packages 
ADD COLUMN label_number INTEGER;

-- Add index for faster lookups
CREATE INDEX idx_packages_label_number ON public.packages(label_number);

-- Add comment for documentation
COMMENT ON COLUMN public.packages.label_number IS 'Unique label number assigned when package is first printed for last-mile delivery. Persists across multiple label downloads.';