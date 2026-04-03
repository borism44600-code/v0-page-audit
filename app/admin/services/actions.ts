'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// PROPERTY SERVICE PRICING ACTIONS
// ============================================================================

export interface PropertyServicePricing {
  id: string
  property_id: string
  // Breakfast pricing
  breakfast_available: boolean
  breakfast_adult_price: number
  breakfast_child_price: number
  breakfast_child_age_limit: number
  // Meals pricing
  lunch_available: boolean
  lunch_adult_price: number
  lunch_child_price: number
  dinner_available: boolean
  dinner_adult_price: number
  dinner_child_price: number
  // Airport transfer pricing
  transfer_available: boolean
  transfer_arrival_price: number
  transfer_departure_price: number
  transfer_roundtrip_price: number
  transfer_max_passengers: number
  transfer_vehicle_type: string
  // Extra services
  extra_bed_available: boolean
  extra_bed_price: number
  crib_available: boolean
  crib_price: number
  created_at: string
  updated_at: string
}

// Get property service pricing
export async function getPropertyServicePricing(propertyId: string): Promise<PropertyServicePricing | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_service_pricing')
    .select('*')
    .eq('property_id', propertyId)
    .single()
  
  if (error) {
    // If not found, return null (will create on first save)
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching property service pricing:', error)
    return null
  }
  
  return data
}

// Update or create property service pricing
export async function updatePropertyServicePricing(
  propertyId: string,
  pricing: Partial<Omit<PropertyServicePricing, 'id' | 'property_id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()
  
  // Check if pricing exists
  const existing = await getPropertyServicePricing(propertyId)
  
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('property_service_pricing')
      .update({
        ...pricing,
        updated_at: new Date().toISOString()
      })
      .eq('property_id', propertyId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating property service pricing:', error)
      return { error: error.message }
    }
    
    revalidatePath(`/admin/properties/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)
    return { data }
  } else {
    // Create new
    const { data, error } = await supabase
      .from('property_service_pricing')
      .insert({
        property_id: propertyId,
        ...pricing
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating property service pricing:', error)
      return { error: error.message }
    }
    
    revalidatePath(`/admin/properties/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)
    return { data }
  }
}

// ============================================================================
// BOOKING SERVICE ACTIONS
// ============================================================================

// Get all booked services for a booking
export async function getBookingServices(bookingId: string) {
  const supabase = await createClient()
  
  const [breakfasts, meals, transfers, extras] = await Promise.all([
    supabase.from('booking_breakfasts').select('*').eq('booking_id', bookingId).order('date'),
    supabase.from('booking_meals').select('*').eq('booking_id', bookingId).order('date'),
    supabase.from('booking_transfers').select('*').eq('booking_id', bookingId).order('transfer_datetime'),
    supabase.from('booking_extras').select('*').eq('booking_id', bookingId)
  ])
  
  return {
    breakfasts: breakfasts.data || [],
    meals: meals.data || [],
    transfers: transfers.data || [],
    extras: extras.data || []
  }
}

// ============================================================================
// BREAKFAST BOOKING ACTIONS
// ============================================================================

export interface BookingBreakfast {
  id?: string
  booking_id: string
  date: string  // YYYY-MM-DD
  adults_count: number
  children_count: number
  adult_price: number
  child_price: number
  total_price: number
  notes?: string
}

