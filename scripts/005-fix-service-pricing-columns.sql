-- ============================================
-- FIX SERVICE PRICING COLUMN NAMES
-- Align column names with TypeScript code
-- ============================================

-- Rename breakfast columns
ALTER TABLE property_service_pricing 
RENAME COLUMN breakfast_price_adult TO breakfast_adult_price;

ALTER TABLE property_service_pricing 
RENAME COLUMN breakfast_price_child TO breakfast_child_price;

-- Rename lunch columns
ALTER TABLE property_service_pricing 
RENAME COLUMN lunch_price_adult TO lunch_adult_price;

ALTER TABLE property_service_pricing 
RENAME COLUMN lunch_price_child TO lunch_child_price;

-- Rename dinner columns
ALTER TABLE property_service_pricing 
RENAME COLUMN dinner_price_adult TO dinner_adult_price;

ALTER TABLE property_service_pricing 
RENAME COLUMN dinner_price_child TO dinner_child_price;

-- Rename transfer columns to match TypeScript expectations
ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS transfer_available BOOLEAN DEFAULT true;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS transfer_arrival_price NUMERIC(10,2) DEFAULT 25.00;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS transfer_departure_price NUMERIC(10,2) DEFAULT 25.00;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS transfer_roundtrip_price NUMERIC(10,2) DEFAULT 45.00;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS transfer_max_passengers INTEGER DEFAULT 6;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS transfer_vehicle_type TEXT DEFAULT 'Standard';

-- Add extra bed columns
ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS extra_bed_available BOOLEAN DEFAULT false;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS extra_bed_price NUMERIC(10,2) DEFAULT 30.00;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS crib_available BOOLEAN DEFAULT false;

ALTER TABLE property_service_pricing 
ADD COLUMN IF NOT EXISTS crib_price NUMERIC(10,2) DEFAULT 0;

-- Copy existing transfer data if columns existed
UPDATE property_service_pricing 
SET transfer_available = airport_transfer_available,
    transfer_arrival_price = airport_transfer_price,
    transfer_roundtrip_price = airport_transfer_price_return
WHERE airport_transfer_available IS NOT NULL;

SELECT 'Column names fixed!' as result;
