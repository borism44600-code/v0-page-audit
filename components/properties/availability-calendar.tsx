'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isBefore,
  startOfDay,
  getDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUnavailableDates, isDateAvailable } from '@/lib/availability'

interface AvailabilityCalendarProps {
  propertyId: string
  selectedCheckIn?: Date | null
  selectedCheckOut?: Date | null
  onDateSelect?: (checkIn: Date | null, checkOut: Date | null) => void
  className?: string
  compact?: boolean
}

export function AvailabilityCalendar({
  propertyId,
  selectedCheckIn,
  selectedCheckOut,
  onDateSelect,
  className,
  compact = false,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingCheckOut, setSelectingCheckOut] = useState(false)

  // Get unavailable dates for the visible months
  const unavailableDates = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(addMonths(currentMonth, compact ? 0 : 1))
    return getUnavailableDates(propertyId, start, end)
  }, [propertyId, currentMonth, compact])

  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(unavailableDate => 
      isSameDay(unavailableDate, date)
    )
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
        onDateSelect?.(selectedCheckIn, date)
        setSelectingCheckOut(false)
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
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Day cells */}
          {days.map((day) => {
            const unavailable = isDateUnavailable(day)
            const isPast = isBefore(day, startOfDay(new Date()))
            const isCheckIn = selectedCheckIn && isSameDay(day, selectedCheckIn)
            const isCheckOut = selectedCheckOut && isSameDay(day, selectedCheckOut)
            const inRange = isInRange(day)
            const isCurrentDay = isToday(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={unavailable || isPast}
                className={cn(
                  'aspect-square flex items-center justify-center text-sm rounded-md transition-colors',
                  'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  unavailable && 'bg-muted text-muted-foreground line-through cursor-not-allowed hover:bg-muted',
                  isPast && 'text-muted-foreground cursor-not-allowed hover:bg-transparent',
                  isCheckIn && 'bg-primary text-primary-foreground hover:bg-primary',
                  isCheckOut && 'bg-primary text-primary-foreground hover:bg-primary',
                  inRange && 'bg-primary/20',
                  isCurrentDay && !isCheckIn && !isCheckOut && 'ring-1 ring-primary',
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
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
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Unavailable</span>
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
