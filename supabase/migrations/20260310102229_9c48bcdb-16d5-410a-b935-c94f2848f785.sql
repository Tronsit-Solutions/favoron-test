-- Create job_applications table
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  interest_type text NOT NULL DEFAULT 'talent',
  message text,
  resume_url text,
  resume_filename text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit job applications"
  ON public.job_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can SELECT
CREATE POLICY "Admins can view all job applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ));

-- Only admins can UPDATE
CREATE POLICY "Admins can update job applications"
  ON public.job_applications FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ));

-- Only admins can DELETE
CREATE POLICY "Admins can delete job applications"
  ON public.job_applications FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ));

-- Create storage bucket for resumes (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-applications', 'job-applications', false);

-- Anyone can upload to job-applications bucket
CREATE POLICY "Anyone can upload job application files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'job-applications');

-- Only admins can read job application files
CREATE POLICY "Admins can read job application files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'job-applications'
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
    )
  );

-- Only admins can delete job application files
CREATE POLICY "Admins can delete job application files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'job-applications'
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
    )
  );