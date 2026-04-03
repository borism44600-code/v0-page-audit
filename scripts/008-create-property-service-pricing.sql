-- Create property_service_pricing table for per-property service pricing
-- This table stores breakfast, meal, transfer, and extra bed pricing per property

CREATE TABLE IF NOT EXISTS property_service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Breakfast pricing
  breakfast_adult_price NUMERIC(10,2) DEFAULT 0,
  breakfast_child_price NUMERIC(10,2) DEFAULT 0,
  breakfast_child_age_limit INTEGER DEFAULT 12,
  breakfast_enabled BOOLEAN DEFAULT false,
  
  -- Lunch pricing
  lunch_adult_price NUMERIC(10,2) DEFAULT 0,
  lunch_child_price NUMERIC(10,2) DEFAULT 0,
  lunch_enabled BOOLEAN DEFAULT false,
  
  -- Dinner pricing  
  dinner_adult_price NUMERIC(10,2) DEFAULT 0,
  dinner_child_price NUMERIC(10,2) DEFAULT 0,
  dinner_enabled BOOLEAN DEFAULT false,
  
  -- Transfer pricing
  transfer_arrival_price NUMERIC(10,2) DEFAULT 0,
  transfer_departure_price NUMERIC(10,2) DEFAULT 0,
  transfer_roundtrip_price NUMERIC(10,2) DEFAULT 0,
  transfer_vehicle_type TEXT DEFAULT 'sedan',
  transfer_max_passengers INTEGER DEFAULT 4,
  transfer_enabled BOOLEAN DEFAULT false,
  
  -- Extra bed pricing
  extra_bed_price NUMERIC(10,2) DEFAULT 0,
  crib_price NUMERIC(10,2) DEFAULT 0,
  extra_bed_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(property_id)
);

-- Enable RLS
ALTER TABLE property_service_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read service pricing"
  ON property_service_pricing
  FOR SELECT
  USING (true);

CREATE POLICY "Admin full access service pricing"
  ON property_service_pricing
  FOR ALL
  USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_property_service_pricing_property ON property_service_pricing(property_id);
