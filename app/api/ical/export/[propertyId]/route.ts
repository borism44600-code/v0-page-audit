import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateICalContent, BookedPeriod } from '@/lib/ical'

export const runtime = 'nodejs'

// Create Supabase client for server-side API route
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params
    
    // Remove .ics extension if present
    const cleanPropertyId = propertyId.replace(/\.ics$/, '')

    const supabase = getSupabase()
    
    // Find the property from database
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, name_en, slug')
      .eq('id', cleanPropertyId)
      .single()
    
    if (propError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Get bookings for this property from database
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, guest_name, status')
      .eq('property_id', cleanPropertyId)
      .in('status', ['confirmed', 'pending'])
    
    const bookings: BookedPeriod[] = (bookingsData || []).map(b => ({
      start: new Date(b.check_in),
      end: new Date(b.check_out),
      source: 'platform' as const,
      bookingId: b.id,
      guestName: b.guest_name || undefined
    }))

    // Get the base URL from the request
    const baseUrl = request.nextUrl.origin

    // Generate the ICS content - adapt property to expected format
    const propertyForIcal = {
      id: property.id,
      title: property.name_en || 'Property',
      slug: property.slug
    }
    const icsContent = generateICalContent(propertyForIcal, bookings, baseUrl)

    const filename = (property.name_en || 'property').replace(/[^a-z0-9]/gi, '-').toLowerCase()
    
    // Return as downloadable ICS file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}-calendar.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('iCal export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}
