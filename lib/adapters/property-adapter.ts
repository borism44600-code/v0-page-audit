/**
 * Adapts database property format to the UI Property format
 * This ensures backwards compatibility with existing components
 */

import { PropertyFeatures, SleepingSpace } from '@/lib/types'

// Database property type
export interface DbProperty {
  id: string
  title: string
  slug: string
  type: string
  description_short?: string
  description_long?: string
  city: string
  district?: string
  address?: string
  map_location?: string
  price_per_night: number
  cleaning_fee?: number
  service_fee?: number
  num_bedrooms: number
  num_bathrooms: number
  bedroom_guest_capacity?: number
  additional_guest_capacity?: number
  total_guest_capacity: number
  amenities?: string[]
  parking_type?: string
  parking_spots?: number
  parking_notes?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  status: string
  featured?: boolean
  created_at?: string
  updated_at?: string
  property_images?: {
    id: string
    image_url: string
    alt_text?: string
    is_cover: boolean
    display_order: number
  }[]
  property_rooms?: {
    id: string
    room_name: string
    room_number?: number
    bed_type?: string
    num_beds?: number
    has_bathroom?: boolean
    has_shower?: boolean
    has_bathtub?: boolean
    equipment?: string[]
  }[]
}

// UI property type (matching existing mockProperties format)
export interface UiProperty {
  id: string
  title: string
  subtitle?: string
  shortDescription: string
  description: string
  type: 'riad' | 'villa' | 'apartment'
  pricePerNight: number
  numberOfBedrooms: number
  numberOfBathrooms: number
  bedroomGuestCapacity: number
  additionalGuestCapacity: number
  totalGuestCapacity: number
  images: string[]
  location: {
    city: string
    district: string
    subDistrict?: string
    address?: string
    nearbyInfo?: string
    mapLocation?: string
    coordinates?: { lat: number; lng: number }
  }
  sleepingArrangements: SleepingSpace[]
  features: PropertyFeatures
  parking: {
    available: boolean
    type?: string
    spots?: number
    notes?: string
  }
  featured: boolean
}

// Default features (all false)
const defaultFeatures: PropertyFeatures = {
  heatedPool: false,
  unheatedPool: false,
  heatedPlungePool: false,
  unheatedPlungePool: false,
  jacuzzi: false,
  hammam: false,
  bathtub: false,
  fireplace: false,
  terrace: false,
  rooftop: false,
  privateTerminate: false,
  wifi: true,
  airConditioning: true,
  breakfastPossible: false,
  mealsPossible: false,
  airportTransferPossible: false,
  privateDriverPossible: false,
  excursionsPossible: false,
  gasStove: false,
  washingMachine: false,
  iron: false,
  dishwasher: false,
  oven: false,
  coffeeMachine: false,
  fridge: false,
  mountainView: false,
  koutboubiaView: false,
  mouleyYazidView: false,
  monumentsView: false,
  souks: false,
}

/**
 * Convert amenities array to features object
 */
function amenitiestoFeatures(amenities: string[] = []): PropertyFeatures {
  const features = { ...defaultFeatures }
  
  for (const amenity of amenities) {
    if (amenity in features) {
      (features as Record<string, boolean>)[amenity] = true
    }
  }
  
  return features
}

/**
 * Convert database rooms to sleeping arrangements
 */
function roomsToSleepingArrangements(rooms: DbProperty['property_rooms'] = []): SleepingSpace[] {
  return rooms.map((room, index) => ({
    id: room.id,
    name: room.room_name || `Bedroom ${index + 1}`,
    bedTypes: room.bed_type ? [{
      type: room.bed_type as 'king' | 'queen' | 'double' | 'single' | 'sofa_bed' | 'bunk',
      quantity: room.num_beds || 1
    }] : [],
    bathroom: {
      hasPrivate: room.has_bathroom || false,
      hasShower: room.has_shower || false,
      hasBathtub: room.has_bathtub || false
    }
  }))
}

/**
 * Adapt a database property to UI format
 */
export function adaptPropertyToUi(dbProperty: DbProperty): UiProperty {
  // Get cover image or first image, fallback to placeholder
  const sortedImages = (dbProperty.property_images || [])
    .sort((a, b) => {
      if (a.is_cover) return -1
      if (b.is_cover) return 1
      return a.display_order - b.display_order
    })
  
  const images = sortedImages.length > 0 
    ? sortedImages.map(img => img.image_url)
    : ['/placeholder-property.jpg']

  return {
    id: dbProperty.id,
    title: dbProperty.title,
    subtitle: '',
    shortDescription: dbProperty.description_short || '',
    description: dbProperty.description_long || dbProperty.description_short || '',
    type: (dbProperty.type || 'riad') as 'riad' | 'villa' | 'apartment',
    pricePerNight: dbProperty.price_per_night,
    numberOfBedrooms: dbProperty.num_bedrooms,
    numberOfBathrooms: dbProperty.num_bathrooms,
    bedroomGuestCapacity: dbProperty.bedroom_guest_capacity || dbProperty.total_guest_capacity,
    additionalGuestCapacity: dbProperty.additional_guest_capacity || 0,
    totalGuestCapacity: dbProperty.total_guest_capacity,
    images,
    location: {
      city: dbProperty.city || 'Marrakech',
      district: dbProperty.district || 'Medina',
      address: dbProperty.address,
      mapLocation: dbProperty.map_location
    },
    sleepingArrangements: roomsToSleepingArrangements(dbProperty.property_rooms),
    features: amenitiestoFeatures(dbProperty.amenities),
    parking: {
      available: !!dbProperty.parking_type && dbProperty.parking_type !== 'none',
      type: dbProperty.parking_type,
      spots: dbProperty.parking_spots,
      notes: dbProperty.parking_notes
    },
    featured: dbProperty.featured || false
  }
}

/**
 * Adapt multiple database properties to UI format
 */
export function adaptPropertiesToUi(dbProperties: DbProperty[]): UiProperty[] {
  return dbProperties.map(adaptPropertyToUi)
}
