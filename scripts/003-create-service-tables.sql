-- ============================================
-- SERVICE BOOKING SYSTEM - REAL PERSISTENCE
-- Creates all tables for breakfast, meals, taxi, extras
-- ============================================

-- ============================================
-- 1. PROPERTY SERVICE PRICING
-- Each property can have its own pricing for services
-- ============================================

CREATE TABLE IF NOT EXISTS property_service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Breakfast pricing
  breakfast_available BOOLEAN DEFAULT true,
  breakfast_price_adult NUMERIC(10,2) DEFAULT 25.00,
  breakfast_price_child NUMERIC(10,2) DEFAULT 15.00,
  breakfast_child_age_limit INTEGER DEFAULT 12,
  
  -- Lunch pricing
  lunch_available BOOLEAN DEFAULT true,
  lunch_price_adult NUMERIC(10,2) DEFAULT 45.00,
  lunch_price_child NUMERIC(10,2) DEFAULT 25.00,
  
  -- Dinner pricing
  dinner_available BOOLEAN DEFAULT true,
  dinner_price_adult NUMERIC(10,2) DEFAULT 60.00,
  dinner_price_child NUMERIC(10,2) DEFAULT 35.00,
  
  -- Airport Transfer pricing
  airport_transfer_available BOOLEAN DEFAULT true,
  airport_transfer_price NUMERIC(10,2) DEFAULT 25.00,
  airport_transfer_price_return NUMERIC(10,2) DEFAULT 45.00,
  airport_transfer_extra_passenger_price NUMERIC(10,2) DEFAULT 5.00,
  airport_transfer_max_passengers INTEGER DEFAULT 6,
  
  -- Private Driver pricing
  driver_available BOOLEAN DEFAULT true,
  driver_price_half_day NUMERIC(10,2) DEFAULT 80.00,
  driver_price_full_day NUMERIC(10,2) DEFAULT 150.00,
  
  -- Notes and special info
  service_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(property_id)
);

-- Enable RLS
ALTER TABLE property_service_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access for property_service_pricing" ON property_service_pricing
  FOR ALL USING (true);

CREATE POLICY "Public read access for property_service_pricing" ON property_service_pricing
  FOR SELECT USING (true);


-- ============================================
-- 2. BOOKING BREAKFASTS
-- Stores breakfast selections per booking per day
-- ============================================

CREATE TABLE IF NOT EXISTS booking_breakfasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  service_date DATE NOT NULL,
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  price_per_adult NUMERIC(10,2) NOT NULL,
  price_per_child NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'locked', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(booking_id, service_date)
);

-- Enable RLS
ALTER TABLE booking_breakfasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access for booking_breakfasts" ON booking_breakfasts
  FOR ALL USING (true);

CREATE POLICY "Public can view own booking breakfasts" ON booking_breakfasts
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE review_token IS NOT NULL
    )
  );


-- ============================================
-- 3. BOOKING MEALS
-- Stores meal selections (lunch/dinner) per booking
-- ============================================

CREATE TABLE IF NOT EXISTS booking_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  service_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('lunch', 'dinner')),
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  price_per_adult NUMERIC(10,2) NOT NULL,
  price_per_child NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  
  dietary_requirements TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'locked', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(booking_id, service_date, meal_type)
);

-- Enable RLS
ALTER TABLE booking_meals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access for booking_meals" ON booking_meals
  FOR ALL USING (true);

CREATE POLICY "Public can view own booking meals" ON booking_meals
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE review_token IS NOT NULL
    )
  );


-- ============================================
-- 4. BOOKING TRANSFERS (Taxi/Airport)
-- Stores transfer requests per booking
-- ============================================

CREATE TABLE IF NOT EXISTS booking_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  transfer_date DATE NOT NULL,
  transfer_time TIME NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('airport_to_property', 'property_to_airport', 'custom')),
  
  num_passengers INTEGER DEFAULT 1,
  flight_number TEXT,
  pickup_location TEXT,
  dropoff_location TEXT,
  
  price NUMERIC(10,2) NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'locked', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booking_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access for booking_transfers" ON booking_transfers
  FOR ALL USING (true);

CREATE POLICY "Public can view own booking transfers" ON booking_transfers
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE review_token IS NOT NULL
    )
  );


-- ============================================
-- 5. BOOKING EXTRAS (Excursions, Driver, Spa, etc.)
-- Stores other service bookings
-- ============================================

