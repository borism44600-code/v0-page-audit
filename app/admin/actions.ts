'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// PROPERTY ACTIONS
// ============================================================================

// Input type from form (camelCase/mixed naming)
export interface CreatePropertyInput {
  title: string
  slug: string
  type: 'riad' | 'villa' | 'apartment' | 'house'
  description_short?: string
  description_long?: string
  city?: string
  district?: string
  address?: string
  map_location?: string
  price_per_night: number
  cleaning_fee?: number
  security_deposit?: number
  num_bedrooms?: number
  num_bathrooms?: number
  bedroom_guest_capacity?: number
  additional_guest_capacity?: number
  total_guest_capacity?: number
  amenities?: string[]
  features?: Record<string, boolean>
  parking_type?: string
  parking_spots?: number
  seo_title?: string
  seo_description?: string
  status?: string
  featured?: boolean
  airbnb_ical_url?: string
  booking_ical_url?: string
  internal_ical_url?: string
}

export async function createPropertyAction(data: CreatePropertyInput): Promise<{ data?: unknown; error?: string }> {
  const supabase = await createClient()
  
  // Map form fields to actual Supabase column names
  const dbData = {
    name_en: data.title,
    slug: data.slug,
    category: data.type,
    short_description_en: data.description_short || null,
    description_en: data.description_long || null,
    location: data.city || 'Marrakech',
    district: data.district || null,
    address: data.address || null,
    map_url: data.map_location || null,
    price_per_night: data.price_per_night || 0,
    cleaning_fee: data.cleaning_fee || 0,
    security_deposit: data.security_deposit || 0,
    bedrooms: data.num_bedrooms || 1,
    bathrooms: data.num_bathrooms || 1,
    bedroom_guest_capacity: data.bedroom_guest_capacity || 2,
    additional_guest_capacity: data.additional_guest_capacity || 0,
    max_guests: data.total_guest_capacity || data.bedroom_guest_capacity || 2,
    amenities: data.amenities ? { items: data.amenities } : null,
    features: data.features || null,
    parking_type: data.parking_type || null,
    parking_spots: data.parking_spots || 0,
    meta_title: data.seo_title || null,
    meta_description: data.seo_description || null,
    is_active: data.status === 'published',
    featured: data.featured || false,
  }
  
  const { data: property, error } = await supabase
    .from('properties')
    .insert(dbData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating property:', error)
    return { error: `Failed to create property: ${error.message}` }
  }
  
  // Create availability sync record if URLs provided
  if (data.airbnb_ical_url || data.booking_ical_url || data.internal_ical_url) {
    const { error: syncError } = await supabase
      .from('availability_sync')
      .insert({
        property_id: property.id,
        airbnb_ical_url: data.airbnb_ical_url || null,
        booking_ical_url: data.booking_ical_url || null,
        internal_ical_url: data.internal_ical_url || null,
      })
    
    if (syncError) {
      console.error('Error creating availability sync:', syncError)
      // Don't fail the whole operation for sync error
    }
  }
  
  revalidatePath('/admin/properties')
  revalidatePath('/properties')
  
  return { data: property }
}

// Input type for update (same structure as create but all optional)
export type UpdatePropertyInput = Partial<CreatePropertyInput>

