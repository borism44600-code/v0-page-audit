/**
 * Admin Property Adapter
 * 
 * Centralizes the mapping between Supabase DB columns and Admin UI form fields.
 * This ensures consistency when:
 * - Loading property data into the edit form (DB → UI)
 * - Saving property data from the form (UI → DB)
 * 
 * IMPORTANT: This adapter is specifically for the admin edit/create forms.
 * The public-facing adapter is in lib/adapters/property-adapter.ts
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Raw property data as returned by Supabase (DB column names)
 * Based on actual schema from GetOrRequestIntegration
 */
export interface DbPropertyRaw {
  id: string
  slug: string
  // Multilingual names
  name_en?: string | null
  name_fr?: string | null
  name_es?: string | null
  name_ar?: string | null
  name_ma?: string | null
  name_zh?: string | null
  // Category/type
  category?: string | null
  // Multilingual descriptions
  description_en?: string | null
  description_fr?: string | null
  description_es?: string | null
  description_ar?: string | null
  description_ma?: string | null
  description_zh?: string | null
  short_description_en?: string | null
  short_description_fr?: string | null
  short_description_es?: string | null
  short_description_ar?: string | null
  short_description_ma?: string | null
  short_description_zh?: string | null
  // Location
  location?: string | null
  district?: string | null
  sub_district?: string | null
  address?: string | null
  map_url?: string | null
  // Pricing
  price_per_night?: number | null
  cleaning_fee?: number | null
  security_deposit?: number | null
  // Capacity
  bedrooms?: number | null
  bathrooms?: number | null
  bedroom_guest_capacity?: number | null
  additional_guest_capacity?: number | null
  max_guests?: number | null
  size_sqm?: number | null
  minimum_stay?: number | null
  // Features
  amenities?: Record<string, unknown> | null
  features?: Record<string, unknown> | null
  parking_type?: string | null
  parking_spots?: number | null
  // SEO
  meta_title?: string | null
  meta_description?: string | null
  // Status
  is_active?: boolean | null
  featured?: boolean | null
  instant_booking?: boolean | null
  // Images
  cover_image?: string | null
  images?: string[] | null
  // Timestamps
  created_at?: string | null
  updated_at?: string | null
  // Relations (from joins)
  property_images?: {
    id: string
    image_url: string
    alt_text?: string | null
    caption?: string | null
    is_cover: boolean
    display_order: number
  }[]
  property_rooms?: {
    id: string
    room_name: string
    room_number?: number | null
    bed_type?: string | null
    bed_count?: number | null
    max_guests?: number | null
    has_bathroom?: boolean | null
    has_shower?: boolean | null
    has_bathtub?: boolean | null
  }[]
  availability_sync?: {
    id?: string
    airbnb_ical_url?: string | null
    booking_ical_url?: string | null
    internal_ical_url?: string | null
    vrbo_ical_url?: string | null
    last_sync_at?: string | null
    sync_status?: string | null
  }[]
}

/**
 * Property data as expected by the Admin Edit Form (UI field names)
 * This interface matches PropertyEditFormProps.property
 */
export interface AdminFormProperty {
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
  security_deposit?: number
  // Note: service_fee is NOT in DB schema - marked as non-persisted
  num_bedrooms: number
  num_bathrooms: number
  bedroom_guest_capacity?: number
  additional_guest_capacity?: number
  total_guest_capacity: number
  amenities?: string[]
  parking_type?: string
  parking_spots?: number
  // Note: parking_notes is NOT in DB schema - marked as non-persisted
  seo_title?: string
  seo_description?: string
  // Note: seo_keywords is NOT in DB schema - marked as non-persisted
  status: string // 'draft' | 'published' | 'archived' - derived from is_active
  featured?: boolean
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
  }[]
  availability_sync?: {
    airbnb_ical_url?: string
    booking_ical_url?: string
    internal_ical_url?: string
  }[]
}

// ============================================================================
// DB → UI ADAPTER (for loading data into edit form)
// ============================================================================

/**
 * Converts database property to admin form format
 * Used when loading a property for editing
 */
