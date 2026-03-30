import { NextRequest, NextResponse } from 'next/server'
import { parseICalContent, icsEventsToBookedPeriods, isValidIcalUrl, generateInternalIcalUrl } from '@/lib/ical'
import { mockProperties } from '@/lib/data'

export const runtime = 'nodejs'

// In-memory sync status (in production, use a database)
const syncStatus: Record<string, {
  airbnbIcalUrl?: string
  lastSyncAt?: Date
  status: 'idle' | 'syncing' | 'success' | 'error'
  error?: string
  eventsCount?: number
}> = {}

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get('propertyId')
  
  if (propertyId) {
    // Get sync status for a specific property
    const property = mockProperties.find(p => p.id === propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    const status = syncStatus[propertyId] || { status: 'idle' }
    const baseUrl = request.nextUrl.origin
    
    return NextResponse.json({
      propertyId,
      propertyTitle: property.title,
      internalIcalUrl: generateInternalIcalUrl(propertyId, baseUrl),
      ...status
    })
  }
  
  // Get sync status for all properties
  const baseUrl = request.nextUrl.origin
  const allStatus = mockProperties.map(property => ({
    propertyId: property.id,
    propertyTitle: property.title,
    internalIcalUrl: generateInternalIcalUrl(property.id, baseUrl),
    ...(syncStatus[property.id] || { status: 'idle' })
  }))
  
  return NextResponse.json({ properties: allStatus })
}

export async function POST(request: NextRequest) {
  try {
    const { propertyId, airbnbIcalUrl, action } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const property = mockProperties.find(p => p.id === propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Handle save action (save URL without syncing)
    if (action === 'save') {
      if (!airbnbIcalUrl) {
        // Remove the URL
        if (syncStatus[propertyId]) {
          syncStatus[propertyId].airbnbIcalUrl = undefined
        }
        return NextResponse.json({ success: true, message: 'iCal URL removed' })
      }
      
      if (!isValidIcalUrl(airbnbIcalUrl)) {
        return NextResponse.json({ error: 'Invalid iCal URL' }, { status: 400 })
      }
      
      syncStatus[propertyId] = {
        ...syncStatus[propertyId],
        airbnbIcalUrl,
        status: 'idle'
      }
      
      return NextResponse.json({ success: true, message: 'iCal URL saved' })
    }

    // Handle sync action
    if (action === 'sync') {
      const urlToSync = airbnbIcalUrl || syncStatus[propertyId]?.airbnbIcalUrl
      
      if (!urlToSync) {
        return NextResponse.json({ error: 'No iCal URL configured' }, { status: 400 })
      }

      // Update status to syncing
      syncStatus[propertyId] = {
        ...syncStatus[propertyId],
        airbnbIcalUrl: urlToSync,
        status: 'syncing'
      }

      try {
        // Fetch and parse the calendar
        const response = await fetch(urlToSync, {
          headers: {
            'User-Agent': 'MarrakechRiadsRent/1.0 (Calendar Sync)',
            'Accept': 'text/calendar, application/ics, */*'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }

        const icsContent = await response.text()
        
        if (!icsContent.includes('BEGIN:VCALENDAR')) {
          throw new Error('Invalid calendar format')
        }

        const parseResult = parseICalContent(icsContent)
        const bookedPeriods = icsEventsToBookedPeriods(parseResult.events, 'airbnb')

        // Update status to success
        syncStatus[propertyId] = {
          airbnbIcalUrl: urlToSync,
          lastSyncAt: new Date(),
          status: 'success',
          eventsCount: bookedPeriods.length
        }

        return NextResponse.json({
          success: true,
          propertyId,
          syncedAt: new Date().toISOString(),
          eventsCount: bookedPeriods.length,
          bookedPeriods: bookedPeriods.map(p => ({
            start: p.start.toISOString().split('T')[0],
            end: p.end.toISOString().split('T')[0],
            source: p.source
          }))
        })

      } catch (error) {
        // Update status to error
        syncStatus[propertyId] = {
          ...syncStatus[propertyId],
          status: 'error',
          error: error instanceof Error ? error.message : 'Sync failed'
        }

        return NextResponse.json({
          error: 'Sync failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 502 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
