'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AvailabilityCalendarProps {
  availability: { start: string; end: string }[]
  selectedDates?: { start: Date | null; end: Date | null }
  onDateSelect?: (dates: { start: Date | null; end: Date | null }) => void
  readOnly?: boolean
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function AvailabilityCalendar({ 
  availability, 
  selectedDates,
  onDateSelect,
  readOnly = false 
}: AvailabilityCalendarProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectingStart, setSelectingStart] = useState(true)

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const isDateAvailable = (date: Date) => {
    return availability.some(range => {
      const start = new Date(range.start)
      const end = new Date(range.end)
      return date >= start && date <= end
    })
  }

  const isDateInPast = (date: Date) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayStart
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDates?.start) return false
    
    const dateTime = date.getTime()
    const startTime = selectedDates.start.getTime()
    
    if (!selectedDates.end) {
      return dateTime === startTime
    }
    
    const endTime = selectedDates.end.getTime()
    return dateTime >= startTime && dateTime <= endTime
  }

  const isStartDate = (date: Date) => {
    if (!selectedDates?.start) return false
    return date.getTime() === selectedDates.start.getTime()
  }

  const isEndDate = (date: Date) => {
    if (!selectedDates?.end) return false
    return date.getTime() === selectedDates.end.getTime()
  }

  const handleDateClick = (date: Date) => {
    if (readOnly || !onDateSelect || isDateInPast(date) || !isDateAvailable(date)) return

    if (selectingStart) {
      onDateSelect({ start: date, end: null })
      setSelectingStart(false)
    } else {
      if (selectedDates?.start && date < selectedDates.start) {
        onDateSelect({ start: date, end: selectedDates.start })
      } else {
        onDateSelect({ start: selectedDates?.start || null, end: date })
      }
      setSelectingStart(true)
    }
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const days = []
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10" />)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const isPast = isDateInPast(date)
    const isAvailable = isDateAvailable(date)
    const isSelected = isDateSelected(date)
    const isStart = isStartDate(date)
    const isEnd = isEndDate(date)
    
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(date)}
        disabled={readOnly || isPast || !isAvailable}
        className={cn(
          'h-10 rounded-md text-sm font-medium transition-colors relative',
          isPast && 'text-muted-foreground/30 cursor-not-allowed',
          !isPast && !isAvailable && 'text-muted-foreground/50 cursor-not-allowed line-through',
          !isPast && isAvailable && !readOnly && 'hover:bg-secondary cursor-pointer',
          isSelected && 'bg-primary/10',
          (isStart || isEnd) && 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {day}
      </button>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Availability</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="h-10 flex items-center justify-center text-xs text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span className="text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-background border border-border" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted line-through text-center text-xs text-muted-foreground">X</div>
          <span className="text-muted-foreground">Unavailable</span>
        </div>
      </div>
    </div>
  )
}
