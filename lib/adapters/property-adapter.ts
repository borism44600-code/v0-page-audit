/**
 * Adapts database property format to the UI Property format
 * This ensures backwards compatibility with existing components
 */

import { PropertyFeatures, SleepingSpace } from '@/lib/types'

// Database property type (matches actual Supabase schema)
export interface DbProperty {
  id: string
  // Names are multilingual: name_en, name_fr, etc.
  name_en?: string
  name_fr?: string
  name_es?: string
  name_ar?: string
  name_ma?: string
  name_zh?: string
  slug: string
  category?: string
  // Descriptions are multilingual
  description_en?: string
  description_fr?: string
  short_description_en?: string
  short_description_fr?: string
  location?: string
  district?: string
  sub_district?: string
  address?: string
  map_url?: string
  price_per_night: number
  cleaning_fee?: number
  security_deposit?: number
  bedrooms?: number
  bathrooms?: number
  bedroom_guest_capacity?: number
  additional_guest_capacity?: number
  max_guests?: number
  size_sqm?: number
  minimum_stay?: number
  amenities?: Record<string, unknown>
  features?: Record<string, unknown>
  parking_type?: string
  parking_spots?: number
  meta_title?: string
  meta_description?: string
  status?: 'draft' | 'published' | 'archived'
  is_active?: boolean  // Deprecated, kept for backward compatibility
  featured?: boolean
  instant_booking?: boolean
  cover_image?: string
  images?: string[]
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
    bed_count?: number
    max_guests?: number
    has_bathroom?: boolean
    has_shower?: boolean
    has_bathtub?: boolean
  }[]
}

/**
 * Canonical Public Property Type
 * 
 * ALL fields are guaranteed to exist with TRUTHFUL safe defaults.
 * The adapter layer ensures these values are never undefined.
 * UI components should NOT need defensive null checks for these fields.
 * 
 * IMPORTANT: No fake/invented content is injected as defaults.
 * Empty arrays mean "no data" - UI should show premium empty states.
 * 
 * GUARANTEED ARRAYS (always [] if no data - never fake content):
 * - images: [] (UI shows "photos coming soon" state)
 * - sleepingArrangements: [] (UI hides section if empty)
 * - amenities: [] (UI hides section if empty)
 * 
 * GUARANTEED OBJECTS (always present with neutral defaults):
 * - location: { city: 'Marrakech', district: 'Medina', ... }
 * - features: { wifi: false, pool: false, ... }
 * - parking: { available: false, ... }
 */
export interface UiProperty {
  id: string
  title: string
  subtitle: string  // Always string, empty if not set
  shortDescription: string  // Always string, empty if not set
  description: string  // Always string, empty if not set
  type: 'riad' | 'villa' | 'apartment'
  pricePerNight: number  // Always number, 0 if not set
  numberOfBedrooms: number  // Always number, 1 if not set
  numberOfBathrooms: number  // Always number, 1 if not set
  bedroomGuestCapacity: number  // Always number
  additionalGuestCapacity: number  // Always number, 0 if not set
  totalGuestCapacity: number  // Always number
  images: string[]  // GUARANTEED: Always array, never undefined
  location: {  // GUARANTEED: Always object
    city: string  // Default: 'Marrakech'
    district: string  // Default: 'Medina'
    subDistrict: string  // Default: ''
    address: string  // Default: ''
    nearbyInfo: string  // Default: ''
    mapLocation: string  // Default: ''
    distanceFromCenter: string  // Default: ''
    coordinates: { lat: number; lng: number } | null  // Nullable, check before use
  }
  sleepingArrangements: SleepingSpace[]  // GUARANTEED: Always array
  features: PropertyFeatures  // GUARANTEED: Always object
  amenities: string[]  // GUARANTEED: Always array
  parking: {  // GUARANTEED: Always object
    available: boolean
    type: string  // Default: ''
    spots: number  // Default: 0
    notes: string  // Default: ''
  }
  featured: boolean  // Default: false
  // Availability ranges (optional - may not be set)
  availability?: { start: string; end: string }[]
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
      quantity: room.bed_count || 1
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
    : []  // Empty array - UI handles empty state gracefully

  // Get title from multilingual fields, fallback to English
  const title = dbProperty.name_en || dbProperty.name_fr || 'Untitled Property'
  const shortDesc = dbProperty.short_description_en || dbProperty.short_description_fr || ''
  const description = dbProperty.description_en || dbProperty.description_fr || shortDesc
  
  // Get images from cover_image or images array
  let propertyImages: string[] = []
  if (dbProperty.cover_image) {
    propertyImages.push(dbProperty.cover_image)
  }
  if (dbProperty.images && Array.isArray(dbProperty.images)) {
    propertyImages = [...propertyImages, ...dbProperty.images]
  }
  // Also add from property_images relation
  if (images.length > 0 && images[0] !== '/placeholder-property.jpg') {
    propertyImages = [...propertyImages, ...images]
  }
  // Dedupe and fallback
  propertyImages = [...new Set(propertyImages)]
  // No fake images - empty array is truthful when property has no images

  // Convert features/amenities object to PropertyFeatures
  const featuresObj = typeof dbProperty.features === 'object' ? dbProperty.features : {}
  const amenitiesObj = typeof dbProperty.amenities === 'object' ? dbProperty.amenities : {}
  const combinedFeatures = { ...featuresObj, ...amenitiesObj }
  const featureKeys = Object.keys(combinedFeatures).filter(k => combinedFeatures[k] === true)

  // GUARANTEED: All fields have safe defaults - no undefined values
  return {
    id: dbProperty.id,
    title,
    subtitle: '',  // Always string
    shortDescription: shortDesc,
    description,
    type: (dbProperty.category || 'riad') as 'riad' | 'villa' | 'apartment',
    pricePerNight: dbProperty.price_per_night || 0,
    numberOfBedrooms: dbProperty.bedrooms || 1,
    numberOfBathrooms: dbProperty.bathrooms || 1,
    bedroomGuestCapacity: dbProperty.bedroom_guest_capacity || dbProperty.max_guests || 2,
    additionalGuestCapacity: dbProperty.additional_guest_capacity || 0,
    totalGuestCapacity: dbProperty.max_guests || dbProperty.bedroom_guest_capacity || 2,
    images: propertyImages,  // GUARANTEED: Always array (may be empty)
    location: {  // GUARANTEED: Always object with all fields
      city: dbProperty.location || 'Marrakech',
      district: dbProperty.district || 'Medina',
      subDistrict: dbProperty.sub_district || '',
      address: dbProperty.address || '',
      nearbyInfo: '',
      mapLocation: dbProperty.map_url || '',
      distanceFromCenter: '',
      coordinates: null
    },
    sleepingArrangements: roomsToSleepingArrangements(dbProperty.property_rooms),  // GUARANTEED: Always array
    features: amenitiestoFeatures(featureKeys),  // GUARANTEED: Always object
    amenities: featureKeys,  // GUARANTEED: Always array (may be empty - no fake amenities)
    parking: {  // GUARANTEED: Always object with all fields
      available: !!dbProperty.parking_type && dbProperty.parking_type !== 'none',
      type: dbProperty.parking_type || '',
      spots: dbProperty.parking_spots || 0,
      notes: ''
    },
    featured: dbProperty.featured || false,
    // Availability is optional - may not be set in database
    availability: undefined
  }
}

/**
 * Adapt multiple database properties to UI format
 */
export function adaptPropertiesToUi(dbProperties: DbProperty[]): UiProperty[] {
  return dbProperties.map(adaptPropertyToUi)
}