CREATE TABLE IF NOT EXISTS booking_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  service_type TEXT NOT NULL CHECK (service_type IN ('excursion', 'driver', 'spa', 'concierge', 'other')),
  service_id UUID, -- Reference to excursions or services table if applicable
  service_name TEXT NOT NULL,
  
  service_date DATE NOT NULL,
  service_time TIME,
  duration TEXT, -- 'half_day', 'full_day', '60min', etc.
  
  num_adults INTEGER DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  price_per_adult NUMERIC(10,2) NOT NULL,
  price_per_child NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'locked', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access for booking_extras" ON booking_extras
  FOR ALL USING (true);

CREATE POLICY "Public can view own booking extras" ON booking_extras
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE review_token IS NOT NULL
    )
  );


-- ============================================
-- 6. Add service totals to bookings table
-- ============================================

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS services_total NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0;


-- ============================================
-- 7. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_property_service_pricing_property ON property_service_pricing(property_id);
CREATE INDEX IF NOT EXISTS idx_booking_breakfasts_booking ON booking_breakfasts(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_breakfasts_date ON booking_breakfasts(service_date);
CREATE INDEX IF NOT EXISTS idx_booking_meals_booking ON booking_meals(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_meals_date ON booking_meals(service_date);
CREATE INDEX IF NOT EXISTS idx_booking_transfers_booking ON booking_transfers(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_transfers_date ON booking_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_booking_extras_booking ON booking_extras(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_extras_date ON booking_extras(service_date);


-- ============================================
-- 8. Create function to update services_total on booking
-- ============================================

CREATE OR REPLACE FUNCTION update_booking_services_total()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_id UUID;
  v_total NUMERIC(10,2);
BEGIN
  -- Determine which booking to update
  IF TG_OP = 'DELETE' THEN
    v_booking_id := OLD.booking_id;
  ELSE
    v_booking_id := NEW.booking_id;
  END IF;
  
  -- Calculate total from all service tables
  SELECT COALESCE(
    (SELECT SUM(total_price) FROM booking_breakfasts WHERE booking_id = v_booking_id AND status != 'cancelled'), 0
  ) + COALESCE(
    (SELECT SUM(total_price) FROM booking_meals WHERE booking_id = v_booking_id AND status != 'cancelled'), 0
  ) + COALESCE(
    (SELECT SUM(price) FROM booking_transfers WHERE booking_id = v_booking_id AND status != 'cancelled'), 0
  ) + COALESCE(
    (SELECT SUM(total_price) FROM booking_extras WHERE booking_id = v_booking_id AND status != 'cancelled'), 0
  )
  INTO v_total;
  
  -- Update the booking
  UPDATE bookings SET services_total = v_total, updated_at = NOW() WHERE id = v_booking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 9. Create triggers to auto-update services_total
-- ============================================

DROP TRIGGER IF EXISTS trg_update_services_total_breakfasts ON booking_breakfasts;
CREATE TRIGGER trg_update_services_total_breakfasts
  AFTER INSERT OR UPDATE OR DELETE ON booking_breakfasts
  FOR EACH ROW EXECUTE FUNCTION update_booking_services_total();

DROP TRIGGER IF EXISTS trg_update_services_total_meals ON booking_meals;
CREATE TRIGGER trg_update_services_total_meals
  AFTER INSERT OR UPDATE OR DELETE ON booking_meals
  FOR EACH ROW EXECUTE FUNCTION update_booking_services_total();

DROP TRIGGER IF EXISTS trg_update_services_total_transfers ON booking_transfers;
CREATE TRIGGER trg_update_services_total_transfers
  AFTER INSERT OR UPDATE OR DELETE ON booking_transfers
  FOR EACH ROW EXECUTE FUNCTION update_booking_services_total();

DROP TRIGGER IF EXISTS trg_update_services_total_extras ON booking_extras;
CREATE TRIGGER trg_update_services_total_extras
  AFTER INSERT OR UPDATE OR DELETE ON booking_extras
  FOR EACH ROW EXECUTE FUNCTION update_booking_services_total();


-- ============================================
-- 10. Insert default pricing for existing properties
-- ============================================

INSERT INTO property_service_pricing (property_id)
SELECT id FROM properties
WHERE id NOT IN (SELECT property_id FROM property_service_pricing)
ON CONFLICT (property_id) DO NOTHING;


-- Done!
SELECT 'Service tables created successfully!' as result;
