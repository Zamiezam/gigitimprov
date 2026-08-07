-- 1. ADD resume_data JSONB COLUMN TO profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS resume_data jsonb DEFAULT '{}'::jsonb;

-- 2. CREATE resumes BUCKET FOR STORING PDF FILES
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- 3. BUCKET ACCESS POLICIES
-- Drop existing policies if they exist to prevent errors
DROP POLICY IF EXISTS "Resume PDFs are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a resume." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their resume." ON storage.objects;

-- Allow public read access to resumes
CREATE POLICY "Resume PDFs are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'resumes' );

-- Allow authenticated users to upload their resume
CREATE POLICY "Anyone can upload a resume."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'resumes' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their own resume
CREATE POLICY "Anyone can update their resume."
ON storage.objects FOR UPDATE
WITH CHECK ( bucket_id = 'resumes' AND auth.role() = 'authenticated' );