export function dbToAdminForm(db: DbPropertyRaw): AdminFormProperty {
  // Extract amenities as array from JSONB object
  let amenitiesArray: string[] = []
  if (db.amenities) {
    if (Array.isArray(db.amenities)) {
      amenitiesArray = db.amenities as unknown as string[]
    } else if (typeof db.amenities === 'object' && 'items' in db.amenities) {
      amenitiesArray = (db.amenities as { items: string[] }).items || []
    } else if (typeof db.amenities === 'object') {
      // Extract keys where value is truthy
      amenitiesArray = Object.entries(db.amenities)
        .filter(([, v]) => v === true)
        .map(([k]) => k)
    }
  }

  // Convert is_active boolean to status string
  // Note: DB only has is_active (boolean), not draft/published/archived
  // We interpret: is_active=true → 'published', is_active=false → 'draft'
  // 'archived' is NOT currently supported in DB schema
  const status = db.is_active === true ? 'published' : 'draft'

  // Get availability sync data (first record if array)
  const syncData = Array.isArray(db.availability_sync) && db.availability_sync.length > 0
    ? db.availability_sync[0]
    : null

  return {
    id: db.id,
    // Basic info - use name_en as title, fallback chain
    title: db.name_en || db.name_fr || '',
    slug: db.slug || '',
    type: db.category || 'riad',
    // Descriptions - use English versions
    description_short: db.short_description_en || '',
    description_long: db.description_en || '',
    // Location
    city: db.location || 'Marrakech',
    district: db.district || '',
    address: db.address || '',
    map_location: db.map_url || '',
    // Pricing
    price_per_night: db.price_per_night || 0,
    cleaning_fee: db.cleaning_fee || 0,
    security_deposit: db.security_deposit || 0,
    // Capacity
    num_bedrooms: db.bedrooms || 1,
    num_bathrooms: db.bathrooms || 1,
    bedroom_guest_capacity: db.bedroom_guest_capacity || 2,
    additional_guest_capacity: db.additional_guest_capacity || 0,
    total_guest_capacity: db.max_guests || db.bedroom_guest_capacity || 2,
    // Features
    amenities: amenitiesArray,
    parking_type: db.parking_type || 'none',
    parking_spots: db.parking_spots || 0,
    // SEO
    seo_title: db.meta_title || '',
    seo_description: db.meta_description || '',
    // Status
    status,
    featured: db.featured || false,
    // Relations
    property_images: (db.property_images || []).map(img => ({
      id: img.id,
      image_url: img.image_url,
      alt_text: img.alt_text || '',
      is_cover: img.is_cover,
      display_order: img.display_order
    })),
    property_rooms: (db.property_rooms || []).map(room => ({
      id: room.id,
      room_name: room.room_name,
      room_number: room.room_number || undefined,
      bed_type: room.bed_type || undefined,
      num_beds: room.bed_count || undefined, // DB uses bed_count, form uses num_beds
      has_bathroom: room.has_bathroom || false,
      has_shower: room.has_shower || false,
      has_bathtub: room.has_bathtub || false
    })),
    availability_sync: syncData ? [{
      airbnb_ical_url: syncData.airbnb_ical_url || '',
      booking_ical_url: syncData.booking_ical_url || '',
      internal_ical_url: syncData.internal_ical_url || ''
    }] : []
  }
}

// ============================================================================
// UI → DB ADAPTER (for saving data from form)
// This is handled in app/admin/actions.ts - updatePropertyAction
// The mapping there should match the inverse of dbToAdminForm
// ============================================================================

/**
 * List of fields that exist in the UI but are NOT persisted to the database.
 * These should be clearly marked in the UI.
 */
export const NON_PERSISTED_FIELDS = [
  'service_fee',      // Not in DB schema
  'parking_notes',    // Not in DB schema  
  'seo_keywords',     // Not in DB schema (only meta_title and meta_description exist)
  'subtitle',         // Not in DB schema
  'nearbyInfo',       // Not in DB schema
  'priceDisplayNote', // Not in DB schema
  'currency',         // Not in DB schema (hardcoded to EUR)
] as const

/**
 * List of fields that are partially persisted (only English version saved).
 * Other language versions exist in DB but are not yet editable in admin.
 */
export const PARTIAL_PERSISTED_FIELDS = [
  'title',            // Only name_en is saved, name_fr/es/ar/ma/zh are not editable
  'description_short', // Only short_description_en is saved
  'description_long',  // Only description_en is saved
  'seo_title',        // Only meta_title (no multilingual)
  'seo_description',  // Only meta_description (no multilingual)
] as const

/**
 * Status mapping documentation.
 * DB only has `is_active` (boolean). The UI shows draft/published/archived.
 * 
 * Mapping:
 * - is_active = true  → status = 'published'
 * - is_active = false → status = 'draft'
 * - 'archived' status is NOT supported in current DB schema
 *   (would need a separate `is_archived` column or enum)
 */
export const STATUS_MAPPING = {
  toDb: (status: string): boolean => status === 'published',
  toUi: (isActive: boolean | null | undefined): string => isActive === true ? 'published' : 'draft',
  note: "'archived' status is not currently supported in DB schema"
} as const
