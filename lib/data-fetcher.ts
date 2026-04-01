/**
 * Data fetching utilities for public pages
 * Fetches from database and falls back to mock data if needed
 */

import { createClient } from '@/lib/supabase/server'
import { adaptPropertiesToUi, adaptPropertyToUi, type DbProperty, type UiProperty } from '@/lib/adapters/property-adapter'
import { mockProperties, mockPartners, mockServices, mockAddons } from '@/lib/data'

/**
 * Fetch all published properties for public pages
 */
export async function fetchPublishedProperties(): Promise<UiProperty[]> {
  try {
    const supabase = await createClient()
    
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
      // Fall back to mock data
      return mockProperties
    }
    
    if (!data || data.length === 0) {
      // No database properties yet, use mock data
      return mockProperties
    }
    
    return adaptPropertiesToUi(data as DbProperty[])
  } catch (error) {
    console.error('Error in fetchPublishedProperties:', error)
    return mockProperties
  }
}

/**
 * Fetch a single property by ID or slug
 */
export async function fetchPropertyByIdOrSlug(idOrSlug: string): Promise<UiProperty | null> {
  try {
    const supabase = await createClient()
    
    // Try to fetch by ID first
    let { data, error } = await supabase
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
      // Try mock data
      const mockProperty = mockProperties.find(p => p.id === idOrSlug)
      return mockProperty || null
    }
    
    return adaptPropertyToUi(data as DbProperty)
  } catch (error) {
    console.error('Error in fetchPropertyByIdOrSlug:', error)
    const mockProperty = mockProperties.find(p => p.id === idOrSlug)
    return mockProperty || null
  }
}

/**
 * Fetch all published partners
 */
export async function fetchPublishedPartners() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('name', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return mockPartners
    }
    
    // Adapt to expected format
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
    console.error('Error in fetchPublishedPartners:', error)
    return mockPartners
  }
}

/**
 * Fetch services
 */
export async function fetchServices() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .is('property_id', null)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return mockServices
    }
    
    // Adapt to expected format
    return data.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description || '',
      price: s.price,
      priceType: s.price_type
    }))
  } catch (error) {
    console.error('Error in fetchServices:', error)
    return mockServices
  }
}

/**
 * Fetch add-ons
 */
export async function fetchAddons() {
  return mockAddons
}
