-- ============================================================================
-- Migration: Add explicit status column to properties table
-- ============================================================================
-- 
-- This migration replaces the boolean `is_active` with an explicit `status` column
-- that properly supports: draft, published, archived
--
-- Migration Strategy:
-- 1. Add new `status` column with default 'draft'
-- 2. Migrate existing data: is_active=true -> 'published', is_active=false -> 'draft'
-- 3. Keep is_active column for backward compatibility during transition
-- 4. Update RLS policies to use status instead of is_active
-- 5. Add index for performance
--
-- ROLLBACK: 
-- ALTER TABLE properties DROP COLUMN IF EXISTS status;
-- ============================================================================

-- Step 1: Add status column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Step 2: Migrate existing data based on is_active
UPDATE public.properties 
SET status = CASE 
  WHEN is_active = true THEN 'published'
  ELSE 'draft'
END
WHERE status IS NULL OR status = 'draft';

-- Step 3: Add check constraint to ensure valid status values
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE public.properties 
ADD CONSTRAINT properties_status_check 
CHECK (status IN ('draft', 'published', 'archived'));

-- Step 4: Create index for status queries
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- Step 5: Update RLS policy for public read access to use status
-- First drop the existing policy if it exists
DROP POLICY IF EXISTS "Public read access" ON public.properties;

-- Create new policy using status column
CREATE POLICY "Public read access" ON public.properties 
FOR SELECT 
USING (status = 'published');

-- Step 6: Sync trigger to keep is_active in sync with status (for backward compatibility)
-- This ensures any legacy code still reading is_active gets correct values
CREATE OR REPLACE FUNCTION sync_property_is_active()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes, update is_active accordingly
  IF NEW.status = 'published' THEN
    NEW.is_active := true;
  ELSE
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_property_status_trigger ON public.properties;

CREATE TRIGGER sync_property_status_trigger
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION sync_property_is_active();

-- ============================================================================
-- Verification queries (run manually to verify migration success):
-- ============================================================================
-- SELECT status, is_active, COUNT(*) FROM properties GROUP BY status, is_active;
-- SELECT * FROM properties WHERE status = 'published' AND is_active = false; -- Should be empty
-- SELECT * FROM properties WHERE status != 'published' AND is_active = true; -- Should be empty
