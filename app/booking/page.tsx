'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Calendar, Users, Plus, Minus, Check, ArrowRight, ArrowLeft,
  CreditCard, MapPin, Bed, Bath, Shield, Clock, Star, Phone,
  Sparkles, HeartHandshake, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AvailabilityCalendar } from '@/components/properties/availability-calendar'
import { mockProperties, mockAddons } from '@/lib/data'
import { cn } from '@/lib/utils'

const trustFeatures = [
  { icon: Shield, text: 'Secure Booking' },
  { icon: Clock, text: 'Here to Help' },
  { icon: HeartHandshake, text: 'Flexible Cancellation' }
]

function BookingContent() {
  const searchParams = useSearchParams()
  const preselectedPropertyId = searchParams.get('property')
  
  // If a property is preselected, skip to step 2 (Dates)
  const [step, setStep] = useState(preselectedPropertyId ? 2 : 1)
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedPropertyId || '')
  const [dates, setDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null })
  const [guests, setGuests] = useState({ adults: 2, children: 0 })
  const [selectedAddons, setSelectedAddons] = useState<{ id: string; quantity: number; persons: number }[]>([])
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '', specialRequests: '' })

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
    { number: 1, title: 'Property', description: 'Choose your stay' },
    { number: 2, title: 'Dates', description: 'When are you visiting' },
    { number: 3, title: 'Guests', description: 'Who is joining' },
    { number: 4, title: 'Extras', description: 'Optional services' },
    { number: 5, title: 'Details', description: 'Your information' },
    { number: 6, title: 'Confirm', description: 'Review & book' },
  ]

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        <div className="container mx-auto px-6">
          {/* Page Title with Trust Elements */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="luxury-subheading text-gold mb-3">Book Your Stay</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold luxury-heading mb-4">
              Reserve Your Property
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              A few simple steps and we&apos;ll confirm your booking within 24 hours.
            </p>
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {trustFeatures.map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Steps Indicator - Premium Design */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
                <motion.div 
                  className="h-full bg-gold"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              {steps.map((s) => (
                <div key={s.number} className="flex flex-col items-center relative z-10">
                  <motion.div 
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2',
                      step > s.number 
                        ? 'bg-gold border-gold text-black' 
                        : step === s.number 
                          ? 'bg-gold border-gold text-black shadow-lg shadow-gold/30' 
                          : 'bg-background border-muted text-muted-foreground'
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </motion.div>
                  <div className="mt-2 text-center hidden sm:block">
                    <span className={cn(
                      'text-xs font-medium block',
                      step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {s.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{s.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Property */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Choose Your Property</h2>
                    <p className="text-muted-foreground">Select from our collection of carefully chosen stays</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockProperties.map((property) => (
                      <motion.button
                        key={property.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPropertyId(property.id)}
                        className={cn(
                          'text-left p-4 rounded-xl border-2 transition-all',
                          selectedPropertyId === property.id
                            ? 'border-gold bg-gold/5 shadow-lg'
                            : 'border-border hover:border-gold/50'
                        )}
                      >
                        <div className="flex gap-4">
                          <div className="relative w-28 h-28 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={property.images[0] || '/images/placeholder-property.jpg'}
                              alt={property.title}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                            {selectedPropertyId === property.id && (
                              <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-gold" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs uppercase tracking-wider text-gold font-medium">{property.type}</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="w-3 h-3 fill-gold text-gold" />4.9
                              </span>
                            </div>
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
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />{property.maxGuests}
                              </span>
                            </div>
                            <p className="mt-2 font-semibold text-lg">{property.pricePerNight}€<span className="text-sm font-normal text-muted-foreground">/night</span></p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Select Dates */}
              {step === 2 && selectedProperty && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">When Will You Visit?</h2>
                    <p className="text-muted-foreground">Green dates are available for your perfect getaway</p>
                  </div>
                  <AvailabilityCalendar
                    availability={selectedProperty.availability}
                    selectedDates={dates}
                    onDateSelect={setDates}
                  />
                  {dates.start && dates.end && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gold/10 border border-gold/20 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Arrival</p>
                          <p className="font-semibold text-lg">{dates.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="w-20 h-px bg-gold/30 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                              <span className="text-sm font-medium text-gold">{nights} nights</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Departure</p>
                          <p className="font-semibold text-lg">{dates.end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Select Guests */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Who&apos;s Joining You?</h2>
                    {selectedProperty && (
                      <p className="text-muted-foreground">
                        {selectedProperty.title} welcomes up to {selectedProperty.maxGuests} guests
                      </p>
                    )}
                  </div>
                  <div className="space-y-4 max-w-md mx-auto">
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-5 bg-card rounded-xl border border-border"
                    >
                      <div>
                        <p className="font-medium text-lg">Adults</p>
                        <p className="text-sm text-muted-foreground">Age 13 and above</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                          disabled={guests.adults <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold text-xl">{guests.adults}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setGuests(g => ({ ...g, adults: g.adults + 1 }))}
                          disabled={selectedProperty && guests.adults + guests.children >= selectedProperty.maxGuests}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-5 bg-card rounded-xl border border-border"
                    >
                      <div>
                        <p className="font-medium text-lg">Children</p>
                        <p className="text-sm text-muted-foreground">Ages 2 to 12</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))}
                          disabled={guests.children <= 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold text-xl">{guests.children}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setGuests(g => ({ ...g, children: g.children + 1 }))}
                          disabled={selectedProperty && guests.adults + guests.children >= selectedProperty.maxGuests}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Add-ons */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Add Optional Services</h2>
                    <p className="text-muted-foreground">Optional enhancements to make your stay unforgettable</p>
                  </div>
                  <div className="space-y-4">
                    {mockAddons.map((addon) => {
                      const isSelected = selectedAddons.some(a => a.id === addon.id)
                      const addonState = selectedAddons.find(a => a.id === addon.id)
                      
                      return (
                        <motion.div 
                          key={addon.id}
                          whileHover={{ scale: 1.01 }}
                          className={cn(
                            'p-5 rounded-xl border-2 transition-all cursor-pointer',
                            isSelected ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'
                          )}
                          onClick={() => toggleAddon(addon.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5',
                              isSelected ? 'bg-gold border-gold' : 'border-muted-foreground'
                            )}>
                              {isSelected && <Check className="w-4 h-4 text-black" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4 text-gold" />
                                <span className="font-medium">{addon.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {addon.description}
                              </p>
                              <p className="text-sm font-semibold text-gold">
                                {addon.pricePerPerson 
                                  ? `${addon.pricePerPerson}€ per person` 
                                  : `${addon.priceFlat}€`}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => updateAddonQuantity(addon.id, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-medium">{addonState?.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => updateAddonQuantity(addon.id, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    You can always add experiences later or through your concierge
                  </p>
                </motion.div>
              )}

              {/* Step 5: Contact Details */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Almost There</h2>
                    <p className="text-muted-foreground">Share your details so we can confirm your booking</p>
                  </div>
                  <div className="max-w-md mx-auto space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="name"
                        value={contactInfo.name}
                        onChange={(e) => setContactInfo(c => ({ ...c, name: e.target.value }))}
                        placeholder="As it appears on your ID"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo(c => ({ ...c, email: e.target.value }))}
                        placeholder="We&apos;ll send confirmation here"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo(c => ({ ...c, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requests" className="text-sm font-medium">Special Requests <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                      <textarea
                        id="requests"
                        value={contactInfo.specialRequests}
                        onChange={(e) => setContactInfo(c => ({ ...c, specialRequests: e.target.value }))}
                        placeholder="Dietary requirements, celebration occasions, arrival time..."
                        className="w-full h-24 px-4 py-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/50"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Confirmation */}
              {step === 6 && selectedProperty && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Review Your Booking</h2>
                    <p className="text-muted-foreground">Please confirm all details before submitting</p>
                  </div>
                  
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {/* Property Header */}
                    <div className="p-6 border-b border-border">
                      <div className="flex gap-4">
                        <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={selectedProperty.images[0] || '/images/placeholder-property.jpg'}
                            alt={selectedProperty.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-wider text-gold font-medium">{selectedProperty.type}</span>
                          <h3 className="font-semibold text-lg">{selectedProperty.title}</h3>
                          <p className="text-muted-foreground flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3" />
                            {selectedProperty.location.district}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-border bg-secondary/30">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Check-in</p>
                        <p className="font-medium">{dates.start?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground">After 3:00 PM</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Check-out</p>
                        <p className="font-medium">{dates.end?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground">Before 11:00 AM</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Guests</p>
                        <p className="font-medium">
                          {guests.adults} adult{guests.adults > 1 ? 's' : ''}{guests.children > 0 && `, ${guests.children} child${guests.children > 1 ? 'ren' : ''}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Duration</p>
                        <p className="font-medium">{nights} night{nights > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-6 space-y-3 border-b border-border">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{selectedProperty.pricePerNight}€ x {nights} nights</span>
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
                            <span className="text-muted-foreground">{addonData.name} x{addon.quantity}</span>
                            <span>{price}€</span>
                          </div>
                        )
                      })}
                      <div className="flex justify-between font-semibold text-xl pt-3 border-t border-border">
                        <span>Total</span>
                        <span className="text-gold">{total}€</span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="p-6 bg-secondary/30">
                      <h4 className="font-medium mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Name</p>
                          <p className="font-medium">{contactInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{contactInfo.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{contactInfo.phone}</p>
                        </div>
                      </div>
                      {contactInfo.specialRequests && (
                        <div className="mt-4">
                          <p className="text-muted-foreground text-sm">Special Requests</p>
                          <p className="text-sm">{contactInfo.specialRequests}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reassurance */}
                  <div className="bg-gold/10 border border-gold/20 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gold" />
                        <span>Secure Booking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="w-5 h-5 text-gold" />
                        <span>Free Cancellation (48h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gold" />
                        <span>Confirmation within 24h</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mt-12 pt-6 border-t border-border"
            >
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
                  className="gap-2 bg-gold text-black hover:bg-gold/90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button className="gap-2 bg-gold text-black hover:bg-gold/90 px-8">
                  <CreditCard className="w-4 h-4" />
                  Confirm Booking
                </Button>
              )}
            </motion.div>

            {/* Help text */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Questions? <Link href="/contact" className="text-gold hover:underline">Contact our concierge</Link> or call <a href="tel:+212500000000" className="text-gold hover:underline">+212 5 00 00 00 00</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing your booking...</p>
        </div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
