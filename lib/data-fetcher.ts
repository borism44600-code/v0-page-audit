/**
 * Data fetching utilities for public pages (SERVER-ONLY)
 * Fetches from database and falls back to mock data if needed
 * 
 * WARNING: This file uses next/headers and can ONLY be imported in Server Components.
 * For client components, use @/lib/data-fetcher-client instead
 */

import { createClient } from '@/lib/supabase/server'
import { adaptPropertiesToUi, adaptPropertyToUi, type DbProperty, type UiProperty } from '@/lib/adapters/property-adapter'
import { mockProperties, mockPartners, mockServices, mockAddons } from '@/lib/data'

/**
 * Helper to convert mock property to UiProperty format
 * Ensures consistent shape between DB and mock data
 */
/**
 * Convert mock property to canonical UiProperty format.
 * GUARANTEES all fields have TRUTHFUL safe defaults - no fake content.
 * Empty arrays mean "no data" - UI shows premium empty states.
 */
function mockToUiProperty(mock: typeof mockProperties[0]): UiProperty {
  return {
    id: mock.id,
    title: mock.title || 'Untitled Property',
    subtitle: '',
    shortDescription: mock.shortDescription || '',
    description: mock.description || '',
    type: (mock.type || 'riad') as 'riad' | 'villa' | 'apartment',
    pricePerNight: mock.pricePerNight || 0,
    numberOfBedrooms: mock.numberOfBedrooms || 1,
    numberOfBathrooms: mock.numberOfBathrooms || 1,
    bedroomGuestCapacity: mock.bedroomGuestCapacity || mock.numberOfBedrooms * 2,
    additionalGuestCapacity: mock.additionalGuestCapacity || 0,
    totalGuestCapacity: mock.totalGuestCapacity || mock.numberOfBedrooms * 2,
    images: mock.images || [],  // GUARANTEED: array (may be empty - no fake images)
    location: {  // GUARANTEED: object with all fields
      city: 'Marrakech',
      district: mock.location?.district || 'Medina',
      subDistrict: mock.location?.subDistrict || '',
      address: '',
      nearbyInfo: '',
      mapLocation: '',
      distanceFromCenter: mock.location?.distanceFromCenter || '',
      coordinates: null
    },
    sleepingArrangements: (mock.sleepingArrangements || []).map(s => ({  // GUARANTEED: array
      id: s.id || crypto.randomUUID(),
      name: s.name || 'Bedroom',
      bedTypes: (s.beds || []).map(b => ({
        type: (b.type || 'double') as 'king' | 'queen' | 'double' | 'single' | 'sofa_bed' | 'bunk',
        quantity: b.quantity || 1
      })),
      bathroom: {
        hasPrivate: s.bathroom?.hasPrivate || false,
        hasShower: s.bathroom?.hasShower || false,
        hasBathtub: s.bathroom?.hasBathtub || false
      }
    })),
    features: mock.features || {},  // GUARANTEED: object
    amenities: mock.amenities || [],  // GUARANTEED: array
    parking: {  // GUARANTEED: object with all fields
      available: mock.parking?.available || false,
      type: mock.parking?.type || '',
      spots: mock.parking?.spots || 0,
      notes: mock.parking?.notes || ''
    },
    featured: mock.featured || false
  }
}

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
      // Fall back to mock data (adapted to UiProperty format)
      return mockProperties.map(mockToUiProperty)
    }
    
    if (!data || data.length === 0) {
      // No database properties yet, use mock data (adapted to UiProperty format)
      return mockProperties.map(mockToUiProperty)
    }
    
    return adaptPropertiesToUi(data as DbProperty[])
  } catch (error) {
    console.error('Error in fetchPublishedProperties:', error)
    return mockProperties.map(mockToUiProperty)
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
      // Try mock data (adapted to UiProperty format)
      const mockProperty = mockProperties.find(p => p.id === idOrSlug || p.slug === idOrSlug)
      return mockProperty ? mockToUiProperty(mockProperty) : null
    }
    
    return adaptPropertyToUi(data as DbProperty)
  } catch (error) {
    console.error('Error in fetchPropertyByIdOrSlug:', error)
    const mockProperty = mockProperties.find(p => p.id === idOrSlug || p.slug === idOrSlug)
    return mockProperty ? mockToUiProperty(mockProperty) : null
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
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return mockPartners
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
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return mockServices
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
    return mockServices
  }
}

/**
 * Fetch add-ons
 */
export async function fetchAddons() {
  return mockAddons
}

// Aliases for backward compatibility
export const getPublicProperties = fetchPublishedProperties
export const getPublicPropertyBySlug = fetchPropertyByIdOrSlug
export const getPropertyBySlug = fetchPropertyByIdOrSlug
export const getPublishedPartners = fetchPublishedPartners
