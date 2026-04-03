'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { dbToAdminForm, type DbPropertyRaw } from '@/lib/adapters/admin-property-adapter'

/**
 * DEPRECATED: Use CreatePropertyInput from app/admin/actions.ts instead.
 * This interface is kept for backward compatibility with existing code.
 * 
 * NOTE: The actual DB columns are different:
 * - title -> name_en
 * - type -> category
 * - status -> is_active (boolean)
 * - etc.
 * 
 * See lib/adapters/admin-property-adapter.ts for the canonical mapping.
 */
export interface PropertyFormData {
  title: string
  slug: string
  type: 'riad' | 'villa' | 'apartment' | 'house'
  description_short?: string
  description_long?: string
  city: string
  district?: string
  address?: string
  map_location?: string
  price_per_night: number
  cleaning_fee?: number
  security_deposit?: number  // Changed from service_fee (which doesn't exist in DB)
  num_bedrooms: number
  num_bathrooms: number
  bedroom_guest_capacity?: number
  additional_guest_capacity?: number
  total_guest_capacity: number
  amenities?: string[]
  parking_type?: string
  parking_spots?: number
  // parking_notes removed - not in DB schema
  seo_title?: string
  seo_description?: string
  // seo_keywords removed - not in DB schema
  status: 'draft' | 'published'  // 'archived' removed - not supported by is_active boolean
  featured?: boolean
  airbnb_ical_url?: string
  booking_ical_url?: string
  internal_ical_url?: string
}

export interface PropertyRoom {
  id?: string
  property_id: string
  room_name: string
  room_number?: number
  bed_type?: string
  num_beds?: number
  has_bathroom?: boolean
  has_shower?: boolean
  has_bathtub?: boolean
  equipment?: string[]
  notes?: string
}

export interface PropertyImage {
  id?: string
  property_id: string
  image_url: string
  alt_text?: string
  caption?: string
  display_order: number
  is_cover: boolean
}

// Get all properties (adapted to UI field names for admin table)
export async function getProperties() {
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
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching properties:', error)
    throw new Error('Failed to fetch properties')
  }
  
  // Adapt DB columns to UI field names expected by PropertiesTable
  return (data || []).map(p => ({
    id: p.id,
    title: p.name_en || p.name_fr || 'Untitled',
    slug: p.slug || '',
    type: p.category || 'riad',
    city: p.location || 'Marrakech',
    district: p.district || undefined,
    num_bedrooms: p.bedrooms || 1,
    num_bathrooms: p.bathrooms || 1,
    bedroom_guest_capacity: p.bedroom_guest_capacity || 2,
    additional_guest_capacity: p.additional_guest_capacity || 0,
    total_guest_capacity: p.max_guests || p.bedroom_guest_capacity || 2,
    price_per_night: p.price_per_night || 0,
    status: p.status || (p.is_active ? 'published' : 'draft'),
    featured: p.featured || false,
    property_images: p.property_images || []
  }))
}

// Get single property by ID (for admin edit form)
// Returns data adapted to admin form field names
export async function getPropertyById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_images (
        id,
        image_url,
        alt_text,
        caption,
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
      ),
      availability_sync (
        id,
        airbnb_ical_url,
        booking_ical_url,
        internal_ical_url,
        last_sync_at,
        sync_status
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching property:', error)
    throw new Error('Failed to fetch property')
  }
  
  // Adapt DB columns to admin form field names
  return dbToAdminForm(data as DbPropertyRaw)
}

// Get property by slug (for public pages)
export async function getPropertyBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_images (
        id,
        image_url,
        alt_text,
        caption,
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
    .eq('slug', slug)
    .eq('status', 'published')  // Use status column for published properties
    .single()
  
  if (error) {
    console.error('Error fetching property by slug:', error)
    return null
  }
  
  return data
}

/**
 * DEPRECATED: Use createPropertyAction from app/admin/actions.ts instead.
 * This function is kept for backward compatibility but uses the correct DB column mapping.
 */