export async function addBreakfast(data: BookingBreakfast) {
  const supabase = await createClient()
  
  const total = (data.adults_count * data.adult_price) + (data.children_count * data.child_price)
  
  const { data: breakfast, error } = await supabase
    .from('booking_breakfasts')
    .insert({
      booking_id: data.booking_id,
      date: data.date,
      adults_count: data.adults_count,
      children_count: data.children_count,
      adult_price: data.adult_price,
      child_price: data.child_price,
      total_price: total,
      notes: data.notes
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding breakfast:', error)
    return { error: error.message }
  }
  
  // Update booking totals
  await updateBookingServiceTotals(data.booking_id)
  
  revalidatePath(`/booking/${data.booking_id}`)
  return { data: breakfast }
}

export async function updateBreakfast(id: string, data: Partial<BookingBreakfast>) {
  const supabase = await createClient()
  
  const total = data.adults_count && data.adult_price && data.children_count !== undefined && data.child_price !== undefined
    ? (data.adults_count * data.adult_price) + (data.children_count * data.child_price)
    : undefined
  
  const { data: breakfast, error } = await supabase
    .from('booking_breakfasts')
    .update({
      ...data,
      ...(total !== undefined ? { total_price: total } : {})
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating breakfast:', error)
    return { error: error.message }
  }
  
  if (data.booking_id) {
    await updateBookingServiceTotals(data.booking_id)
    revalidatePath(`/booking/${data.booking_id}`)
  }
  
  return { data: breakfast }
}

export async function removeBreakfast(id: string, bookingId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('booking_breakfasts')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error removing breakfast:', error)
    return { error: error.message }
  }
  
  await updateBookingServiceTotals(bookingId)
  revalidatePath(`/booking/${bookingId}`)
  return { success: true }
}

// ============================================================================
// MEAL BOOKING ACTIONS
// ============================================================================

export interface BookingMeal {
  id?: string
  booking_id: string
  date: string
  meal_type: 'lunch' | 'dinner'
  adults_count: number
  children_count: number
  adult_price: number
  child_price: number
  total_price: number
  dietary_requirements?: string
  notes?: string
}

export async function addMeal(data: BookingMeal) {
  const supabase = await createClient()
  
  const total = (data.adults_count * data.adult_price) + (data.children_count * data.child_price)
  
  const { data: meal, error } = await supabase
    .from('booking_meals')
    .insert({
      booking_id: data.booking_id,
      date: data.date,
      meal_type: data.meal_type,
      adults_count: data.adults_count,
      children_count: data.children_count,
      adult_price: data.adult_price,
      child_price: data.child_price,
      total_price: total,
      dietary_requirements: data.dietary_requirements,
      notes: data.notes
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding meal:', error)
    return { error: error.message }
  }
  
  await updateBookingServiceTotals(data.booking_id)
  revalidatePath(`/booking/${data.booking_id}`)
  return { data: meal }
}

export async function removeMeal(id: string, bookingId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('booking_meals')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error removing meal:', error)
    return { error: error.message }
  }
  
  await updateBookingServiceTotals(bookingId)
  revalidatePath(`/booking/${bookingId}`)
  return { success: true }
}

// ============================================================================
// TRANSFER BOOKING ACTIONS
// ============================================================================

export interface BookingTransfer {
  id?: string
  booking_id: string
  transfer_type: 'arrival' | 'departure' | 'roundtrip'
  transfer_datetime: string  // ISO datetime
  flight_number?: string
  passengers_count: number
  price: number
  pickup_location?: string
  dropoff_location?: string
  vehicle_type?: string
  notes?: string
}

export async function addTransfer(data: BookingTransfer) {
  const supabase = await createClient()
  
  const { data: transfer, error } = await supabase
    .from('booking_transfers')
    .insert({
      booking_id: data.booking_id,
      transfer_type: data.transfer_type,
      transfer_datetime: data.transfer_datetime,
      flight_number: data.flight_number,
      passengers_count: data.passengers_count,
      price: data.price,
      pickup_location: data.pickup_location,
      dropoff_location: data.dropoff_location,
      vehicle_type: data.vehicle_type,
      notes: data.notes
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding transfer:', error)
    return { error: error.message }
  }
  
  await updateBookingServiceTotals(data.booking_id)
  revalidatePath(`/booking/${data.booking_id}`)
  return { data: transfer }
}

export async function updateTransfer(id: string, data: Partial<BookingTransfer>) {
  const supabase = await createClient()
  
  const { data: transfer, error } = await supabase
    .from('booking_transfers')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating transfer:', error)
    return { error: error.message }
  }
  
  if (data.booking_id) {
    await updateBookingServiceTotals(data.booking_id)
    revalidatePath(`/booking/${data.booking_id}`)
  }
  
  return { data: transfer }
}

export async function removeTransfer(id: string, bookingId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('booking_transfers')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error removing transfer:', error)
    return { error: error.message }
  }
  
  await updateBookingServiceTotals(bookingId)
  revalidatePath(`/booking/${bookingId}`)
  return { success: true }
}

// ============================================================================
// EXTRAS BOOKING ACTIONS
// ============================================================================

export interface BookingExtra {
  id?: string
  booking_id: string
  extra_type: 'extra_bed' | 'crib' | 'early_checkin' | 'late_checkout' | 'other'
  quantity: number
  unit_price: number
  total_price: number
  description?: string
  notes?: string
}

export async function addExtra(data: BookingExtra) {
  const supabase = await createClient()
  
  const total = data.quantity * data.unit_price
  
  const { data: extra, error } = await supabase
    .from('booking_extras')
    .insert({
      booking_id: data.booking_id,
      extra_type: data.extra_type,
      quantity: data.quantity,
      unit_price: data.unit_price,
      total_price: total,
      description: data.description,
      notes: data.notes
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding extra:', error)
    return { error: error.message }
  }
  
  await updateBookingServiceTotals(data.booking_id)
  revalidatePath(`/booking/${data.booking_id}`)
  return { data: extra }
}

export async function removeExtra(id: string, bookingId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('booking_extras')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error removing extra:', error)
    return { error: error.message }
  }
  
  await updateBookingServiceTotals(bookingId)
  revalidatePath(`/booking/${bookingId}`)
  return { success: true }
}

