import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPropertyServicePricing, getBookingServices } from '@/app/admin/services/actions'
import { BookingServicesClient } from './client'

// Server component that fetches real data
export default async function BookingServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch the real booking from database
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      properties (
        id,
        name_en,
        name_fr,
        slug
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !booking) {
    notFound()
  }
  
  // Fetch property service pricing
  const servicePricing = await getPropertyServicePricing(booking.property_id)
  
  // Fetch existing booked services
  const bookedServices = await getBookingServices(id)
  
  // Transform booking data for the client
  const bookingData = {
    id: booking.id,
    propertyId: booking.property_id,
    propertyName: booking.properties?.name_en || booking.properties?.name_fr || 'Property',
    propertySlug: booking.properties?.slug || '',
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    guests: {
      adults: booking.adults || 1,
      children: booking.children || 0
    },
    status: booking.status,
    // Service totals from booking
    breakfastTotal: booking.breakfast_total || 0,
    mealsTotal: booking.meals_total || 0,
    transfersTotal: booking.transfers_total || 0,
    extrasTotal: booking.extras_total || 0,
    servicesTotal: booking.services_total || 0
  }
  
  // Default pricing if not configured
  const pricing = servicePricing || {
    breakfast_available: false,
    breakfast_adult_price: 15,
    breakfast_child_price: 8,
    breakfast_child_age_limit: 12,
    lunch_available: false,
    lunch_adult_price: 25,
    lunch_child_price: 15,
    dinner_available: false,
    dinner_adult_price: 40,
    dinner_child_price: 20,
    transfer_available: false,
    transfer_arrival_price: 25,
    transfer_departure_price: 25,
    transfer_roundtrip_price: 45,
    transfer_max_passengers: 6,
    transfer_vehicle_type: 'Standard',
    extra_bed_available: false,
    extra_bed_price: 30,
    crib_available: false,
    crib_price: 0
  }
  
  return (
    <BookingServicesClient
      booking={bookingData}
      pricing={pricing}
      initialServices={bookedServices}
    />
  )
}
