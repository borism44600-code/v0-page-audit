'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isBefore,
  startOfDay,
  getDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUnavailableDates, getCalendarPrices } from '@/app/admin/pricing/actions'

interface AvailabilityCalendarProps {
  propertyId: string
  selectedCheckIn?: Date | null
  selectedCheckOut?: Date | null
  onDateSelect?: (checkIn: Date | null, checkOut: Date | null) => void
  className?: string
  compact?: boolean
  showPrices?: boolean
}

export function AvailabilityCalendar({
  propertyId,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  className,
  compact = false,
  showPrices = false,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingCheckOut, setSelectingCheckOut] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unavailableDates, setUnavailableDates] = useState<{ date: string; type: string }[]>([])
  const [prices, setPrices] = useState<{ date: string; price: number }[]>([])

  // Load unavailable dates from database
  useEffect(() => {
    let isMounted = true
    
    async function loadData() {
      setLoading(true)
      try {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(addMonths(currentMonth, compact ? 0 : 1))
        
        // Load unavailable dates
        const { data: unavailableData } = await getUnavailableDates(
          propertyId,
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        )
        
        if (isMounted && unavailableData) {
          setUnavailableDates(unavailableData)
        }
        
        // Load prices if needed
        if (showPrices) {
          const { data: pricesData } = await getCalendarPrices(
            propertyId,
            format(start, 'yyyy-MM-dd'),
            format(end, 'yyyy-MM-dd')
          )
          
          if (isMounted && pricesData) {
            setPrices(pricesData)
          }
        }
      } catch (error) {
        console.error('Error loading calendar data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [propertyId, currentMonth, compact, showPrices])

  const isDateUnavailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return unavailableDates.some(u => u.date === dateStr)
  }

  const getDatePrice = (date: Date): number | null => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const priceData = prices.find(p => p.date === dateStr)
    return priceData?.price || null
  }

  const getDateBlockType = (date: Date): string | null => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const block = unavailableDates.find(u => u.date === dateStr)
    return block?.type || null
  }

  const handleDateClick = (date: Date) => {
    if (isDateUnavailable(date) || isBefore(date, startOfDay(new Date()))) {
      return
    }

    if (!selectingCheckOut || !selectedCheckIn) {
      // Selecting check-in date
      onDateSelect?.(date, null)
      setSelectingCheckOut(true)
    } else {
      // Selecting check-out date
      if (isBefore(date, selectedCheckIn)) {
        // If selected date is before check-in, make it the new check-in
        onDateSelect?.(date, null)
      } else {
        // Check if any dates in range are unavailable
        const daysInRange = eachDayOfInterval({ start: selectedCheckIn, end: date })
        const hasUnavailableInRange = daysInRange.some(d => isDateUnavailable(d))
        
        if (hasUnavailableInRange) {
          // Reset selection if there are unavailable dates in range
          onDateSelect?.(date, null)
          setSelectingCheckOut(true)
        } else {
          onDateSelect?.(selectedCheckIn, date)
          setSelectingCheckOut(false)
        }
      }
    }
  }

  const isInRange = (date: Date) => {
    if (!selectedCheckIn || !selectedCheckOut) return false
    return date > selectedCheckIn && date < selectedCheckOut
  }

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDayOfWeek = getDay(monthStart)

    return (
      <div className="flex-1">
        <h3 className="text-center font-semibold text-foreground mb-4">
          {format(monthDate, 'MMMM yyyy')}
        </h3>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div 
              key={day} 
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className={cn("aspect-square", showPrices && "min-h-[48px]")} />
          ))}
          
          {/* Day cells */}
          {days.map((day) => {
            const unavailable = isDateUnavailable(day)
            const isPast = isBefore(day, startOfDay(new Date()))
            const isCheckIn = selectedCheckIn && isSameDay(day, selectedCheckIn)
            const isCheckOut = selectedCheckOut && isSameDay(day, selectedCheckOut)
            const inRange = isInRange(day)
            const isCurrentDay = isToday(day)
            const blockType = getDateBlockType(day)
            const price = showPrices ? getDatePrice(day) : null

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={unavailable || isPast}
                title={blockType ? `Blocked: ${blockType}` : undefined}
                className={cn(
                  'flex flex-col items-center justify-center text-sm rounded-md transition-colors',
                  showPrices ? 'min-h-[48px] py-1' : 'aspect-square',
                  'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  unavailable && 'bg-red-50 text-red-400 line-through cursor-not-allowed hover:bg-red-50',
                  blockType === 'booked' && 'bg-amber-50 text-amber-600',
                  blockType === 'airbnb' && 'bg-pink-50 text-pink-600',
                  blockType === 'booking' && 'bg-blue-50 text-blue-600',
                  isPast && 'text-muted-foreground cursor-not-allowed hover:bg-transparent',
                  isCheckIn && 'bg-primary text-primary-foreground hover:bg-primary',
                  isCheckOut && 'bg-primary text-primary-foreground hover:bg-primary',
                  inRange && 'bg-primary/20',
                  isCurrentDay && !isCheckIn && !isCheckOut && 'ring-1 ring-primary',
                )}
              >
                <span>{format(day, 'd')}</span>
                {showPrices && price && !unavailable && !isPast && (
                  <span className="text-[10px] text-muted-foreground">{price}€</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('bg-card rounded-lg border p-4', className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading availability...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-card rounded-lg border p-4', className)}>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {selectingCheckOut && selectedCheckIn 
              ? 'Select check-out date' 
              : 'Select check-in date'}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar months */}
      <div className={cn('flex gap-8', compact && 'gap-0')}>
        {renderMonth(currentMonth)}
        {!compact && renderMonth(addMonths(currentMonth, 1))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-pink-100 border border-pink-200" />
          <span>Airbnb</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span>Your stay</span>
        </div>
      </div>

      {/* Selection summary */}
      {(selectedCheckIn || selectedCheckOut) && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Check-in: </span>
              <span className="font-medium">
                {selectedCheckIn ? format(selectedCheckIn, 'MMM d, yyyy') : '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Check-out: </span>
              <span className="font-medium">
                {selectedCheckOut ? format(selectedCheckOut, 'MMM d, yyyy') : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
