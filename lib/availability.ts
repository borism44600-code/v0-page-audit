import { Property } from './types'

export type DateBlockType = 'maintenance' | 'owner_use' | 'booking' | 'other'

export interface DateBlock {
  id: string
  propertyId: string
  startDate: string
  endDate: string
  type: DateBlockType
  reason?: string
  bookingId?: string
  createdBy?: string
  createdAt: string
}

const dateBlocks: DateBlock[] = []

export function addDateBlock(block: Omit<DateBlock, 'id' | 'createdAt'>): DateBlock {
  const newBlock: DateBlock = {
    ...block,
    id: `DB-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString()
  }
  dateBlocks.push(newBlock)
  return newBlock
}

export function removeDateBlock(blockId: string): boolean {
  const index = dateBlocks.findIndex(b => b.id === blockId)
  if (index !== -1) {
    dateBlocks.splice(index, 1)
    return true
  }
  return false
}

export function getDateBlocksForProperty(propertyId: string): DateBlock[] {
  return dateBlocks.filter(b => b.propertyId === propertyId)
}

export function isDateBlocked(propertyId: string, date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return dateBlocks.some(block => {
    if (block.propertyId !== propertyId) return false
    return dateStr >= block.startDate && dateStr < block.endDate
  })
}

export function getBlockedDatesInRange(
  propertyId: string,
  startDate: Date,
  endDate: Date
): DateBlock[] {
  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]
  return dateBlocks.filter(block => {
    if (block.propertyId !== propertyId) return false
    return block.startDate < end && block.endDate > start
  })
}

export interface DateRange {
  start: Date
  end: Date
}

export interface AvailabilitySegment {
  propertyId: string
  start: Date
  end: Date
  nights: number
}

export interface SplitStaySuggestion {
  type: 'full' | 'split'
  totalNights: number
  segments: AvailabilitySegment[]
  properties: Record<string, unknown>[]
  message: string
}

export interface PropertyAvailabilityResult {
  property: Record<string, unknown>
  status: 'available' | 'partial' | 'unavailable'
  availableNights: number
  totalRequestedNights: number
  availableDates?: DateRange[]
  unavailableDates?: DateRange[]
}

export interface BookingSegment {
  propertyId: string
  propertyTitle: string
  checkIn: Date
  checkOut: Date
  nights: number
  pricePerNight: number
  totalPrice: number
}

export interface BookingPlan {
  type: 'single' | 'split'
  segments: BookingSegment[]
  totalNights: number
  totalPrice: number
  guests: {
    adults: number
    children: number
  }
}

export function calculateNights(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function checkDateInAvailabilityRanges(
  date: Date,
  ranges: { start: string; end: string }[] | undefined | null
): boolean {
  if (!ranges) return true
  if (!Array.isArray(ranges)) return true
  if (ranges.length === 0) return true
  
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i]
    if (!range || !range.start || !range.end) continue
    const start = new Date(range.start)
    const end = new Date(range.end)
    if (date >= start && date <= end) {
      return true
    }
  }
  return false
}

export function isDateAvailable(
  date: Date,
  availability: { start: string; end: string }[] | undefined | null,
  propertyId?: string
): boolean {
  const inRange = checkDateInAvailabilityRanges(date, availability)
  if (!inRange) return false
  if (propertyId) {
    return !isDateBlocked(propertyId, date)
  }
  return true
}

export function isRangeFullyAvailable(
  checkIn: Date,
  checkOut: Date,
  availability: { start: string; end: string }[] | undefined | null
): boolean {
  const currentDate = new Date(checkIn)
  while (currentDate < checkOut) {
    if (!isDateAvailable(currentDate, availability)) {
      return false
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return true
}

export function getAvailableNightsInRange(
  checkIn: Date,
  checkOut: Date,
  availability: { start: string; end: string }[] | undefined | null
): { availableNights: number; availableDates: DateRange[]; unavailableDates: DateRange[] } {
  const availableDates: DateRange[] = []
  const unavailableDates: DateRange[] = []
  let availableNights = 0
  let currentRangeStart: Date | null = null
  let currentRangeIsAvailable: boolean | null = null
  const currentDate = new Date(checkIn)
  
  while (currentDate < checkOut) {
    const isAvailable = isDateAvailable(currentDate, availability)
    if (isAvailable) availableNights++
    
    if (currentRangeIsAvailable === null) {
      currentRangeStart = new Date(currentDate)
      currentRangeIsAvailable = isAvailable
    } else if (currentRangeIsAvailable !== isAvailable) {
      const range = { start: currentRangeStart!, end: new Date(currentDate) }
      if (currentRangeIsAvailable) {
        availableDates.push(range)
      } else {
        unavailableDates.push(range)
      }
      currentRangeStart = new Date(currentDate)
      currentRangeIsAvailable = isAvailable
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  if (currentRangeStart && currentRangeIsAvailable !== null) {
    const range = { start: currentRangeStart, end: new Date(currentDate) }
    if (currentRangeIsAvailable) {
      availableDates.push(range)
    } else {
      unavailableDates.push(range)
    }
  }
  
  return { availableNights, availableDates, unavailableDates }
}

export function checkPropertyAvailability(
  property: { availability?: { start: string; end: string }[] } & Omit<Property, 'availability'>,
  checkIn: Date,
  checkOut: Date
): PropertyAvailabilityResult {
  const totalRequestedNights = calculateNights(checkIn, checkOut)
  const { availableNights, availableDates, unavailableDates } = getAvailableNightsInRange(
    checkIn,
    checkOut,
    property.availability
  )
  
  let status: 'available' | 'partial' | 'unavailable'
  if (availableNights === totalRequestedNights) {
    status = 'available'
  } else if (availableNights > 0) {
    status = 'partial'
  } else {
    status = 'unavailable'
  }
  
  return {
    property,
    status,
    availableNights,
    totalRequestedNights,
    availableDates: availableDates.length > 0 ? availableDates : undefined,
    unavailableDates: unavailableDates.length > 0 ? unavailableDates : undefined
  }
}

export function filterPropertiesByAvailability(
  properties: Property[],
  checkIn: Date | null,
  checkOut: Date | null
): { available: Property[]; partial: PropertyAvailabilityResult[]; unavailable: Property[] } {
  if (!checkIn || !checkOut) {
    return { available: properties, partial: [], unavailable: [] }
  }
  
  const available: Property[] = []
  const partial: PropertyAvailabilityResult[] = []
  const unavailable: Property[] = []
  
  properties.forEach(property => {
    const result = checkPropertyAvailability(property, checkIn, checkOut)
    if (result.status === 'available') {
      available.push(property)
    } else if (result.status === 'partial') {
      partial.push(result)
    } else {
      unavailable.push(property)
    }
  })
  
  return { available, partial, unavailable }
}

type PropertyForAlternative = {
  id: string
  type?: string
  location?: { district?: string }
  pricePerNight?: number
  totalGuestCapacity?: number
  availability?: { start: string; end: string }[]
}

export function findAlternativeProperties(
  originalProperty: PropertyForAlternative,
  unavailableDates: DateRange[],
  allProperties: PropertyForAlternative[]
): PropertyForAlternative[] {
  const alternatives: PropertyForAlternative[] = []
  
  for (const dateRange of unavailableDates) {
    const availableForRange = allProperties.filter(p => {
      if (p.id === originalProperty.id) return false
      return isRangeFullyAvailable(dateRange.start, dateRange.end, p.availability)
    })
    
    availableForRange.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0
      
      if (a.type && originalProperty.type && a.type === originalProperty.type) scoreA += 3
      if (b.type && originalProperty.type && b.type === originalProperty.type) scoreB += 3
      
      if (a.location?.district && originalProperty.location?.district && a.location.district === originalProperty.location.district) scoreA += 2
      if (b.location?.district && originalProperty.location?.district && b.location.district === originalProperty.location.district) scoreB += 2
      
      const originalPrice = originalProperty.pricePerNight || 0
      const priceRangeMin = originalPrice * 0.7
      const priceRangeMax = originalPrice * 1.3
      const priceA = a.pricePerNight || 0
      const priceB = b.pricePerNight || 0
      if (priceA >= priceRangeMin && priceA <= priceRangeMax) scoreA += 1
      if (priceB >= priceRangeMin && priceB <= priceRangeMax) scoreB += 1
      
      const originalCapacity = originalProperty.totalGuestCapacity || 0
      if ((a.totalGuestCapacity || 0) >= originalCapacity) scoreA += 1
      if ((b.totalGuestCapacity || 0) >= originalCapacity) scoreB += 1
      
      return scoreB - scoreA
    })
    
    if (availableForRange.length > 0) {
      alternatives.push(availableForRange[0])
    }
  }
  
  return alternatives
}

type PropertyWithOptionalAvailability = { 
  id: string
  availability?: { start: string; end: string }[] 
} & Record<string, unknown>

export function generateSplitStaySuggestion(
  selectedProperty: PropertyWithOptionalAvailability,
  checkIn: Date,
  checkOut: Date,
  allProperties: PropertyWithOptionalAvailability[]
): SplitStaySuggestion | null {
  const result = checkPropertyAvailability(selectedProperty, checkIn, checkOut)
  
  if (result.status === 'available') {
    return {
      type: 'full',
      totalNights: result.totalRequestedNights,
      segments: [{
        propertyId: selectedProperty.id,
        start: checkIn,
        end: checkOut,
        nights: result.totalRequestedNights
      }],
      properties: [selectedProperty],
      message: 'Your selected property is available for your entire stay.'
    }
  }
  
  if (result.status === 'unavailable' || !result.availableDates || !result.unavailableDates) {
    return null
  }
  
  const alternatives = findAlternativeProperties(
    selectedProperty,
    result.unavailableDates,
    allProperties
  )
  
  if (alternatives.length < result.unavailableDates.length) {
    return null
  }
  
  const segments: AvailabilitySegment[] = []
  const properties: PropertyWithOptionalAvailability[] = [selectedProperty]
  
  result.availableDates.forEach(range => {
    segments.push({
      propertyId: selectedProperty.id,
      start: range.start,
      end: range.end,
      nights: calculateNights(range.start, range.end)
    })
  })
  
  result.unavailableDates.forEach((range, index) => {
    const alternative = alternatives[index]
    if (alternative) {
      segments.push({
        propertyId: alternative.id,
        start: range.start,
        end: range.end,
        nights: calculateNights(range.start, range.end)
      })
      if (!properties.find(p => p.id === alternative.id)) {
        properties.push(alternative)
      }
    }
  })
  
  segments.sort((a, b) => a.start.getTime() - b.start.getTime())
  
  return {
    type: 'split',
    totalNights: result.totalRequestedNights,
    segments,
    properties,
    message: `Your selected property is available for ${result.availableNights} nights. We have prepared a seamless premium alternative for the remaining nights.`
  }
}

export function createBookingPlan(
  segments: AvailabilitySegment[],
  properties: Property[],
  guests: { adults: number; children: number }
): BookingPlan {
  const bookingSegments: BookingSegment[] = segments.map(segment => {
    const property = properties.find(p => p.id === segment.propertyId)!
    return {
      propertyId: segment.propertyId,
      propertyTitle: property.title,
      checkIn: segment.start,
      checkOut: segment.end,
      nights: segment.nights,
      pricePerNight: property.pricePerNight,
      totalPrice: property.pricePerNight * segment.nights
    }
  })
  
  const totalNights = bookingSegments.reduce((sum, seg) => sum + seg.nights, 0)
  const totalPrice = bookingSegments.reduce((sum, seg) => sum + seg.totalPrice, 0)
  
  return {
    type: bookingSegments.length > 1 ? 'split' : 'single',
    segments: bookingSegments,
    totalNights,
    totalPrice,
    guests
  }
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${startStr} - ${endStr}`
}
