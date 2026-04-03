import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { del } from '@vercel/blob'

// GET - List all media
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder')
    const search = searchParams.get('search')

    const supabase = await createClient()
    
    let query = supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })

    if (folder && folder !== 'all') {
      query = query.eq('folder', folder)
    }

    if (search) {
      query = query.ilike('original_filename', `%${search}%`)
    }

    const { data: media, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
    }

    return NextResponse.json({ media })
  } catch (error) {
    console.error('Error listing media:', error)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}

// DELETE - Delete media
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'No media ID provided' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the media record first to get the blob URL
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('blob_url')
      .eq('id', id)
      .single()

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(media.blob_url)
    } catch (blobError) {
      console.error('Blob delete error:', blobError)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
