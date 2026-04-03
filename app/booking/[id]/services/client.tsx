'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, Users, CheckCircle2, 
  AlertCircle, Clock, Home, Coffee, UtensilsCrossed,
  Plane, Plus, Minus, Loader2, Trash2
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  setBreakfastsForDates,
  setTransfers,
  addMeal,
  removeMeal
} from '@/app/admin/services/actions'
import { cn } from '@/lib/utils'

interface BookingServicesClientProps {
  booking: {
    id: string
    propertyId: string
    propertyName: string
    propertySlug: string
    checkIn: string
    checkOut: string
    guests: { adults: number; children: number }
    status: string
    breakfastTotal: number
    mealsTotal: number
    transfersTotal: number
    extrasTotal: number
    servicesTotal: number
  }
  pricing: {
    breakfast_available: boolean
    breakfast_adult_price: number
    breakfast_child_price: number
    breakfast_child_age_limit: number
    lunch_available: boolean
    lunch_adult_price: number
    lunch_child_price: number
    dinner_available: boolean
    dinner_adult_price: number
    dinner_child_price: number
    transfer_available: boolean
    transfer_arrival_price: number
    transfer_departure_price: number
    transfer_roundtrip_price: number
    transfer_max_passengers: number
    transfer_vehicle_type: string
    extra_bed_available: boolean
    extra_bed_price: number
    crib_available: boolean
    crib_price: number
  }
  initialServices: {
    breakfasts: Array<{
      id: string
      date: string
      adults_count: number
      children_count: number
      total_price: number
    }>
    meals: Array<{
      id: string
      date: string
      meal_type: string
      adults_count: number
      children_count: number
      total_price: number
    }>
    transfers: Array<{
      id: string
      transfer_type: string
      transfer_datetime: string
      flight_number: string
      passengers_count: number
      price: number
    }>
    extras: Array<{
      id: string
      extra_type: string
      quantity: number
      total_price: number
    }>
  }
}

