'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export interface PricingRule {
  id: string
  property_id: string
  rule_type: 'monthly' | 'period' | 'date_override'
  month?: number // 1-12 for monthly rules
  start_date?: string
  end_date?: string
  price_per_night: number
  min_nights?: number
  priority: number
  name?: string
  is_active: boolean
}

export interface BlockedDate {
  id: string
  property_id: string
  start_date: string
  end_date: string
  reason?: string
  block_type: 'manual' | 'maintenance' | 'owner_use'
}

export interface ExternalBlock {
  id: string
  property_id: string
  start_date: string
  end_date: string
  source: 'airbnb' | 'booking' | 'other'
  external_id?: string
  guest_name?: string
}

export interface AvailabilityResult {
  available: boolean
  blockedDates: string[]
  reason?: string
}

export interface PriceCalculation {
  nights: number
  pricePerNight: number[]
  totalAccommodation: number
  breakdown: { date: string; price: number; ruleName?: string }[]
}

// ============================================
// PRICING RULES ACTIONS
// ============================================

export async function getPricingRules(propertyId: string): Promise<{ data: PricingRule[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_pricing_rules')
    .select('*')
    .eq('property_id', propertyId)
    .order('priority', { ascending: false })
    .order('rule_type')
  
  if (error) {
    console.error('Error fetching pricing rules:', error)
    return { data: null, error: error.message }
  }
  
  return { data: data as PricingRule[], error: null }
}

export async function createPricingRule(
  rule: Omit<PricingRule, 'id'>
): Promise<{ data: PricingRule | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_pricing_rules')
    .insert(rule)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating pricing rule:', error)
    return { data: null, error: error.message }
  }
  
  revalidatePath(`/admin/properties/${rule.property_id}`)
  return { data: data as PricingRule, error: null }
}

