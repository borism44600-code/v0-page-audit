-- Force recreation of property_service_pricing table to refresh PostgREST cache
-- This ensures the table is visible in the Supabase schema cache

-- First drop and recreate
DROP TABLE IF EXISTS property_service_pricing CASCADE;

CREATE TABLE property_service_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Breakfast pricing
  breakfast_enabled BOOLEAN DEFAULT false,
  breakfast_adult_price DECIMAL(10,2) DEFAULT 0,
  breakfast_child_price DECIMAL(10,2) DEFAULT 0,
  breakfast_child_max_age INTEGER DEFAULT 12,
  
  -- Lunch pricing  
  lunch_enabled BOOLEAN DEFAULT false,
  lunch_adult_price DECIMAL(10,2) DEFAULT 0,
  lunch_child_price DECIMAL(10,2) DEFAULT 0,
  
  -- Dinner pricing
  dinner_enabled BOOLEAN DEFAULT false,
  dinner_adult_price DECIMAL(10,2) DEFAULT 0,
  dinner_child_price DECIMAL(10,2) DEFAULT 0,
  
  -- Transfer pricing
  transfer_enabled BOOLEAN DEFAULT false,
  transfer_arrival_price DECIMAL(10,2) DEFAULT 0,
  transfer_departure_price DECIMAL(10,2) DEFAULT 0,
  transfer_roundtrip_price DECIMAL(10,2) DEFAULT 0,
  transfer_vehicle_capacity INTEGER DEFAULT 4,
  
  -- Extra bed pricing
  extra_bed_enabled BOOLEAN DEFAULT false,
  extra_bed_price DECIMAL(10,2) DEFAULT 0,
  crib_enabled BOOLEAN DEFAULT false,
  crib_price DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(property_id)
);

-- Create index for faster lookups
CREATE INDEX idx_property_service_pricing_property_id ON property_service_pricing(property_id);

-- Enable RLS
ALTER TABLE property_service_pricing ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on property_service_pricing"
  ON property_service_pricing FOR SELECT
  USING (true);

-- Allow authenticated users to manage
CREATE POLICY "Allow authenticated users to manage property_service_pricing"
  ON property_service_pricing FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';
