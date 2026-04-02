/**
 * Data fetching utilities for public pages (SERVER-ONLY)
 * Fetches from database ONLY - no mock/demo fallbacks for user-facing flows.
 * 
 * RUNTIME POLICY: Return empty arrays or null when no real data exists.
 * UI components must render premium empty states instead of fake content.
 * 
 * WARNING: This file uses next/headers and can ONLY be imported in Server Components.
 * For client components, use @/lib/data-fetcher-client instead
 */

import { createClient } from '@/lib/supabase/server'
import { adaptPropertiesToUi, adaptPropertyToUi, type DbProperty, type UiProperty } from '@/lib/adapters/property-adapter'

/**
 * Fetch all published properties for public pages
 * Returns empty array if no properties exist - NEVER returns mock data
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
          bed_count,
          max_guests,
          has_bathroom,
          has_shower,
          has_bathtub
        )
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching properties:', error)
      return []  // Return empty array, not mock data
    }
    
    if (!data || data.length === 0) {
      return []  // No properties yet - UI shows premium empty state
    }
    
    return adaptPropertiesToUi(data as DbProperty[])
  } catch (error) {
    console.error('Error in fetchPublishedProperties:', error)
    return []  // Return empty array on error
  }
}

/**
 * Fetch a single property by ID or slug
 * Returns null if not found - NEVER returns mock data
 */
export async function fetchPropertyByIdOrSlug(idOrSlug: string): Promise<UiProperty | null> {
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
          bed_count,
          max_guests,
          has_bathroom,
          has_shower,
          has_bathtub
        )
      `)
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .eq('status', 'published')
      .single()
    
    if (error || !data) {
      return null  // Property not found - no mock fallback
    }
    
    return adaptPropertyToUi(data as DbProperty)
  } catch (error) {
    console.error('Error in fetchPropertyByIdOrSlug:', error)
    return null  // Return null on error
  }
}

/**
 * Fetch all published partners
 * Returns empty array if no partners exist - NEVER returns mock data
 */
export async function fetchPublishedPartners() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return []  // No partners - UI shows premium empty state
    }
    
    // Adapt to expected format
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
  } catch (error) {
    console.error('Error in fetchPublishedPartners:', error)
    return []
  }
}

/**
 * Fetch services
 * Returns empty array if no services exist - NEVER returns mock data
 */
export async function fetchServices() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return []  // No services - UI shows premium empty state
    }
    
    // Adapt to expected format
    return data.map(s => ({
      id: s.id,
      name: s.name_en || s.name_fr || s.name,
      category: s.category,
      description: s.description_en || s.description_fr || '',
      price: s.price,
      priceType: s.price_unit
    }))
  } catch (error) {
    console.error('Error in fetchServices:', error)
    return []
  }
}

/**
 * Fetch add-ons
 * Returns empty array - NEVER returns mock data
 */
export async function fetchAddons() {
  // TODO: Implement when add-ons table exists
  return []
}

// Aliases for backward compatibility
export const getPublicProperties = fetchPublishedProperties
export const getPublicPropertyBySlug = fetchPropertyByIdOrSlug
export const getPropertyBySlug = fetchPropertyByIdOrSlug
export const getPublishedPartners = fetchPublishedPartners
