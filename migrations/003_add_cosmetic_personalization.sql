-- Migration: Add cosmetic personalization fields to profiles table
-- Phase 3: Personalization Engine
-- Date: 2026-01-26

-- Add cosmetic personalization columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS skin_type TEXT DEFAULT 'normal' CHECK (skin_type IN ('normal', 'dry', 'oily', 'combination', 'sensitive')),
ADD COLUMN IF NOT EXISTS skin_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS cosmetic_allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_breastfeeding BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN profiles.skin_type IS 'User skin type for cosmetic personalization';
COMMENT ON COLUMN profiles.skin_conditions IS 'Array of skin conditions: acne_prone, eczema, rosacea, aging, dull';
COMMENT ON COLUMN profiles.cosmetic_allergens IS 'Array of known cosmetic allergens (EU fragrance allergens)';
COMMENT ON COLUMN profiles.is_pregnant IS 'Pregnancy status for safety warnings';
COMMENT ON COLUMN profiles.is_breastfeeding IS 'Breastfeeding status for safety warnings';

-- Create index for faster lookups on skin_type (commonly filtered)
CREATE INDEX IF NOT EXISTS idx_profiles_skin_type ON profiles(skin_type);
