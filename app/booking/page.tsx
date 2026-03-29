'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Calendar, Users, Plus, Minus, Check, ArrowRight, ArrowLeft,
  CreditCard, MapPin, Bed, Bath 
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AvailabilityCalendar } from '@/components/properties/availability-calendar'
import { mockProperties, mockAddons } from '@/lib/data'
import { cn } from '@/lib/utils'

function BookingContent() {
  const searchParams = useSearchParams()
  const preselectedPropertyId = searchParams.get('property')
  
  const [step, setStep] = useState(1)
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedPropertyId || '')
  const [dates, setDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [guests, setGuests] = useState({ adults: 2, children: 0 })
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; quantity: number; persons: number }[]>([])
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' })

  const selectedProperty = mockProperties.find(p => p.id === selectedPropertyId)

  const calculateNights = () => {
    if (!dates.start || !dates.end) return 0
    const diff = dates.end.getTime() - dates.start.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()

  const calculateTotal = () => {
    if (!selectedProperty) return 0
    
    let total = selectedProperty.pricePerNight * nights
    
    selectedAddons.forEach(addon => {
      const addonData = mockAddons.find(a => a.id === addon.id)
      if (addonData) {
        if (addonData.pricePerPerson) {
          total += addonData.pricePerPerson * addon.persons * addon.quantity
        } else if (addonData.priceFlat) {
          total += addonData.priceFlat * addon.quantity
        }
      }
    })
    
    return total
  }

  const total = calculateTotal()

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addonId)
      if (exists) {
        return prev.filter(a => a.id !== addonId)
      }
      return [...prev, { id: addonId, quantity: 1, persons: guests.adults + guests.children }]
    })
  }

  const updateAddonQuantity = (addonId: string, delta: number) => {
    setSelectedAddons(prev => prev.map(a => {
      if (a.id === addonId) {
        return { ...a, quantity: Math.max(1, a.quantity + delta) }
      }
      return a
    }))
  }

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedPropertyId
      case 2: return dates.start && dates.end && nights > 0
      case 3: return guests.adults >= 1
      case 4: return true
      case 5: return contactInfo.name && contactInfo.email && contactInfo.phone
      default: return false
    }
  }

  const steps = [
    { number: 1, title: 'Property' },
    { number: 2, title: 'Dates' },
    { number: 3, title: 'Guests' },
    { number: 4, title: 'Add-ons' },
    { number: 5, title: 'Details' },
    { number: 6, title: 'Confirm' },
  ]

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-6">
          {/* Page Title */}
          <div className="text-center mb-12">
            <p className="luxury-subheading text-muted-foreground mb-3">Reservation</p>
            <h1 className="text-3xl md:text-4xl font-semibold luxury-heading">
              Book Your Stay
            </h1>
          </div>

          {/* Steps Indicator */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                        step >= s.number 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                    </div>
                    <span className="text-xs mt-2 text-muted-foreground hidden sm:block">
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={cn(
                        'w-12 md:w-24 h-0.5 mx-2',
                        step > s.number ? 'bg-primary' : 'bg-muted'
                      )} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Step 1: Select Property */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Select a Property</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockProperties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => setSelectedPropertyId(property.id)}
                      className={cn(
                        'text-left p-4 rounded-lg border-2 transition-all',
                        selectedPropertyId === property.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={property.images[0] || '/images/placeholder-property.jpg'}
                            alt={property.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{property.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {property.location.district}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Bed className="w-3 h-3" />{property.bedrooms}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="w-3 h-3" />{property.bathrooms}
                            </span>
                          </div>
                          <p className="mt-2 font-semibold">{property.pricePerNight}€<span className="text-sm font-normal text-muted-foreground">/night</span></p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Dates */}
            {step === 2 && selectedProperty && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Select Your Dates</h2>
                <AvailabilityCalendar
                  availability={selectedProperty.availability}
                  selectedDates={dates}
                  onDateSelect={setDates}
                />
                {dates.start && dates.end && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Check-in</p>
                        <p className="font-medium">{dates.start.toLocaleDateString()}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Check-out</p>
                        <p className="font-medium">{dates.end.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{nights} nights</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Guests */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Number of Guests</h2>
                {selectedProperty && (
                  <p className="text-muted-foreground">
                    Maximum capacity: {selectedProperty.maxGuests} guests
                  </p>
                )}
                <div className="space-y-4 max-w-sm">
                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Adults</p>
                      <p className="text-sm text-muted-foreground">Age 13+</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                        disabled={guests.adults <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{guests.adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(g => ({ ...g, adults: g.adults + 1 }))}
                        disabled={selectedProperty && guests.adults + guests.children >= selectedProperty.maxGuests}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Children</p>
                      <p className="text-sm text-muted-foreground">Ages 2-12</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))}
                        disabled={guests.children <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{guests.children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(g => ({ ...g, children: g.children + 1 }))}
                        disabled={selectedProperty && guests.adults + guests.children >= selectedProperty.maxGuests}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Add-ons */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Optional Add-ons</h2>
                <p className="text-muted-foreground">Enhance your stay with our premium services.</p>
                <div className="space-y-4">
                  {mockAddons.map((addon) => {
                    const isSelected = selectedAddons.some(a => a.id === addon.id)
                    const addonState = selectedAddons.find(a => a.id === addon.id)
                    
                    return (
                      <div 
                        key={addon.id}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all',
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            id={addon.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleAddon(addon.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={addon.id} className="font-medium cursor-pointer">
                              {addon.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {addon.description}
                            </p>
                            <p className="text-sm font-medium mt-2">
                              {addon.pricePerPerson 
                                ? `${addon.pricePerPerson}€ per person` 
                                : `${addon.priceFlat}€`}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateAddonQuantity(addon.id, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center">{addonState?.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateAddonQuantity(addon.id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Contact Details */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Contact Information</h2>
                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo(c => ({ ...c, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(c => ({ ...c, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo(c => ({ ...c, phone: e.target.value }))}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {step === 6 && selectedProperty && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold">Booking Summary</h2>
                
                <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                  {/* Property */}
                  <div className="flex gap-4">
                    <div className="relative w-32 h-24 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedProperty.images[0] || '/images/placeholder-property.jpg'}
                        alt={selectedProperty.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedProperty.title}</h3>
                      <p className="text-muted-foreground">{selectedProperty.location.district}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="font-medium">{dates.start?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="font-medium">{dates.end?.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Guests</p>
                      <p className="font-medium">
                        {guests.adults} adults{guests.children > 0 && `, ${guests.children} children`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{nights} nights</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>{selectedProperty.pricePerNight}€ x {nights} nights</span>
                      <span>{selectedProperty.pricePerNight * nights}€</span>
                    </div>
                    {selectedAddons.map(addon => {
                      const addonData = mockAddons.find(a => a.id === addon.id)
                      if (!addonData) return null
                      const price = addonData.pricePerPerson 
                        ? addonData.pricePerPerson * addon.persons * addon.quantity
                        : (addonData.priceFlat || 0) * addon.quantity
                      return (
                        <div key={addon.id} className="flex justify-between text-sm">
                          <span>{addonData.name} x{addon.quantity}</span>
                          <span>{price}€</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                      <span>Total</span>
                      <span>{total}€</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <p className="text-sm text-muted-foreground">{contactInfo.name}</p>
                    <p className="text-sm text-muted-foreground">{contactInfo.email}</p>
                    <p className="text-sm text-muted-foreground">{contactInfo.phone}</p>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Payment will be collected upon confirmation. Our team will contact you within 24 hours.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              {step < 6 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Confirm Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BookingContent />
    </Suspense>
  )
}
