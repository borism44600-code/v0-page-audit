-- ============================================================================
-- MEDIA LIBRARY TABLES
-- Real media management for properties
-- ============================================================================

-- Drop existing tables if they have wrong schema
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS media_folders CASCADE;

-- Media items table (metadata stored in Supabase, files in Vercel Blob)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'general',
  alt_text TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media folders table
CREATE TABLE media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Property images junction table
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, media_id)
);

-- Insert default folders
INSERT INTO media_folders (name, slug, description, sort_order) VALUES
  ('All Files', 'all', 'All uploaded files', 0),
  ('Properties', 'properties', 'Property photos and images', 1),
  ('Amenities', 'amenities', 'Amenity and feature images', 2),
  ('Experiences', 'experiences', 'Experience and service images', 3),
  ('Activities', 'activities', 'Activity and excursion images', 4);

-- Indexes
CREATE INDEX idx_media_folder ON media(folder);
CREATE INDEX idx_media_created_at ON media(created_at DESC);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

-- RLS Policies
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media is viewable by everyone" ON media FOR SELECT USING (true);
CREATE POLICY "Media folders are viewable by everyone" ON media_folders FOR SELECT USING (true);
CREATE POLICY "Property images are viewable by everyone" ON property_images FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage media" ON media FOR ALL USING (true);
CREATE POLICY "Authenticated users can manage property images" ON property_images FOR ALL USING (true);