export async function createProperty(formData: PropertyFormData) {
  const supabase = await createClient()
  
  // Map form fields to actual Supabase column names
  const dbData = {
    name_en: formData.title,
    slug: formData.slug,
    category: formData.type,
    short_description_en: formData.description_short || null,
    description_en: formData.description_long || null,
    location: formData.city || 'Marrakech',
    district: formData.district || null,
    address: formData.address || null,
    map_url: formData.map_location || null,
    price_per_night: formData.price_per_night || 0,
    cleaning_fee: formData.cleaning_fee || 0,
    security_deposit: formData.security_deposit || 0,
    bedrooms: formData.num_bedrooms || 1,
    bathrooms: formData.num_bathrooms || 1,
    bedroom_guest_capacity: formData.bedroom_guest_capacity || 2,
    additional_guest_capacity: formData.additional_guest_capacity || 0,
    max_guests: formData.total_guest_capacity || formData.bedroom_guest_capacity || 2,
    amenities: formData.amenities ? { items: formData.amenities } : null,
    parking_type: formData.parking_type || null,
    parking_spots: formData.parking_spots || 0,
    meta_title: formData.seo_title || null,
    meta_description: formData.seo_description || null,
    status: formData.status || 'draft',  // Use status column directly
    is_active: formData.status === 'published',  // Kept for backward compatibility
    featured: formData.featured || false
  }
  
  const { data, error } = await supabase
    .from('properties')
    .insert(dbData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating property:', error)
    throw new Error('Failed to create property')
  }
  
  // Create availability sync record if URLs provided
  if (formData.airbnb_ical_url || formData.booking_ical_url || formData.internal_ical_url) {
    await supabase
      .from('availability_sync')
      .insert({
        property_id: data.id,
        airbnb_ical_url: formData.airbnb_ical_url || null,
        booking_ical_url: formData.booking_ical_url || null,
        internal_ical_url: formData.internal_ical_url || null
      })
  }
  
  revalidatePath('/admin/properties')
  revalidatePath('/properties')
  
  return data
}

/**
 * DEPRECATED: Use updatePropertyAction from app/admin/actions.ts instead.
 * This function is kept for backward compatibility but uses the correct DB column mapping.
 */
export async function updateProperty(id: string, formData: Partial<PropertyFormData>) {
  const supabase = await createClient()
  
  // Map form fields to actual Supabase column names
  // Only include fields that are defined to avoid overwriting with undefined
  const dbData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }
  
  if (formData.title !== undefined) dbData.name_en = formData.title
  if (formData.slug !== undefined) dbData.slug = formData.slug
  if (formData.type !== undefined) dbData.category = formData.type
  if (formData.description_short !== undefined) dbData.short_description_en = formData.description_short
  if (formData.description_long !== undefined) dbData.description_en = formData.description_long
  if (formData.city !== undefined) dbData.location = formData.city
  if (formData.district !== undefined) dbData.district = formData.district
  if (formData.address !== undefined) dbData.address = formData.address
  if (formData.map_location !== undefined) dbData.map_url = formData.map_location
  if (formData.price_per_night !== undefined) dbData.price_per_night = formData.price_per_night
  if (formData.cleaning_fee !== undefined) dbData.cleaning_fee = formData.cleaning_fee
  if (formData.security_deposit !== undefined) dbData.security_deposit = formData.security_deposit
  if (formData.num_bedrooms !== undefined) dbData.bedrooms = formData.num_bedrooms
  if (formData.num_bathrooms !== undefined) dbData.bathrooms = formData.num_bathrooms
  if (formData.bedroom_guest_capacity !== undefined) dbData.bedroom_guest_capacity = formData.bedroom_guest_capacity
  if (formData.additional_guest_capacity !== undefined) dbData.additional_guest_capacity = formData.additional_guest_capacity
  if (formData.total_guest_capacity !== undefined) dbData.max_guests = formData.total_guest_capacity
  if (formData.amenities !== undefined) dbData.amenities = { items: formData.amenities }
  if (formData.parking_type !== undefined) dbData.parking_type = formData.parking_type
  if (formData.parking_spots !== undefined) dbData.parking_spots = formData.parking_spots
  if (formData.seo_title !== undefined) dbData.meta_title = formData.seo_title
  if (formData.seo_description !== undefined) dbData.meta_description = formData.seo_description
  if (formData.status !== undefined) {
    dbData.status = formData.status  // Use status column directly
    dbData.is_active = formData.status === 'published'  // Kept for backward compatibility
  }
  if (formData.featured !== undefined) dbData.featured = formData.featured
  
  const { data, error } = await supabase
    .from('properties')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating property:', error)
    throw new Error('Failed to update property')
  }
  
  // Update or create availability sync
  if (formData.airbnb_ical_url !== undefined || formData.booking_ical_url !== undefined || formData.internal_ical_url !== undefined) {
    const { data: existingSync } = await supabase
      .from('availability_sync')
      .select('id')
      .eq('property_id', id)
      .single()
    
    const syncData = {
      airbnb_ical_url: formData.airbnb_ical_url || null,
      booking_ical_url: formData.booking_ical_url || null,
      internal_ical_url: formData.internal_ical_url || null
    }
    
    if (existingSync) {
      await supabase
        .from('availability_sync')
        .update(syncData)
        .eq('property_id', id)
    } else if (formData.airbnb_ical_url || formData.booking_ical_url || formData.internal_ical_url) {
      await supabase
        .from('availability_sync')
        .insert({ property_id: id, ...syncData })
    }
  }
  
  revalidatePath('/admin/properties')
  revalidatePath(`/admin/properties/${id}`)
  revalidatePath('/properties')
  revalidatePath(`/properties/${formData.slug}`)
  
  return data
}

