import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all folders with media counts
export async function GET() {
  try {
    const supabase = await createClient()

    // Get folders
    const { data: folders, error: foldersError } = await supabase
      .from('media_folders')
      .select('*')
      .order('sort_order', { ascending: true })

    if (foldersError) {
      console.error('Database error:', foldersError)
      return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
    }

    // Get media counts per folder
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('folder')

    if (mediaError) {
      console.error('Database error:', mediaError)
      return NextResponse.json({ error: 'Failed to fetch media counts' }, { status: 500 })
    }

    // Calculate counts
    const counts: Record<string, number> = {}
    let totalCount = 0
    media?.forEach(m => {
      counts[m.folder] = (counts[m.folder] || 0) + 1
      totalCount++
    })

    // Add counts to folders
    const foldersWithCounts = folders?.map(folder => ({
      ...folder,
      count: folder.slug === 'all' ? totalCount : (counts[folder.slug] || 0)
    }))

    return NextResponse.json({ folders: foldersWithCounts })
  } catch (error) {
    console.error('Error listing folders:', error)
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 })
  }
}

// POST - Create new folder
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Folder name required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')

    const supabase = await createClient()

    // Get max sort order
    const { data: maxOrder } = await supabase
      .from('media_folders')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (maxOrder?.sort_order || 0) + 1

    const { data: folder, error } = await supabase
      .from('media_folders')
      .insert({
        name,
        slug,
        description,
        sort_order: sortOrder
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Folder already exists' }, { status: 400 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
    }

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
