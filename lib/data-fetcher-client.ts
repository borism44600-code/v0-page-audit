/**
 * Client-safe data fetching utilities
 * Uses the browser Supabase client instead of server client
 */

import { createClient } from '@/lib/supabase/client'
import { adaptPropertiesToUi, adaptPropertyToUi, type DbProperty, type UiProperty } from '@/lib/adapters/property-adapter'
import { mockProperties, mockPartners } from '@/lib/data'

/**
 * Fetch all published properties (client-safe)
 */
export async function fetchPublishedPropertiesClient(): Promise<UiProperty[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (
          id,
          image_url,
          alt_text,
          display_order,
          is_cover
        ),
        property_rooms (
          id,
          room_name,
          room_number,
          bed_type,
          num_beds,
          has_bathroom,
          has_shower,
          has_bathtub,
          equipment
        )
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching properties:', error)
      return mockProperties
    }
    
    if (!data || data.length === 0) {
      return mockProperties
    }
    
    return adaptPropertiesToUi(data as DbProperty[])
  } catch (error) {
    console.error('Error in fetchPublishedPropertiesClient:', error)
    return mockProperties
  }
}

/**
 * Fetch a single property by ID or slug (client-safe)
 */
export async function fetchPropertyByIdOrSlugClient(idOrSlug: string): Promise<UiProperty | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (
          id,
          image_url,
          alt_text,
          display_order,
          is_cover
        ),
        property_rooms (
          id,
          room_name,
          room_number,
          bed_type,
          num_beds,
          has_bathroom,
          has_shower,
          has_bathtub,
          equipment
        )
      `)
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .eq('status', 'published')
      .single()
    
    if (error || !data) {
      const mockProperty = mockProperties.find(p => p.id === idOrSlug || p.slug === idOrSlug)
      return mockProperty || null
    }
    
    return adaptPropertyToUi(data as DbProperty)
  } catch (error) {
    console.error('Error in fetchPropertyByIdOrSlugClient:', error)
    const mockProperty = mockProperties.find(p => p.id === idOrSlug || p.slug === idOrSlug)
    return mockProperty || null
  }
}

/**
 * Fetch all published partners (client-safe)
 */
export async function fetchPublishedPartnersClient() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('name', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return mockPartners
    }
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description_long || p.description_short || '',
      image: p.image_url || '/placeholder-partner.jpg',
      website: p.website,
      discountCode: undefined,
      bookingProcedure: p.booking_url ? `Book at ${p.booking_url}` : undefined
    }))
  } catch (error) {
    console.error('Error in fetchPublishedPartnersClient:', error)
    return mockPartners
  }
}

// Aliases for convenience
export const getPublicPropertiesClient = fetchPublishedPropertiesClient
export const getPropertyBySlugClient = fetchPropertyByIdOrSlugClient
