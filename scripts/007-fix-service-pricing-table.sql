-- ============================================
-- RECREATE property_service_pricing WITH CORRECT COLUMN NAMES
-- Fixes column naming to match TypeScript code
-- ============================================

-- Drop and recreate the table with correct column names
DROP TABLE IF EXISTS property_service_pricing CASCADE;

CREATE TABLE property_service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Breakfast pricing (using TypeScript naming convention)
  breakfast_available BOOLEAN DEFAULT false,
  breakfast_adult_price NUMERIC(10,2) DEFAULT 15.00,
  breakfast_child_price NUMERIC(10,2) DEFAULT 8.00,
  breakfast_child_age_limit INTEGER DEFAULT 12,
  
  -- Lunch pricing
  lunch_available BOOLEAN DEFAULT false,
  lunch_adult_price NUMERIC(10,2) DEFAULT 25.00,
  lunch_child_price NUMERIC(10,2) DEFAULT 15.00,
  
  -- Dinner pricing
  dinner_available BOOLEAN DEFAULT false,
  dinner_adult_price NUMERIC(10,2) DEFAULT 40.00,
  dinner_child_price NUMERIC(10,2) DEFAULT 20.00,
  
  -- Airport Transfer pricing
  transfer_available BOOLEAN DEFAULT false,
  transfer_arrival_price NUMERIC(10,2) DEFAULT 25.00,
  transfer_departure_price NUMERIC(10,2) DEFAULT 25.00,
  transfer_roundtrip_price NUMERIC(10,2) DEFAULT 45.00,
  transfer_max_passengers INTEGER DEFAULT 6,
  transfer_vehicle_type TEXT DEFAULT 'Standard',
  
  -- Extra services
  extra_bed_available BOOLEAN DEFAULT false,
  extra_bed_price NUMERIC(10,2) DEFAULT 30.00,
  crib_available BOOLEAN DEFAULT false,
  crib_price NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(property_id)
);

-- Enable RLS
ALTER TABLE property_service_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admin full access for property_service_pricing" ON property_service_pricing;
DROP POLICY IF EXISTS "Public read access for property_service_pricing" ON property_service_pricing;

CREATE POLICY "Admin full access for property_service_pricing" ON property_service_pricing
  FOR ALL USING (true);

CREATE POLICY "Public read access for property_service_pricing" ON property_service_pricing
  FOR SELECT USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_service_pricing_property_id 
ON property_service_pricing(property_id);

SELECT 'property_service_pricing table recreated with correct column names!' as result;
