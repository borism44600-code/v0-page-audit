'use client'

import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { 
  Bed, Bath, Users, MapPin, Check, ArrowRight, 
  Utensils, Car, Sparkles, Mountain, Calendar 
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ImageGallery } from '@/components/properties/image-gallery'
import { AvailabilityCalendar } from '@/components/properties/availability-calendar'
import { Button } from '@/components/ui/button'
import { mockProperties, mockServices, mockAddons } from '@/lib/data'
import { FEATURE_LABELS, type PropertyFeatures } from '@/lib/types'
import { cn } from '@/lib/utils'

const serviceIcons = {
  breakfast: Utensils,
  meals: Utensils,
  excursion: Mountain,
  spa: Sparkles,
  transport: Car,
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const property = mockProperties.find(p => p.id === id)

  if (!property) {
    notFound()
  }

  const activeFeatures = (Object.entries(property.features) as [keyof PropertyFeatures, boolean][])
    .filter(([, value]) => value)
    .map(([key]) => ({ key, label: FEATURE_LABELS[key] }))

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/properties" className="hover:text-foreground transition-colors">
              Properties
            </Link>
            <span>/</span>
            <Link 
              href={`/properties/${property.type}s`} 
              className="hover:text-foreground transition-colors capitalize"
            >
              {property.type}s
            </Link>
            <span>/</span>
            <span className="text-foreground">{property.title}</span>
          </nav>
        </div>

        {/* Image Gallery */}
        <div className="container mx-auto px-6 mb-12">
          <ImageGallery images={property.images} title={property.title} />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Title & Location */}
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <span className="px-3 py-1 bg-secondary text-xs uppercase tracking-wider rounded-full">
                    {property.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {property.location.subDistrict || property.location.district}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold luxury-heading">
                  {property.title}
                </h1>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-6 mt-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5" />
                    <span>{property.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5" />
                    <span>{property.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>Up to {property.maxGuests} Guests</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-4">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Features & Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {activeFeatures.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Amenities */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Additional Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span 
                      key={amenity}
                      className="px-4 py-2 bg-secondary rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                <div className="bg-secondary/50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{property.location.district}</p>
                      {property.location.subDistrict && (
                        <p className="text-muted-foreground">{property.location.subDistrict}</p>
                      )}
                      {property.location.distanceFromCenter && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Distance from center: {property.location.distanceFromCenter.replace('-', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability Calendar */}
              <AvailabilityCalendar 
                availability={property.availability} 
                readOnly={true}
              />

              {/* Services Section */}
              <div>
                <h2 className="text-xl font-semibold mb-6">Experiences & Services</h2>
                <p className="text-muted-foreground mb-6">
                  Enhance your stay with our premium services, available on request.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockServices.slice(0, 4).map((service) => {
                    const IconComponent = serviceIcons[service.category] || Sparkles
                    return (
                      <div 
                        key={service.id}
                        className="flex gap-4 p-4 bg-card rounded-lg border border-border"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <Image 
                            src={service.image}
                            alt={service.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <IconComponent className="w-4 h-4 text-primary" />
                            <h4 className="font-medium text-sm">{service.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Link href="/services" className="inline-block mt-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    View All Services
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-lg border border-border p-6">
                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-semibold">{property.pricePerNight}€</span>
                  <span className="text-muted-foreground"> / night</span>
                </div>

                {/* Quick Info */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="capitalize font-medium">{property.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bedrooms</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Guests</span>
                    <span className="font-medium">{property.maxGuests}</span>
                  </div>
                </div>

                {/* Book Button */}
                <Link href={`/booking?property=${property.id}`}>
                  <Button size="lg" className="w-full gap-2">
                    <Calendar className="w-5 h-5" />
                    Book This Property
                  </Button>
                </Link>

                {/* Contact */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Questions about this property?</p>
                  <Link href="/contact" className="text-primary text-sm hover:underline">
                    Contact Us
                  </Link>
                </div>

                {/* Optional Add-ons Preview */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-medium mb-4">Optional Add-ons</h4>
                  <div className="space-y-3">
                    {mockAddons.slice(0, 3).map((addon) => (
                      <div key={addon.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{addon.name}</span>
                        <span className="font-medium">
                          {addon.pricePerPerson 
                            ? `${addon.pricePerPerson}€/person` 
                            : `${addon.priceFlat}€`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