// Delete property
export async function deleteProperty(id: string) {
  const supabase = await createClient()
  
  // Delete related records first (cascade should handle this, but being explicit)
  await supabase.from('property_images').delete().eq('property_id', id)
  await supabase.from('property_rooms').delete().eq('property_id', id)
  await supabase.from('availability_sync').delete().eq('property_id', id)
  
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting property:', error)
    throw new Error('Failed to delete property')
  }
  
  revalidatePath('/admin/properties')
  revalidatePath('/properties')
  
  return true
}

// Property Rooms CRUD
export async function addPropertyRoom(room: PropertyRoom) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_rooms')
    .insert(room)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding room:', error)
    throw new Error('Failed to add room')
  }
  
  revalidatePath(`/admin/properties/${room.property_id}`)
  return data
}

export async function updatePropertyRoom(id: string, room: Partial<PropertyRoom>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_rooms')
    .update(room)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating room:', error)
    throw new Error('Failed to update room')
  }
  
  return data
}

export async function deletePropertyRoom(id: string, propertyId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('property_rooms')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting room:', error)
    throw new Error('Failed to delete room')
  }
  
  revalidatePath(`/admin/properties/${propertyId}`)
  return true
}

// Property Images CRUD
export async function addPropertyImage(image: PropertyImage) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_images')
    .insert(image)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding image:', error)
    throw new Error('Failed to add image')
  }
  
  revalidatePath(`/admin/properties/${image.property_id}`)
  return data
}

export async function updatePropertyImage(id: string, image: Partial<PropertyImage>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_images')
    .update(image)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating image:', error)
    throw new Error('Failed to update image')
  }
  
  return data
}

export async function deletePropertyImage(id: string, propertyId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('property_images')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
  
  revalidatePath(`/admin/properties/${propertyId}`)
  return true
}

export async function reorderPropertyImages(propertyId: string, imageIds: string[]) {
  const supabase = await createClient()
  
  // Update display_order for each image
  const updates = imageIds.map((id, index) => 
    supabase
      .from('property_images')
      .update({ display_order: index })
      .eq('id', id)
  )
  
  await Promise.all(updates)
  
  revalidatePath(`/admin/properties/${propertyId}`)
  return true
}

export async function setCoverImage(propertyId: string, imageId: string) {
  const supabase = await createClient()
  
  // Reset all images to non-cover
  await supabase
    .from('property_images')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
  
  // Set the selected image as cover
  await supabase
    .from('property_images')
    .update({ is_cover: true })
    .eq('id', imageId)
  
  revalidatePath(`/admin/properties/${propertyId}`)
  return true
}

// Get published properties for public pages
export async function getPublishedProperties(filters?: {
  type?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  minGuests?: number
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('properties')
    .select(`
      *,
      property_images (
        id,
        image_url,
        alt_text,
        display_order,
        is_cover
      )
    `)
    .eq('status', 'published')  // Use status column for published properties
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
  
  // Filter by category (DB column), not type (UI name)
  if (filters?.type) {
    query = query.eq('category', filters.type)
  }
  // Filter by location (DB column), not city (UI name)
  if (filters?.city) {
    query = query.eq('location', filters.city)
  }
  if (filters?.minPrice) {
    query = query.gte('price_per_night', filters.minPrice)
  }
  if (filters?.maxPrice) {
    query = query.lte('price_per_night', filters.maxPrice)
  }
  // Filter by max_guests (DB column), not total_guest_capacity (UI name)
  if (filters?.minGuests) {
    query = query.gte('max_guests', filters.minGuests)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching published properties:', error)
    return []
  }
  
  return data
}
