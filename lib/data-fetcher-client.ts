/**
 * Data fetching utilities for CLIENT components
 * Fetches from database ONLY - no mock/demo fallbacks for user-facing flows.
 * 
 * RUNTIME POLICY: Return empty arrays or null when no real data exists.
 * UI components must render premium empty states instead of fake content.
 */

import { createClient } from '@/lib/supabase/client'
import { adaptPropertiesToUi, adaptPropertyToUi, type DbProperty, type UiProperty } from '@/lib/adapters/property-adapter'

/**
 * Fetch all published properties (client-side)
 * Returns empty array if no properties exist - NEVER returns mock data
 */
export async function fetchPublishedPropertiesClient(): Promise<UiProperty[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (id, image_url, alt_text, display_order, is_cover),
        property_rooms (id, room_name, room_number, bed_type, bed_count, max_guests, has_bathroom, has_shower, has_bathtub)
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error || !data || data.length === 0) {
      return []  // No properties - UI shows premium empty state
    }
    return adaptPropertiesToUi(data as DbProperty[])
  } catch {
    return []  // Return empty array on error
  }
}

/**
 * Fetch a single property by ID or slug (client-side)
 * Returns null if not found - NEVER returns mock data
 */
export async function fetchPropertyByIdOrSlugClient(idOrSlug: string): Promise<UiProperty | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_images (id, image_url, alt_text, display_order, is_cover),
        property_rooms (id, room_name, room_number, bed_type, bed_count, max_guests, has_bathroom, has_shower, has_bathtub)
      `)
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .eq('status', 'published')
      .single()
    
    if (error || !data) {
      return null  // Property not found - no mock fallback
    }
    return adaptPropertyToUi(data as DbProperty)
  } catch {
    return null  // Return null on error
  }
}

/**
 * Fetch all published partners (client-side)
 * Returns empty array if no partners exist - NEVER returns mock data
 */
export async function fetchPublishedPartnersClient() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return []  // No partners - UI shows premium empty state
    }
    return data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description_en || p.description_fr || '',
      image: p.image || '/placeholder-partner.jpg',
      website: p.website,
      discountCode: p.discount,
      bookingProcedure: undefined
    }))
  } catch {
    return []
  }
}

// Aliases for backward compatibility
export const getPublicPropertiesClient = fetchPublishedPropertiesClient
export const getPropertyBySlugClient = fetchPropertyByIdOrSlugClient
