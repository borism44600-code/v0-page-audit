-- =============================================================
-- REAL PRICING & AVAILABILITY SYSTEM
-- =============================================================
-- This creates the complete pricing engine with:
-- - Monthly pricing (different prices by month)
-- - Period pricing (custom date ranges like Christmas, Ramadan, etc.)
-- - Date-specific overrides (manual price for specific dates)
-- - Blocked dates (manual blocks by admin)
-- - External blocked dates (from Airbnb/Booking sync)
-- =============================================================

-- 1. PROPERTY PRICING RULES (Monthly & Period Pricing)
-- =============================================================
CREATE TABLE IF NOT EXISTS property_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Rule type: 'monthly' or 'period' or 'date_override'
  rule_type TEXT NOT NULL CHECK (rule_type IN ('monthly', 'period', 'date_override')),
  
  -- For monthly pricing: which month (1-12)
  month INTEGER CHECK (month >= 1 AND month <= 12),
  
  -- For period pricing: name of the period
  period_name TEXT,
  
  -- For period/date_override: date range
  start_date DATE,
  end_date DATE,
  
  -- The price per night for this rule
  price_per_night NUMERIC(10,2) NOT NULL,
  
  -- Priority: higher priority rules override lower ones
  -- Default: monthly=10, period=20, date_override=30
  priority INTEGER DEFAULT 10,
  
  -- Is this rule active?
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_pricing_rules_property ON property_pricing_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON property_pricing_rules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_month ON property_pricing_rules(month) WHERE rule_type = 'monthly';

-- 2. PROPERTY BLOCKED DATES (Manual Admin Blocks)
-- =============================================================
CREATE TABLE IF NOT EXISTS property_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- The blocked date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Reason for blocking
  reason TEXT,
  
  -- Block type: 'manual' (admin blocked), 'maintenance', 'owner_use', etc.
  block_type TEXT DEFAULT 'manual',
  
  -- Who created this block
  created_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure start_date <= end_date
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Index for fast availability checks
CREATE INDEX IF NOT EXISTS idx_blocked_dates_property ON property_blocked_dates(property_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_range ON property_blocked_dates(property_id, start_date, end_date);

-- 3. EXTERNAL BLOCKED DATES (From Airbnb/Booking Sync)
-- =============================================================
CREATE TABLE IF NOT EXISTS property_external_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Source of the block
  source TEXT NOT NULL CHECK (source IN ('airbnb', 'booking', 'vrbo', 'other')),
  
  -- The blocked date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- External reference (booking ID from platform if available)
  external_reference TEXT,
  
  -- Summary/description from iCal
  summary TEXT,
  
  -- Last sync timestamp
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast availability checks
CREATE INDEX IF NOT EXISTS idx_external_blocks_property ON property_external_blocks(property_id);
CREATE INDEX IF NOT EXISTS idx_external_blocks_range ON property_external_blocks(property_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_external_blocks_source ON property_external_blocks(source);

-- 4. ADD BOOKING STATUS UPDATES
-- =============================================================
-- Update bookings table to ensure it has all needed columns
DO $$
BEGIN
  -- Add cancelled_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'cancelled_at') THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
  
  -- Add cancellation_reason column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'cancellation_reason') THEN
    ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT;
  END IF;
  
  -- Add deposit_amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'deposit_amount') THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount NUMERIC(10,2);
  END IF;
  
  -- Add balance_due column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'balance_due') THEN
    ALTER TABLE bookings ADD COLUMN balance_due NUMERIC(10,2);
  END IF;
  
  -- Add nightly_breakdown column (JSONB array of {date, price})
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'nightly_breakdown') THEN
    ALTER TABLE bookings ADD COLUMN nightly_breakdown JSONB;
  END IF;
  
  -- Add services_total column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'services_total') THEN
    ALTER TABLE bookings ADD COLUMN services_total NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  -- Add accommodation_total column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'accommodation_total') THEN
    ALTER TABLE bookings ADD COLUMN accommodation_total NUMERIC(10,2);
  END IF;
END $$;

