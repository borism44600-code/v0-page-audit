'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  checkAvailability, 
  calculatePrice, 
  getUnavailableDates,
  getCalendarPrices
} from '@/app/admin/pricing/actions'

// Re-export pricing actions for use in booking flow
export { checkAvailability, calculatePrice, getUnavailableDates, getCalendarPrices }

// ============================================
// TYPES
// ============================================

export interface CreateBookingInput {
  property_id: string
  check_in: string
  check_out: string
  guests_adults: number
  guests_children: number
  guest_name: string
  guest_email: string
  guest_phone: string
  special_requests?: string
  accommodation_total: number
  services_total: number
  total_price: number
  deposit_amount: number
  // Services data
  breakfasts?: BreakfastInput[]
  meals?: MealInput[]
  transfers?: TransferInput[]
}

interface BreakfastInput {
  date: string
  adults: number
  children: number
  adult_price: number
  child_price: number
}

interface MealInput {
  date: string
  meal_type: 'lunch' | 'dinner'
  adults: number
  children: number
  adult_price: number
  child_price: number
}

interface TransferInput {
  transfer_type: 'arrival' | 'departure' | 'round_trip'
  date: string
  time: string
  flight_number?: string
  passengers: number
  price: number
}

// ============================================
// BOOKING CREATION
// ============================================

export async function createBooking(input: CreateBookingInput): Promise<{ 
  data: { id: string; booking_reference: string } | null
  error: string | null 
}> {
  const supabase = await createClient()
  
  // First verify availability
  const availability = await checkAvailability(input.property_id, input.check_in, input.check_out)
  if (!availability.available) {
    return { 
      data: null, 
      error: `Property is not available for the selected dates. Conflicting dates: ${availability.blockedDates.join(', ')}` 
    }
  }
  
  // Generate booking reference
  const bookingReference = generateBookingReference()
  
  // Calculate nights
  const checkIn = new Date(input.check_in)
  const checkOut = new Date(input.check_out)
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  
  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      property_id: input.property_id,
      booking_reference: bookingReference,
      check_in: input.check_in,
      check_out: input.check_out,
      nights,
      guests_adults: input.guests_adults,
      guests_children: input.guests_children,
      guest_name: input.guest_name,
      guest_email: input.guest_email,
      guest_phone: input.guest_phone,
      special_requests: input.special_requests,
      accommodation_total: input.accommodation_total,
      services_total: input.services_total,
      total_price: input.total_price,
      deposit_amount: input.deposit_amount,
      balance_due: input.total_price - input.deposit_amount,
      status: 'pending',
      payment_status: 'pending'
    })
    .select('id, booking_reference')
    .single()
  
  if (bookingError) {
    console.error('Error creating booking:', bookingError)
    return { data: null, error: bookingError.message }
  }
  
  const bookingId = booking.id
  
  // Add breakfasts if any
  if (input.breakfasts && input.breakfasts.length > 0) {
    const breakfastData = input.breakfasts.map(b => ({
      booking_id: bookingId,
      date: b.date,
      adults: b.adults,
      children: b.children,
      adult_price: b.adult_price,
      child_price: b.child_price,
      total_price: (b.adults * b.adult_price) + (b.children * b.child_price)
    }))
    
    const { error: breakfastError } = await supabase
      .from('booking_breakfasts')
      .insert(breakfastData)
    
    if (breakfastError) {
      console.error('Error adding breakfasts:', breakfastError)
    }
  }
  
  // Add meals if any
  if (input.meals && input.meals.length > 0) {
    const mealData = input.meals.map(m => ({
      booking_id: bookingId,
      date: m.date,
      meal_type: m.meal_type,
      adults: m.adults,
      children: m.children,
      adult_price: m.adult_price,
      child_price: m.child_price,
      total_price: (m.adults * m.adult_price) + (m.children * m.child_price)
    }))
    
    const { error: mealError } = await supabase
      .from('booking_meals')
      .insert(mealData)
    
    if (mealError) {
      console.error('Error adding meals:', mealError)
    }
  }
  
  // Add transfers if any
  if (input.transfers && input.transfers.length > 0) {
    const transferData = input.transfers.map(t => ({
      booking_id: bookingId,
      transfer_type: t.transfer_type,
      date: t.date,
      time: t.time,
      flight_number: t.flight_number,
      passengers: t.passengers,
      price: t.price
    }))
    
    const { error: transferError } = await supabase
      .from('booking_transfers')
      .insert(transferData)
    
    if (transferError) {
      console.error('Error adding transfers:', transferError)
    }
  }
  
  revalidatePath('/admin/bookings')
  revalidatePath('/properties')
  
  return { 
    data: { 
      id: bookingId, 
      booking_reference: bookingReference 
    }, 
    error: null 
  }
}

// ============================================
// PAYMENT CONFIRMATION
// ============================================

export async function confirmBookingPayment(
  bookingId: string,
  paymentDetails: {
    payment_method: string
    payment_reference: string
    amount_paid: number
  }
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'deposit_paid',
      payment_method: paymentDetails.payment_method,
      payment_reference: paymentDetails.payment_reference,
      deposit_paid_at: new Date().toISOString()
    })
    .eq('id', bookingId)
  
  if (error) {
    console.error('Error confirming payment:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/bookings')
  return { error: null }
}

// ============================================
// GET PROPERTY SERVICE PRICING
// ============================================

export async function getPropertyServicePricingPublic(propertyId: string): Promise<{
  data: {
    breakfastAdultPrice: number
    breakfastChildPrice: number
    breakfastChildAgeLimit: number
    lunchAdultPrice: number
    lunchChildPrice: number
    dinnerAdultPrice: number
    dinnerChildPrice: number
    transferArrivalPrice: number
    transferDeparturePrice: number
    transferRoundTripPrice: number
    transferVehicleCapacity: number
    extraBedPrice: number
    cribPrice: number
  } | null
  error: string | null
}> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_service_pricing')
    .select('*')
    .eq('property_id', propertyId)
    .single()
  
  if (error) {
    // If no pricing found, return defaults
    if (error.code === 'PGRST116') {
      return {
        data: {
          breakfastAdultPrice: 15,
          breakfastChildPrice: 8,
          breakfastChildAgeLimit: 12,
          lunchAdultPrice: 25,
          lunchChildPrice: 15,
          dinnerAdultPrice: 35,
          dinnerChildPrice: 20,
          transferArrivalPrice: 25,
          transferDeparturePrice: 25,
          transferRoundTripPrice: 40,
          transferVehicleCapacity: 4,
          extraBedPrice: 20,
          cribPrice: 10
        },
        error: null
      }
    }
    return { data: null, error: error.message }
  }
  
  return {
    data: {
      breakfastAdultPrice: data.breakfast_adult_price || 15,
      breakfastChildPrice: data.breakfast_child_price || 8,
      breakfastChildAgeLimit: data.breakfast_child_age_limit || 12,
      lunchAdultPrice: data.lunch_adult_price || 25,
      lunchChildPrice: data.lunch_child_price || 15,
      dinnerAdultPrice: data.dinner_adult_price || 35,
      dinnerChildPrice: data.dinner_child_price || 20,
      transferArrivalPrice: data.transfer_arrival_price || 25,
      transferDeparturePrice: data.transfer_departure_price || 25,
      transferRoundTripPrice: data.transfer_round_trip_price || 40,
      transferVehicleCapacity: data.transfer_vehicle_capacity || 4,
      extraBedPrice: data.extra_bed_price || 20,
      cribPrice: data.crib_price || 10
    },
    error: null
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateBookingReference(): string {
  const prefix = 'MRR'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
