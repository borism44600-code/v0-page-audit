import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const pathname = `${folder}/${timestamp}-${safeName}`

    // Upload to Vercel Blob (public access for images)
    const blob = await put(pathname, file, {
      access: 'public',
    })

    // Get image dimensions if it's an image
    let width: number | null = null
    let height: number | null = null
    
    // Store metadata in Supabase
    const supabase = await createClient()
    const { data: media, error: dbError } = await supabase
      .from('media')
      .insert({
        filename: pathname,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        blob_url: blob.url,
        blob_pathname: blob.pathname,
        folder: folder,
        width,
        height,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save media metadata' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      media: {
        id: media.id,
        url: blob.url,
        filename: file.name,
        size: file.size,
        type: file.type,
        folder: folder,
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