export async function updatePricingRule(
  id: string,
  updates: Partial<PricingRule>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('property_pricing_rules')
    .update(updates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating pricing rule:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/properties')
  return { error: null }
}

export async function deletePricingRule(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('property_pricing_rules')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting pricing rule:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/properties')
  return { error: null }
}

// Bulk update monthly prices
export async function setMonthlyPrices(
  propertyId: string,
  monthlyPrices: { month: number; price: number; minNights?: number }[]
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  // Delete existing monthly rules for this property
  await supabase
    .from('property_pricing_rules')
    .delete()
    .eq('property_id', propertyId)
    .eq('rule_type', 'monthly')
  
  // Insert new monthly rules
  const rules = monthlyPrices.map((mp, index) => ({
    property_id: propertyId,
    rule_type: 'monthly' as const,
    month: mp.month,
    price_per_night: mp.price,
    min_nights: mp.minNights || 1,
    priority: 10,
    is_active: true
  }))
  
  const { error } = await supabase
    .from('property_pricing_rules')
    .insert(rules)
  
  if (error) {
    console.error('Error setting monthly prices:', error)
    return { error: error.message }
  }
  
  revalidatePath(`/admin/properties/${propertyId}`)
  return { error: null }
}

// ============================================
// BLOCKED DATES ACTIONS
// ============================================

export async function getBlockedDates(propertyId: string): Promise<{ data: BlockedDate[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_blocked_dates')
    .select('*')
    .eq('property_id', propertyId)
    .order('start_date')
  
  if (error) {
    console.error('Error fetching blocked dates:', error)
    return { data: null, error: error.message }
  }
  
  return { data: data as BlockedDate[], error: null }
}

export async function createBlockedDate(
  block: Omit<BlockedDate, 'id'>
): Promise<{ data: BlockedDate | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_blocked_dates')
    .insert(block)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating blocked date:', error)
    return { data: null, error: error.message }
  }
  
  revalidatePath(`/admin/properties/${block.property_id}`)
  return { data: data as BlockedDate, error: null }
}

export async function deleteBlockedDate(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('property_blocked_dates')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting blocked date:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/properties')
  return { error: null }
}

// ============================================
// EXTERNAL BLOCKS (iCal sync)
// ============================================

export async function getExternalBlocks(propertyId: string): Promise<{ data: ExternalBlock[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_external_blocks')
    .select('*')
    .eq('property_id', propertyId)
    .order('start_date')
  
  if (error) {
    console.error('Error fetching external blocks:', error)
    return { data: null, error: error.message }
  }
  
  return { data: data as ExternalBlock[], error: null }
}

// ============================================
// AVAILABILITY CHECK
// ============================================

export async function checkAvailability(
  propertyId: string,
  checkIn: string,
  checkOut: string
): Promise<AvailabilityResult> {
  const supabase = await createClient()
  
  // Get all blocks that overlap with the requested dates
  const { data: manualBlocks } = await supabase
    .from('property_blocked_dates')
    .select('start_date, end_date, reason')
    .eq('property_id', propertyId)
    .or(`start_date.lte.${checkOut},end_date.gte.${checkIn}`)
  
  const { data: externalBlocks } = await supabase
    .from('property_external_blocks')
    .select('start_date, end_date, source')
    .eq('property_id', propertyId)
    .or(`start_date.lte.${checkOut},end_date.gte.${checkIn}`)
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
    .in('status', ['confirmed', 'pending'])
    .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`)
  
  const blockedDates: string[] = []
  
  // Helper to get all dates in a range
  const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = []
    const current = new Date(start)
    const endDate = new Date(end)
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }
  
  // Collect all blocked dates
  manualBlocks?.forEach(block => {
    blockedDates.push(...getDatesInRange(block.start_date, block.end_date))
  })
  
  externalBlocks?.forEach(block => {
    blockedDates.push(...getDatesInRange(block.start_date, block.end_date))
  })
  
  bookings?.forEach(booking => {
    blockedDates.push(...getDatesInRange(booking.check_in, booking.check_out))
  })
  
  // Check if any requested dates are blocked
  const requestedDates = getDatesInRange(checkIn, checkOut)
  const conflictingDates = requestedDates.filter(d => blockedDates.includes(d))
  
  if (conflictingDates.length > 0) {
    return {
      available: false,
      blockedDates: [...new Set(conflictingDates)],
      reason: 'Some dates are not available'
    }
  }
  
  return {
    available: true,
    blockedDates: []
  }
}

// ============================================
// PRICE CALCULATION
// ============================================

export async function calculatePrice(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  guests?: number
): Promise<{ data: PriceCalculation | null; error: string | null }> {
  const supabase = await createClient()
  
  // Get property base price
  const { data: property } = await supabase
    .from('properties')
    .select('base_price')
    .eq('id', propertyId)
    .single()
  
  if (!property) {
    return { data: null, error: 'Property not found' }
  }
  
  const basePrice = property.base_price || 100
  
  // Get all pricing rules for this property
  const { data: rules } = await supabase
    .from('property_pricing_rules')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('priority', { ascending: false })
  
  // Calculate price for each night
  const breakdown: { date: string; price: number; ruleName?: string }[] = []
  const current = new Date(checkIn)
  const endDate = new Date(checkOut)
  
  while (current < endDate) {
    const dateStr = current.toISOString().split('T')[0]
    const month = current.getMonth() + 1 // 1-12
    
    let nightPrice = basePrice
    let appliedRule: string | undefined
    
    if (rules && rules.length > 0) {
      // Find the highest priority rule that applies to this date
      for (const rule of rules) {
        if (rule.rule_type === 'date_override') {
          // Date override: check if date falls within range
          if (rule.start_date && rule.end_date) {
            if (dateStr >= rule.start_date && dateStr <= rule.end_date) {
              nightPrice = rule.price_per_night
              appliedRule = rule.name || 'Date Override'
              break
            }
          }
        } else if (rule.rule_type === 'period') {
          // Period rule: check if date falls within range
          if (rule.start_date && rule.end_date) {
            if (dateStr >= rule.start_date && dateStr <= rule.end_date) {
              nightPrice = rule.price_per_night
              appliedRule = rule.name || 'Period Price'
              break
            }
          }
        } else if (rule.rule_type === 'monthly') {
          // Monthly rule: check month
          if (rule.month === month) {
            nightPrice = rule.price_per_night
            appliedRule = `${getMonthName(month)} Price`
            break
          }
        }
      }
    }
    
    breakdown.push({
      date: dateStr,
      price: nightPrice,
      ruleName: appliedRule
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  const nights = breakdown.length
  const totalAccommodation = breakdown.reduce((sum, b) => sum + b.price, 0)
  const pricePerNight = breakdown.map(b => b.price)
  
  return {
    data: {
      nights,
      pricePerNight,
      totalAccommodation,
      breakdown
    },
    error: null
  }
}

function getMonthName(month: number): string {
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December']
  return months[month] || ''
}

// ============================================
// GET ALL UNAVAILABLE DATES FOR CALENDAR
// ============================================

export async function getUnavailableDates(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{ data: { date: string; type: string }[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const unavailableDates: { date: string; type: string }[] = []
  
  // Helper to get all dates in a range
  const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = []
    const current = new Date(start)
    const endDateObj = new Date(end)
    while (current <= endDateObj) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }
  
  // Get manual blocks
  const { data: manualBlocks } = await supabase
    .from('property_blocked_dates')
    .select('start_date, end_date, block_type')
    .eq('property_id', propertyId)
    .gte('end_date', startDate)
    .lte('start_date', endDate)
  
  manualBlocks?.forEach(block => {
    getDatesInRange(block.start_date, block.end_date).forEach(date => {
      unavailableDates.push({ date, type: block.block_type || 'blocked' })
    })
  })
  
  // Get external blocks (Airbnb, Booking.com)
  const { data: externalBlocks } = await supabase
    .from('property_external_blocks')
    .select('start_date, end_date, source')
    .eq('property_id', propertyId)
    .gte('end_date', startDate)
    .lte('start_date', endDate)
  
  externalBlocks?.forEach(block => {
    getDatesInRange(block.start_date, block.end_date).forEach(date => {
      unavailableDates.push({ date, type: block.source })
    })
  })
  
  // Get confirmed bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
    .in('status', ['confirmed', 'pending'])
    .gte('check_out', startDate)
    .lte('check_in', endDate)
  
  bookings?.forEach(booking => {
    getDatesInRange(booking.check_in, booking.check_out).forEach(date => {
      unavailableDates.push({ date, type: 'booked' })
    })
  })
  
  return { data: unavailableDates, error: null }
}

// ============================================
// GET PRICES FOR CALENDAR DISPLAY
// ============================================

export async function getCalendarPrices(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{ data: { date: string; price: number }[] | null; error: string | null }> {
  const supabase = await createClient()
  
  // Get property base price
  const { data: property } = await supabase
    .from('properties')
    .select('base_price')
    .eq('id', propertyId)
    .single()
  
  if (!property) {
    return { data: null, error: 'Property not found' }
  }
  
  const basePrice = property.base_price || 100
  
  // Get all pricing rules
  const { data: rules } = await supabase
    .from('property_pricing_rules')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('priority', { ascending: false })
  
  const prices: { date: string; price: number }[] = []
  const current = new Date(startDate)
  const endDateObj = new Date(endDate)
  
  while (current <= endDateObj) {
    const dateStr = current.toISOString().split('T')[0]
    const month = current.getMonth() + 1
    
    let price = basePrice
    
    if (rules && rules.length > 0) {
      for (const rule of rules) {
        if (rule.rule_type === 'date_override' && rule.start_date && rule.end_date) {
          if (dateStr >= rule.start_date && dateStr <= rule.end_date) {
            price = rule.price_per_night
            break
          }
        } else if (rule.rule_type === 'period' && rule.start_date && rule.end_date) {
          if (dateStr >= rule.start_date && dateStr <= rule.end_date) {
            price = rule.price_per_night
            break
          }
        } else if (rule.rule_type === 'monthly' && rule.month === month) {
          price = rule.price_per_night
          break
        }
      }
    }
    
    prices.push({ date: dateStr, price })
    current.setDate(current.getDate() + 1)
  }
  
  return { data: prices, error: null }
}