export function BookingServicesClient({ booking, pricing, initialServices }: BookingServicesClientProps) {
  const [isPending, startTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Generate dates for the stay
  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)
  const stayDates: string[] = []
  const current = new Date(checkInDate)
  while (current < checkOutDate) {
    stayDates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  const nights = stayDates.length
  
  // Breakfast state
  const [selectedBreakfastDates, setSelectedBreakfastDates] = useState<string[]>(
    initialServices.breakfasts.map(b => b.date)
  )
  const [breakfastAdults, setBreakfastAdults] = useState(booking.guests.adults)
  const [breakfastChildren, setBreakfastChildren] = useState(booking.guests.children)
  
  // Transfer state
  const [arrivalTransfer, setArrivalTransfer] = useState({
    enabled: initialServices.transfers.some(t => t.transfer_type === 'arrival'),
    datetime: initialServices.transfers.find(t => t.transfer_type === 'arrival')?.transfer_datetime || `${booking.checkIn}T14:00`,
    flightNumber: initialServices.transfers.find(t => t.transfer_type === 'arrival')?.flight_number || '',
    passengers: initialServices.transfers.find(t => t.transfer_type === 'arrival')?.passengers_count || booking.guests.adults + booking.guests.children
  })
  
  const [departureTransfer, setDepartureTransfer] = useState({
    enabled: initialServices.transfers.some(t => t.transfer_type === 'departure'),
    datetime: initialServices.transfers.find(t => t.transfer_type === 'departure')?.transfer_datetime || `${booking.checkOut}T10:00`,
    flightNumber: initialServices.transfers.find(t => t.transfer_type === 'departure')?.flight_number || '',
    passengers: initialServices.transfers.find(t => t.transfer_type === 'departure')?.passengers_count || booking.guests.adults + booking.guests.children
  })

  // Calculate totals
  const breakfastTotal = selectedBreakfastDates.length * (
    (breakfastAdults * pricing.breakfast_adult_price) + 
    (breakfastChildren * pricing.breakfast_child_price)
  )
  
  const transferTotal = 
    (arrivalTransfer.enabled ? pricing.transfer_arrival_price : 0) +
    (departureTransfer.enabled ? pricing.transfer_departure_price : 0)
  
  const totalServices = breakfastTotal + transferTotal

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const toggleBreakfastDate = (date: string) => {
    setSelectedBreakfastDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    )
  }
  
  const selectAllBreakfasts = () => {
    setSelectedBreakfastDates(stayDates)
  }
  
  const clearAllBreakfasts = () => {
    setSelectedBreakfastDates([])
  }

  const handleSave = () => {
    startTransition(async () => {
      // Save breakfasts
      await setBreakfastsForDates(
        booking.id,
        selectedBreakfastDates,
        breakfastAdults,
        breakfastChildren,
        pricing.breakfast_adult_price,
        pricing.breakfast_child_price
      )
      
      // Save transfers
      await setTransfers(
        booking.id,
        arrivalTransfer.enabled ? {
          enabled: true,
          datetime: arrivalTransfer.datetime,
          flightNumber: arrivalTransfer.flightNumber,
          passengers: arrivalTransfer.passengers,
          price: pricing.transfer_arrival_price
        } : null,
        departureTransfer.enabled ? {
          enabled: true,
          datetime: departureTransfer.datetime,
          flightNumber: departureTransfer.flightNumber,
          passengers: departureTransfer.passengers,
          price: pricing.transfer_departure_price
        } : null
      )
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Back Link */}
          <Link 
            href={`/booking/${booking.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Booking Details
          </Link>

          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border overflow-hidden mb-8"
          >
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Reference</p>
                  <p className="text-xl font-semibold font-mono">{booking.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  {booking.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-lg font-medium">
                <Home className="w-5 h-5 text-primary" />
                {booking.propertyName}
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  Check-in
                </div>
                <p className="font-medium">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  Check-out
                </div>
                <p className="font-medium">{formatDate(booking.checkOut)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  Duration
                </div>
                <p className="font-medium">{nights} nights</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  Guests
                </div>
                <p className="font-medium">
                  {booking.guests.adults} adult{booking.guests.adults > 1 ? 's' : ''}
                  {booking.guests.children > 0 && `, ${booking.guests.children} child${booking.guests.children > 1 ? 'ren' : ''}`}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Success Message */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-green-700 dark:text-green-400">Your services have been saved successfully.</p>
            </motion.div>
          )}

          {/* Breakfast Section */}
          {pricing.breakfast_available && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Breakfast</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {pricing.breakfast_adult_price}€/adult, {pricing.breakfast_child_price}€/child (under {pricing.breakfast_child_age_limit})
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Guest counts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Adults</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setBreakfastAdults(Math.max(1, breakfastAdults - 1))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{breakfastAdults}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setBreakfastAdults(breakfastAdults + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Children</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setBreakfastChildren(Math.max(0, breakfastChildren - 1))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{breakfastChildren}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setBreakfastChildren(breakfastChildren + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Select breakfast dates</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAllBreakfasts}>
                          Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearAllBreakfasts}>
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {stayDates.map(date => (
                        <button
                          key={date}
                          onClick={() => toggleBreakfastDate(date)}
                          className={cn(
                            "p-3 rounded-lg border text-sm transition-colors",
                            selectedBreakfastDates.includes(date)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:border-primary/50"
                          )}
                        >
                          {formatShortDate(date)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedBreakfastDates.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {selectedBreakfastDates.length} breakfast{selectedBreakfastDates.length > 1 ? 's' : ''} selected
                        </span>
                        <span className="text-lg font-semibold">{breakfastTotal}€</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Transfer Section */}
          {pricing.transfer_available && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Airport Transfer</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {pricing.transfer_arrival_price}€ arrival, {pricing.transfer_departure_price}€ departure ({pricing.transfer_vehicle_type}, max {pricing.transfer_max_passengers} passengers)
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Arrival Transfer */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Arrival Transfer (Airport to Property)</Label>
                      <Switch
                        checked={arrivalTransfer.enabled}
                        onCheckedChange={(checked) => setArrivalTransfer(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                    {arrivalTransfer.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-primary">
                        <div className="space-y-2">
                          <Label>Arrival Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={arrivalTransfer.datetime}
                            onChange={(e) => setArrivalTransfer(prev => ({ ...prev, datetime: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Flight Number</Label>
                          <Input
                            placeholder="e.g., AT123"
                            value={arrivalTransfer.flightNumber}
                            onChange={(e) => setArrivalTransfer(prev => ({ ...prev, flightNumber: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Passengers</Label>
                          <Input
                            type="number"
                            min="1"
                            max={pricing.transfer_max_passengers}
                            value={arrivalTransfer.passengers}
                            onChange={(e) => setArrivalTransfer(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Departure Transfer */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Departure Transfer (Property to Airport)</Label>
                      <Switch
                        checked={departureTransfer.enabled}
                        onCheckedChange={(checked) => setDepartureTransfer(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                    {departureTransfer.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-primary">
                        <div className="space-y-2">
                          <Label>Departure Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={departureTransfer.datetime}
                            onChange={(e) => setDepartureTransfer(prev => ({ ...prev, datetime: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Flight Number</Label>
                          <Input
                            placeholder="e.g., AT456"
                            value={departureTransfer.flightNumber}
                            onChange={(e) => setDepartureTransfer(prev => ({ ...prev, flightNumber: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Passengers</Label>
                          <Input
                            type="number"
                            min="1"
                            max={pricing.transfer_max_passengers}
                            value={departureTransfer.passengers}
                            onChange={(e) => setDepartureTransfer(prev => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {(arrivalTransfer.enabled || departureTransfer.enabled) && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {arrivalTransfer.enabled && departureTransfer.enabled 
                            ? 'Round trip' 
                            : arrivalTransfer.enabled 
                              ? 'Arrival only' 
                              : 'Departure only'}
                        </span>
                        <span className="text-lg font-semibold">{transferTotal}€</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Total & Save */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Total Services</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedBreakfastDates.length > 0 && `${selectedBreakfastDates.length} breakfasts`}
                  {selectedBreakfastDates.length > 0 && (arrivalTransfer.enabled || departureTransfer.enabled) && ' + '}
                  {arrivalTransfer.enabled && 'arrival'}
                  {arrivalTransfer.enabled && departureTransfer.enabled && ' + '}
                  {departureTransfer.enabled && 'departure'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{totalServices}€</p>
              </div>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={isPending} 
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Services'
              )}
            </Button>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-muted/30 rounded-xl p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Need assistance?</p>
                <p>
                  Our concierge team is available to help you plan your perfect stay. 
                  Contact us at <a href="mailto:contact@marrakech-riads.com" className="text-primary hover:underline">contact@marrakech-riads.com</a>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
