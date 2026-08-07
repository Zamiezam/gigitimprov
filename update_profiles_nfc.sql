-- Run this in your Supabase SQL editor to support physical NFC cards

-- 1. Add nfc_uid column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nfc_uid text UNIQUE;

-- 2. Add an index for faster lookups when scanning cards
CREATE INDEX IF NOT EXISTS profiles_nfc_uid_idx ON public.profiles(nfc_uid);
