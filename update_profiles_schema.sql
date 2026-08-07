-- 1. ADD ALL MISSING COLUMNS TO PROFILES TABLE
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS preferred_categories text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS expected_hourly_rate numeric,
ADD COLUMN IF NOT EXISTS commitments_description text,
ADD COLUMN IF NOT EXISTS google_calendar_id text,
ADD COLUMN IF NOT EXISTS emergency_ready boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS emergency_radius_km integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS available_times text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS household_income numeric,
ADD COLUMN IF NOT EXISTS income_classification text,
ADD COLUMN IF NOT EXISTS transport text,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS experience text;


-- 2. CREATE AVATARS STORAGE BUCKET (For Profile Pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true, 
    2097152, 
    '{"image/jpeg","image/png","image/gif","image/webp"}'::text[]
)
ON CONFLICT (id) DO UPDATE SET public = true;


-- 3. ENABLE ROW LEVEL SECURITY FOR AVATARS BUCKET
-- Allow public read access to all avatars
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Avatar Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their own avatar
CREATE POLICY "Avatar Update Access"
ON storage.objects FOR UPDATE
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