export async function updatePropertyAction(id: string, data: UpdatePropertyInput): Promise<{ data?: unknown; error?: string }> {
  const supabase = await createClient()
  
  // Map form fields to actual Supabase column names
  const dbData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  }
  
  // Only include fields that are defined
  if (data.title !== undefined) dbData.name_en = data.title
  if (data.slug !== undefined) dbData.slug = data.slug
  if (data.type !== undefined) dbData.category = data.type
  if (data.description_short !== undefined) dbData.short_description_en = data.description_short
  if (data.description_long !== undefined) dbData.description_en = data.description_long
  if (data.city !== undefined) dbData.location = data.city
  if (data.district !== undefined) dbData.district = data.district
  if (data.address !== undefined) dbData.address = data.address
  if (data.map_location !== undefined) dbData.map_url = data.map_location
  if (data.price_per_night !== undefined) dbData.price_per_night = data.price_per_night
  if (data.cleaning_fee !== undefined) dbData.cleaning_fee = data.cleaning_fee
  if (data.security_deposit !== undefined) dbData.security_deposit = data.security_deposit
  if (data.num_bedrooms !== undefined) dbData.bedrooms = data.num_bedrooms
  if (data.num_bathrooms !== undefined) dbData.bathrooms = data.num_bathrooms
  if (data.bedroom_guest_capacity !== undefined) dbData.bedroom_guest_capacity = data.bedroom_guest_capacity
  if (data.additional_guest_capacity !== undefined) dbData.additional_guest_capacity = data.additional_guest_capacity
  if (data.total_guest_capacity !== undefined) dbData.max_guests = data.total_guest_capacity
  if (data.amenities !== undefined) dbData.amenities = { items: data.amenities }
  if (data.features !== undefined) dbData.features = data.features
  if (data.parking_type !== undefined) dbData.parking_type = data.parking_type
  if (data.parking_spots !== undefined) dbData.parking_spots = data.parking_spots
  if (data.seo_title !== undefined) dbData.meta_title = data.seo_title
  if (data.seo_description !== undefined) dbData.meta_description = data.seo_description
  if (data.status !== undefined) dbData.is_active = data.status === 'published'
  if (data.featured !== undefined) dbData.featured = data.featured
  
  const { data: property, error } = await supabase
    .from('properties')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating property:', error)
    return { error: `Failed to update property: ${error.message}` }
  }
  
  // Update availability sync if URLs provided
  if (data.airbnb_ical_url !== undefined || data.booking_ical_url !== undefined || data.internal_ical_url !== undefined) {
    const { data: existingSync } = await supabase
      .from('availability_sync')
      .select('id')
      .eq('property_id', id)
      .single()
    
    const syncData = {
      airbnb_ical_url: data.airbnb_ical_url || null,
      booking_ical_url: data.booking_ical_url || null,
      internal_ical_url: data.internal_ical_url || null,
    }
    
    if (existingSync) {
      await supabase
        .from('availability_sync')
        .update(syncData)
        .eq('property_id', id)
    } else if (data.airbnb_ical_url || data.booking_ical_url || data.internal_ical_url) {
      await supabase
        .from('availability_sync')
        .insert({ property_id: id, ...syncData })
    }
  }
  
  revalidatePath('/admin/properties')
  revalidatePath(`/admin/properties/${id}`)
  revalidatePath('/properties')
  revalidatePath(`/properties/${id}`)
  
  return { data: property }
}

export async function deletePropertyAction(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting property:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/properties')
  revalidatePath('/properties')
  
  return { success: true }
}

// ============================================================================
// PARTNER ACTIONS
// ============================================================================

export async function createPartnerAction(data: {
  name: string
  category: string
  description_short?: string
  description_long?: string
  area?: string
  website?: string
  booking_url?: string
  phone?: string
  email?: string
  image_url?: string
  status?: string
  featured?: boolean
}) {
  const supabase = await createClient()
  
  const { data: partner, error } = await supabase
    .from('partners')
    .insert({
      ...data,
      status: data.status || 'draft'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating partner:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/partners')
  revalidatePath('/partners')
  
  return { data: partner }
}

export async function updatePartnerAction(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  
  const { data: partner, error } = await supabase
    .from('partners')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating partner:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/partners')
  revalidatePath('/partners')
  
  return { data: partner }
}

export async function deletePartnerAction(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting partner:', error)
    return { error: error.message }
  }
  
  revalidatePath('/admin/partners')
  revalidatePath('/partners')
  
  return { success: true }
}

// ============================================================================
// AUTH ACTIONS
// ============================================================================

export async function adminLoginAction(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', data.user.id)
    .single()
  
  if (!adminUser) {
    await supabase.auth.signOut()
    return { error: 'Not authorized as admin' }
  }
  
  return { success: true }
}

export async function adminLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}

// ============================================================================
// IMAGE ACTIONS
// ============================================================================

export async function addPropertyImageAction(propertyId: string, imageData: {
  image_url: string
  alt_text?: string
  display_order?: number
  is_cover?: boolean
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('property_images')
    .insert({
      property_id: propertyId,
      ...imageData
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath(`/properties/${propertyId}`)
  
  return { data }
}

export async function deletePropertyImageAction(imageId: string, propertyId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('property_images')
    .delete()
    .eq('id', imageId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath(`/properties/${propertyId}`)
  
  return { success: true }
}

export async function setCoverImageAction(imageId: string, propertyId: string) {
  const supabase = await createClient()
  
  // Remove cover from all other images
  await supabase
    .from('property_images')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
  
  // Set this image as cover
  const { error } = await supabase
    .from('property_images')
    .update({ is_cover: true })
    .eq('id', imageId)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath(`/properties/${propertyId}`)
  
  return { success: true }
}
