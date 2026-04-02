// Availability checking utilities for vacation rental properties
// Force rebuild marker: 2026-04-03

import { addDays, format, isWithinInterval, isBefore, isAfter, differenceInDays, parseISO, startOfDay } from 'date-fns'

export interface BookingSegment {
  propertyId: string
  propertyName: string
  checkIn: Date
  checkOut: Date
  pricePerNight: number
  totalPrice: number
}

export interface SplitStaySuggestion {
  segments: BookingSegment[]
  totalPrice: number
  totalNights: number
  savings?: number
  message: string
}

export interface PropertyAvailability {
  propertyId: string
  bookedDates: { start: Date; end: Date }[]
  blockedDates: Date[]
  minimumStay: number
  maximumStay?: number
}

// ============================================
// DATE BLOCK TYPES AND FUNCTIONS
// ============================================

export type DateBlockType = 'maintenance' | 'owner_use' | 'booking' | 'other'

export interface DateBlock {
  id: string
  propertyId: string
  startDate: string
  endDate: string
  type: DateBlockType
  reason?: string
  createdBy: string
  createdAt: string
}

// In-memory storage for date blocks (in production, use database)
const dateBlocksStore: Map<string, DateBlock> = new Map()

/**
 * Get all date blocks for a property
 */
export function getDateBlocksForProperty(propertyId: string): DateBlock[] {
  const blocks: DateBlock[] = []
  dateBlocksStore.forEach(block => {
    if (block.propertyId === propertyId) {
      blocks.push(block)
    }
  })
  return blocks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

/**
 * Add a new date block
 */
export function addDateBlock(params: {
  propertyId: string
  startDate: string
  endDate: string
  type: DateBlockType
  reason?: string
  createdBy: string
}): DateBlock {
  const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const block: DateBlock = {
    id,
    propertyId: params.propertyId,
    startDate: params.startDate,
    endDate: params.endDate,
    type: params.type,
    reason: params.reason,
    createdBy: params.createdBy,
    createdAt: new Date().toISOString()
  }
  dateBlocksStore.set(id, block)
  return block
}

/**
 * Remove a date block by ID
 */
export function removeDateBlock(blockId: string): boolean {
  return dateBlocksStore.delete(blockId)
}

/**
 * Check if a date is blocked for a property
 */
export function isDateBlocked(propertyId: string, date: Date): boolean {
  const checkDate = startOfDay(date)
  const blocks = getDateBlocksForProperty(propertyId)
  
  for (const block of blocks) {
    const blockStart = startOfDay(parseISO(block.startDate))
    const blockEnd = startOfDay(parseISO(block.endDate))
    
    if (isWithinInterval(checkDate, { start: blockStart, end: blockEnd })) {
      return true
    }
  }
  
  return false
}

/**
 * Result of checking a property's availability for a date range
 */
export interface PropertyAvailabilityResult {
  property: { id: string; [key: string]: unknown }
  isAvailable: boolean
  conflictingDates: { start: Date; end: Date }[]
  availableNights: number
  requestedNights: number
}

// Mock availability data - in production this would come from a database
const mockAvailabilityData: Record<string, PropertyAvailability> = {
  'oceanview-villa': {
    propertyId: 'oceanview-villa',
    bookedDates: [
      { start: new Date('2026-04-10'), end: new Date('2026-04-15') },
      { start: new Date('2026-04-25'), end: new Date('2026-04-30') },
      { start: new Date('2026-05-10'), end: new Date('2026-05-17') },
    ],
    blockedDates: [],
    minimumStay: 2,
    maximumStay: 30,
  },
  'mountain-retreat': {
    propertyId: 'mountain-retreat',
    bookedDates: [
      { start: new Date('2026-04-08'), end: new Date('2026-04-12') },
      { start: new Date('2026-05-01'), end: new Date('2026-05-05') },
    ],
    blockedDates: [],
    minimumStay: 3,
    maximumStay: 14,
  },
  'downtown-loft': {
    propertyId: 'downtown-loft',
    bookedDates: [
      { start: new Date('2026-04-05'), end: new Date('2026-04-08') },
      { start: new Date('2026-04-20'), end: new Date('2026-04-23') },
    ],
    blockedDates: [],
    minimumStay: 1,
    maximumStay: 7,
  },
}

/**
 * Filter properties by availability for a date range
 * Returns availability results for all properties
 */
export function filterPropertiesByAvailability<T extends { id: string; availability?: { start: string; end: string }[] }>(
  properties: T[],
  checkIn: Date,
  checkOut: Date
): (PropertyAvailabilityResult & { property: T })[] {
  const checkInDate = startOfDay(checkIn)
  const checkOutDate = startOfDay(checkOut)
  const requestedNights = differenceInDays(checkOutDate, checkInDate)

  return properties.map(property => {
    // If no availability data, assume fully available
    const availability = property.availability
    if (!availability || !Array.isArray(availability) || availability.length === 0) {
      return {
        property,
        isAvailable: true,
        conflictingDates: [],
        availableNights: requestedNights,
        requestedNights
      }
    }

    // Check if the requested dates overlap with available periods
    let isWithinAvailablePeriod = false
    
    for (const period of availability) {
      const periodStart = startOfDay(parseISO(period.start))
      const periodEnd = startOfDay(parseISO(period.end))
      
      if (!isBefore(checkInDate, periodStart) && !isAfter(checkOutDate, periodEnd)) {
        isWithinAvailablePeriod = true
        break
      }
    }

    // Also check mock data for booked periods
    const mockData = mockAvailabilityData[property.id]
    const conflictingDates: { start: Date; end: Date }[] = []
    
    if (mockData) {
      for (const booking of mockData.bookedDates) {
        const bookingStart = startOfDay(booking.start)
        const bookingEnd = startOfDay(booking.end)
        
        if (
          isWithinInterval(checkInDate, { start: bookingStart, end: bookingEnd }) ||
          isWithinInterval(checkOutDate, { start: bookingStart, end: bookingEnd }) ||
          (isBefore(checkInDate, bookingStart) && isAfter(checkOutDate, bookingEnd))
        ) {
          conflictingDates.push({ start: booking.start, end: booking.end })
        }
      }
    }

    const isAvailable = conflictingDates.length === 0 && (availability.length === 0 || isWithinAvailablePeriod)
    
    return {
      property,
      isAvailable,
      conflictingDates,
      availableNights: isAvailable ? requestedNights : 0,
      requestedNights
    }
  })
}

/**
 * Check if a date range is available for a property
 */
export function checkPropertyAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): { available: boolean; conflictDates?: { start: Date; end: Date }[] } {
  const availability = mockAvailabilityData[propertyId]
  
  if (!availability) {
    return { available: true }
  }

  const checkInDate = startOfDay(checkIn)
  const checkOutDate = startOfDay(checkOut)

  const conflicts = availability.bookedDates.filter(booking => {
    const bookingStart = startOfDay(booking.start)
    const bookingEnd = startOfDay(booking.end)
    
    return (
      (isWithinInterval(checkInDate, { start: bookingStart, end: bookingEnd }) ||
       isWithinInterval(checkOutDate, { start: bookingStart, end: bookingEnd }) ||
       (isBefore(checkInDate, bookingStart) && isAfter(checkOutDate, bookingEnd)))
    )
  })

  if (conflicts.length > 0) {
    return { available: false, conflictDates: conflicts }
  }

  const nights = differenceInDays(checkOutDate, checkInDate)
  
  if (nights < availability.minimumStay) {
    return { available: false }
  }

  if (availability.maximumStay && nights > availability.maximumStay) {
    return { available: false }
  }

  return { available: true }
}

