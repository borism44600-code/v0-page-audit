'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ServiceFormData {
  name_en: string
  name_fr?: string
  name_es?: string
  name_ar?: string
  name_ma?: string
  name_zh?: string
  description_en?: string
  description_fr?: string
  description_es?: string
  description_ar?: string
  description_ma?: string
  description_zh?: string
  category: string
  price?: number
  price_unit?: string
  image?: string
  slug?: string
  is_active?: boolean
  sort_order?: number
}

// Get all services (admin)
export async function getServices() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching services:', error)
    throw new Error('Failed to fetch services')
  }
  
  return data || []
}

// Get single service by ID
export async function getServiceById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching service:', error)
    throw new Error('Failed to fetch service')
  }
  
  return data
}

// Create new service
export async function createService(formData: ServiceFormData) {
  const supabase = await createClient()
  
  // Generate slug from name if not provided
  const slug = formData.slug || formData.name_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  const { data, error } = await supabase
    .from('services')
    .insert({
      name_en: formData.name_en,
      name_fr: formData.name_fr,
      name_es: formData.name_es,
      name_ar: formData.name_ar,
      name_ma: formData.name_ma,
      name_zh: formData.name_zh,
      description_en: formData.description_en,
      description_fr: formData.description_fr,
      description_es: formData.description_es,
      description_ar: formData.description_ar,
      description_ma: formData.description_ma,
      description_zh: formData.description_zh,
      category: formData.category,
      price: formData.price,
      price_unit: formData.price_unit,
      image: formData.image,
      slug: slug,
      is_active: formData.is_active ?? true,
      sort_order: formData.sort_order ?? 0
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating service:', error)
    throw new Error('Failed to create service')
  }
  
  revalidatePath('/admin/services')
  revalidatePath('/services')
  
  return data
}

// Update service
export async function updateService(id: string, formData: Partial<ServiceFormData>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating service:', error)
    throw new Error('Failed to update service')
  }
  
  revalidatePath('/admin/services')
  revalidatePath('/services')
  
  return data
}

// Delete service
export async function deleteService(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting service:', error)
    throw new Error('Failed to delete service')
  }
  
  revalidatePath('/admin/services')
  revalidatePath('/services')
  
  return true
}

// Get active services for public pages
export async function getActiveServices(category?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  
  if (category) {
    query = query.eq('category', category)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching active services:', error)
    return []
  }
  
  return data || []
}
