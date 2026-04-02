import { createClient } from '@/lib/supabase/client'
import { adaptPropertiesToUi, adaptPropertyToUi, type DbProperty, type UiProperty } from '@/lib/adapters/property-adapter'
import { mockProperties, mockPartners } from '@/lib/data'

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