// ============================================================================
// BOOKING TOTALS UPDATE
// ============================================================================

async function updateBookingServiceTotals(bookingId: string) {
  const supabase = await createClient()
  
  // Get all services for this booking
  const services = await getBookingServices(bookingId)
  
  // Calculate totals
  const breakfastTotal = services.breakfasts.reduce((sum, b) => sum + (b.total_price || 0), 0)
  const mealsTotal = services.meals.reduce((sum, m) => sum + (m.total_price || 0), 0)
  const transfersTotal = services.transfers.reduce((sum, t) => sum + (t.price || 0), 0)
  const extrasTotal = services.extras.reduce((sum, e) => sum + (e.total_price || 0), 0)
  
  const servicesTotal = breakfastTotal + mealsTotal + transfersTotal + extrasTotal
  
  // Update booking
  const { error } = await supabase
    .from('bookings')
    .update({
      breakfast_total: breakfastTotal,
      meals_total: mealsTotal,
      transfers_total: transfersTotal,
      extras_total: extrasTotal,
      services_total: servicesTotal
    })
    .eq('id', bookingId)
  
  if (error) {
    console.error('Error updating booking totals:', error)
  }
}

// ============================================================================
// BULK BREAKFAST OPERATIONS (for calendar selection)
// ============================================================================

export async function setBreakfastsForDates(
  bookingId: string,
  dates: string[],  // Array of YYYY-MM-DD
  adultsCount: number,
  childrenCount: number,
  adultPrice: number,
  childPrice: number
) {
  const supabase = await createClient()
  
  // First, remove all existing breakfasts for this booking
  await supabase
    .from('booking_breakfasts')
    .delete()
    .eq('booking_id', bookingId)
  
  // Then insert new breakfasts for selected dates
  if (dates.length > 0) {
    const breakfastsData = dates.map(date => ({
      booking_id: bookingId,
      date,
      adults_count: adultsCount,
      children_count: childrenCount,
      adult_price: adultPrice,
      child_price: childPrice,
      total_price: (adultsCount * adultPrice) + (childrenCount * childPrice)
    }))
    
    const { error } = await supabase
      .from('booking_breakfasts')
      .insert(breakfastsData)
    
    if (error) {
      console.error('Error setting breakfasts:', error)
      return { error: error.message }
    }
  }
  
  await updateBookingServiceTotals(bookingId)
  revalidatePath(`/booking/${bookingId}`)
  return { success: true }
}

// Set transfers for arrival and departure
export async function setTransfers(
  bookingId: string,
  arrivalTransfer: {
    enabled: boolean
    datetime?: string
    flightNumber?: string
    passengers: number
    price: number
  } | null,
  departureTransfer: {
    enabled: boolean
    datetime?: string
    flightNumber?: string
    passengers: number
    price: number
  } | null
) {
  const supabase = await createClient()
  
  // Remove existing transfers
  await supabase
    .from('booking_transfers')
    .delete()
    .eq('booking_id', bookingId)
  
  const transfers: Omit<BookingTransfer, 'id'>[] = []
  
  if (arrivalTransfer?.enabled && arrivalTransfer.datetime) {
    transfers.push({
      booking_id: bookingId,
      transfer_type: 'arrival',
      transfer_datetime: arrivalTransfer.datetime,
      flight_number: arrivalTransfer.flightNumber,
      passengers_count: arrivalTransfer.passengers,
      price: arrivalTransfer.price,
      pickup_location: 'Marrakech Airport (RAK)',
      dropoff_location: 'Property'
    })
  }
  
  if (departureTransfer?.enabled && departureTransfer.datetime) {
    transfers.push({
      booking_id: bookingId,
      transfer_type: 'departure',
      transfer_datetime: departureTransfer.datetime,
      flight_number: departureTransfer.flightNumber,
      passengers_count: departureTransfer.passengers,
      price: departureTransfer.price,
      pickup_location: 'Property',
      dropoff_location: 'Marrakech Airport (RAK)'
    })
  }
  
  if (transfers.length > 0) {
    const { error } = await supabase
      .from('booking_transfers')
      .insert(transfers)
    
    if (error) {
      console.error('Error setting transfers:', error)
      return { error: error.message }
    }
  }
  
  await updateBookingServiceTotals(bookingId)
  revalidatePath(`/booking/${bookingId}`)
  return { success: true }
}
