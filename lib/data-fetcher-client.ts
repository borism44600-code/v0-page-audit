import { createClient } from '@/lib/supabase/client'
import { adaptPropertiesToUi, adaptPropertyToUi, type DbProperty, type UiProperty } from '@/lib/adapters/property-adapter'
import { mockProperties, mockPartners } from '@/lib/data'

/**
 * Helper to convert mock property to UiProperty format
 * Ensures consistent shape between DB and mock data
 */
function mockToUiProperty(mock: typeof mockProperties[0]): UiProperty {
  return {
    id: mock.id,
    title: mock.title,
    subtitle: '',
    shortDescription: mock.shortDescription,
    description: mock.description,
    type: mock.type as 'riad' | 'villa' | 'apartment',
    pricePerNight: mock.pricePerNight,
    numberOfBedrooms: mock.numberOfBedrooms,
    numberOfBathrooms: mock.numberOfBathrooms,
    bedroomGuestCapacity: mock.bedroomGuestCapacity || mock.numberOfBedrooms * 2,
    additionalGuestCapacity: mock.additionalGuestCapacity || 0,
    totalGuestCapacity: mock.totalGuestCapacity,
    images: mock.images,
    location: {
      city: 'Marrakech',
      district: mock.location.district,
      subDistrict: mock.location.subDistrict,
      distanceFromCenter: mock.location.distanceFromCenter
    },
    sleepingArrangements: (mock.sleepingArrangements || []).map(s => ({
      id: s.id || crypto.randomUUID(),
      name: s.name,
      bedTypes: (s.beds || []).map(b => ({
        type: b.type as 'king' | 'queen' | 'double' | 'single' | 'sofa_bed' | 'bunk',
        quantity: b.quantity
      })),
      bathroom: {
        hasPrivate: s.bathroom?.hasPrivate || false,
        hasShower: s.bathroom?.hasShower || false,
        hasBathtub: s.bathroom?.hasBathtub || false
      }
    })),
    features: mock.features,
    amenities: mock.amenities || [],
    parking: mock.parking || { available: false },
    featured: mock.featured
  }
}

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
      return mockProperties.map(mockToUiProperty)
    }
    return adaptPropertiesToUi(data as DbProperty[])
  } catch {
    return mockProperties.map(mockToUiProperty)
  }
}

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
      const mock = mockProperties.find(p => p.id === idOrSlug || p.slug === idOrSlug)
      return mock ? mockToUiProperty(mock) : null
    }
    return adaptPropertyToUi(data as DbProperty)
  } catch {
    const mock = mockProperties.find(p => p.id === idOrSlug || p.slug === idOrSlug)
    return mock ? mockToUiProperty(mock) : null
  }
}

export async function fetchPublishedPartnersClient() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return mockPartners
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
    return mockPartners
  }
}

export const getPublicPropertiesClient = fetchPublishedPropertiesClient
export const getPropertyBySlugClient = fetchPropertyByIdOrSlugClient