-- 5. FUNCTION TO CHECK AVAILABILITY
-- =============================================================
CREATE OR REPLACE FUNCTION check_property_availability(
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
  has_conflict BOOLEAN;
BEGIN
  -- Check for conflicts with:
  -- 1. Confirmed bookings
  -- 2. Manual blocked dates
  -- 3. External blocked dates
  
  SELECT EXISTS (
    -- Check bookings
    SELECT 1 FROM bookings
    WHERE property_id = p_property_id
    AND status IN ('confirmed', 'pending')
    AND check_in < p_check_out
    AND check_out > p_check_in
    
    UNION ALL
    
    -- Check manual blocks
    SELECT 1 FROM property_blocked_dates
    WHERE property_id = p_property_id
    AND start_date < p_check_out
    AND end_date >= p_check_in
    
    UNION ALL
    
    -- Check external blocks
    SELECT 1 FROM property_external_blocks
    WHERE property_id = p_property_id
    AND start_date < p_check_out
    AND end_date >= p_check_in
  ) INTO has_conflict;
  
  RETURN NOT has_conflict;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNCTION TO GET PRICE FOR A DATE
-- =============================================================
CREATE OR REPLACE FUNCTION get_property_price_for_date(
  p_property_id UUID,
  p_date DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_price NUMERIC;
  v_base_price NUMERIC;
BEGIN
  -- Get base price from properties table
  SELECT price_per_night INTO v_base_price
  FROM properties
  WHERE id = p_property_id;
  
  -- Look for the highest priority active rule that applies
  SELECT price_per_night INTO v_price
  FROM property_pricing_rules
  WHERE property_id = p_property_id
  AND is_active = true
  AND (
    -- Monthly rule
    (rule_type = 'monthly' AND month = EXTRACT(MONTH FROM p_date))
    OR
    -- Period rule
    (rule_type = 'period' AND start_date <= p_date AND end_date >= p_date)
    OR
    -- Date override rule
    (rule_type = 'date_override' AND start_date <= p_date AND end_date >= p_date)
  )
  ORDER BY priority DESC, created_at DESC
  LIMIT 1;
  
  -- Return the rule price if found, otherwise base price
  RETURN COALESCE(v_price, v_base_price, 0);
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCTION TO CALCULATE TOTAL FOR DATE RANGE
-- =============================================================
CREATE OR REPLACE FUNCTION calculate_booking_total(
  p_property_id UUID,
  p_check_in DATE,
  p_check_out DATE
) RETURNS TABLE (
  total_price NUMERIC,
  num_nights INTEGER,
  nightly_breakdown JSONB
) AS $$
DECLARE
  v_current_date DATE;
  v_total NUMERIC := 0;
  v_nights INTEGER := 0;
  v_breakdown JSONB := '[]'::JSONB;
  v_daily_price NUMERIC;
BEGIN
  v_current_date := p_check_in;
  
  WHILE v_current_date < p_check_out LOOP
    v_daily_price := get_property_price_for_date(p_property_id, v_current_date);
    v_total := v_total + v_daily_price;
    v_nights := v_nights + 1;
    v_breakdown := v_breakdown || jsonb_build_object('date', v_current_date, 'price', v_daily_price);
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN QUERY SELECT v_total, v_nights, v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS POLICIES
-- =============================================================
ALTER TABLE property_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_external_blocks ENABLE ROW LEVEL SECURITY;

-- Public can read pricing rules
DROP POLICY IF EXISTS "Public read pricing rules" ON property_pricing_rules;
CREATE POLICY "Public read pricing rules" ON property_pricing_rules
  FOR SELECT USING (true);

-- Admin full access to pricing rules
DROP POLICY IF EXISTS "Admin full access pricing rules" ON property_pricing_rules;
CREATE POLICY "Admin full access pricing rules" ON property_pricing_rules
  FOR ALL USING (true);

-- Public can read blocked dates (to show in calendar)
DROP POLICY IF EXISTS "Public read blocked dates" ON property_blocked_dates;
CREATE POLICY "Public read blocked dates" ON property_blocked_dates
  FOR SELECT USING (true);

-- Admin full access to blocked dates
DROP POLICY IF EXISTS "Admin full access blocked dates" ON property_blocked_dates;
CREATE POLICY "Admin full access blocked dates" ON property_blocked_dates
  FOR ALL USING (true);

-- Public can read external blocks
DROP POLICY IF EXISTS "Public read external blocks" ON property_external_blocks;
CREATE POLICY "Public read external blocks" ON property_external_blocks
  FOR SELECT USING (true);

-- Admin full access to external blocks
DROP POLICY IF EXISTS "Admin full access external blocks" ON property_external_blocks;
CREATE POLICY "Admin full access external blocks" ON property_external_blocks
  FOR ALL USING (true);

-- 9. UPDATED_AT TRIGGERS
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON property_pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON property_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocked_dates_updated_at ON property_blocked_dates;
CREATE TRIGGER update_blocked_dates_updated_at
  BEFORE UPDATE ON property_blocked_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_blocks_updated_at ON property_external_blocks;
CREATE TRIGGER update_external_blocks_updated_at
  BEFORE UPDATE ON property_external_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