/**
 * Get all unavailable dates for a property within a date range
 */
export function getUnavailableDates(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Date[] {
  const availability = mockAvailabilityData[propertyId]
  
  if (!availability) {
    return []
  }

  const unavailableDates: Date[] = []
  
  availability.bookedDates.forEach(booking => {
    let currentDate = startOfDay(booking.start)
    const bookingEnd = startOfDay(booking.end)
    
    while (!isAfter(currentDate, bookingEnd)) {
      if (isWithinInterval(currentDate, { start: startOfDay(startDate), end: startOfDay(endDate) })) {
        unavailableDates.push(new Date(currentDate))
      }
      currentDate = addDays(currentDate, 1)
    }
  })

  availability.blockedDates.forEach(blockedDate => {
    const blocked = startOfDay(blockedDate)
    if (isWithinInterval(blocked, { start: startOfDay(startDate), end: startOfDay(endDate) })) {
      unavailableDates.push(new Date(blocked))
    }
  })

  return unavailableDates
}

/**
 * Generate a split stay suggestion when a single property is unavailable
 */
export function generateSplitStaySuggestion(
  requestedCheckIn: Date,
  requestedCheckOut: Date,
  primaryPropertyId: string,
  primaryPropertyName: string,
  primaryPricePerNight: number,
  alternativeProperties: Array<{
    id: string
    name: string
    pricePerNight: number
  }>
): SplitStaySuggestion | null {
  const availability = checkPropertyAvailability(primaryPropertyId, requestedCheckIn, requestedCheckOut)
  
  if (availability.available) {
    return null
  }

  if (!availability.conflictDates || availability.conflictDates.length === 0) {
    return null
  }

  const segments: BookingSegment[] = []
  let currentDate = startOfDay(requestedCheckIn)
  const endDate = startOfDay(requestedCheckOut)
  const conflict = availability.conflictDates[0]
  const conflictStart = startOfDay(conflict.start)
  const conflictEnd = startOfDay(conflict.end)

  if (isBefore(currentDate, conflictStart)) {
    const segmentEnd = conflictStart
    const nights = differenceInDays(segmentEnd, currentDate)
    
    if (nights > 0) {
      segments.push({
        propertyId: primaryPropertyId,
        propertyName: primaryPropertyName,
        checkIn: new Date(currentDate),
        checkOut: new Date(segmentEnd),
        pricePerNight: primaryPricePerNight,
        totalPrice: nights * primaryPricePerNight,
      })
    }
    currentDate = segmentEnd
  }

  if (alternativeProperties.length > 0) {
    const altProperty = alternativeProperties[0]
    const segmentStart = currentDate
    const segmentEnd = isBefore(conflictEnd, endDate) ? addDays(conflictEnd, 1) : endDate
    const nights = differenceInDays(segmentEnd, segmentStart)
    
    if (nights > 0) {
      segments.push({
        propertyId: altProperty.id,
        propertyName: altProperty.name,
        checkIn: new Date(segmentStart),
        checkOut: new Date(segmentEnd),
        pricePerNight: altProperty.pricePerNight,
        totalPrice: nights * altProperty.pricePerNight,
      })
    }
    currentDate = segmentEnd
  }

  if (isBefore(currentDate, endDate)) {
    const nights = differenceInDays(endDate, currentDate)
    
    if (nights > 0) {
      segments.push({
        propertyId: primaryPropertyId,
        propertyName: primaryPropertyName,
        checkIn: new Date(currentDate),
        checkOut: new Date(endDate),
        pricePerNight: primaryPricePerNight,
        totalPrice: nights * primaryPricePerNight,
      })
    }
  }

  if (segments.length < 2) {
    return null
  }

  const totalPrice = segments.reduce((sum, seg) => sum + seg.totalPrice, 0)
  const totalNights = segments.reduce((sum, seg) => sum + differenceInDays(seg.checkOut, seg.checkIn), 0)

  return {
    segments,
    totalPrice,
    totalNights,
    message: `We've found a split stay option! Stay at ${segments.map(s => s.propertyName).join(' and ')} for your complete trip.`,
  }
}

/**
 * Calculate the number of nights between two dates
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  return differenceInDays(startOfDay(checkOut), startOfDay(checkIn))
}

/**
 * Format a date for display (short format)
 */
export function formatDateShort(date: Date): string {
  return format(date, 'MMM d')
}

/**
 * Format a date range for display
 */
export function formatDateRange(checkIn: Date, checkOut: Date): string {
  return `${formatDateShort(checkIn)} - ${formatDateShort(checkOut)}`
}

/**
 * Get the minimum stay requirement for a property
 */
export function getMinimumStay(propertyId: string): number {
  const availability = mockAvailabilityData[propertyId]
  return availability?.minimumStay ?? 1
}

/**
 * Check if a specific date is available
 */
export function isDateAvailable(propertyId: string, date: Date): boolean {
  const availability = mockAvailabilityData[propertyId]
  
  if (!availability) {
    return true
  }

  const checkDate = startOfDay(date)

  for (const booking of availability.bookedDates) {
    if (isWithinInterval(checkDate, { 
      start: startOfDay(booking.start), 
      end: startOfDay(booking.end) 
    })) {
      return false
    }
  }

  for (const blockedDate of availability.blockedDates) {
    if (startOfDay(blockedDate).getTime() === checkDate.getTime()) {
      return false
    }
  }

  return true
}
