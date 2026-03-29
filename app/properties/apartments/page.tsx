'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PropertyFilters, PropertyFiltersState } from '@/components/properties/property-filters'
import { PropertiesGrid } from '@/components/properties/properties-grid'
import { DisplayModeToggle, DisplayMode } from '@/components/properties/display-mode-toggle'
import { mockProperties } from '@/lib/data'
import { PropertyFeatures } from '@/lib/types'

const defaultFilters: PropertyFiltersState = {
  priceRange: [0, 2000],
  districts: [],
  distanceFromCenter: [],
  features: [],
  parking: [],
  availability: { start: null, end: null }
}

export default function ApartmentsPage() {
  const [filters, setFilters] = useState<PropertyFiltersState>(defaultFilters)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('medium')

  const apartments = mockProperties.filter(p => p.type === 'apartment')

  const filteredProperties = useMemo(() => {
    return apartments.filter(property => {
      if (property.pricePerNight < filters.priceRange[0] || 
          property.pricePerNight > filters.priceRange[1]) {
        return false
      }
      if (filters.districts.length > 0) {
        const propertyDistrict = property.location.subDistrict || property.location.district
        if (!filters.districts.some(d => propertyDistrict.includes(d))) {
          return false
        }
      }
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(
          feature => property.features[feature as keyof PropertyFeatures]
        )
        if (!hasAllFeatures) return false
      }
      if (filters.parking.length > 0 && !filters.parking.includes(property.parking)) {
        return false
      }
      return true
    })
  }, [filters, apartments])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
          <div className="absolute inset-0">
            <Image
              src="/images/categories/apartments.jpg"
              alt="Luxury Apartments"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative z-10 text-center text-white px-6">
            <p className="luxury-subheading text-white/80 mb-4">Modern Living</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold luxury-heading">
              Our Apartments
            </h1>
            <p className="mt-6 text-lg text-white/90 max-w-2xl mx-auto">
              Contemporary residences in prime locations, perfect for the modern traveler 
              seeking style and convenience.
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="flex gap-8">
            <PropertyFilters 
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters(defaultFilters)}
            />

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{filteredProperties.length}</span>
                  {' '}apartments found
                </p>
                <div className="flex items-center gap-4">
                  <div className="lg:hidden">
                    <PropertyFilters 
                      filters={filters}
                      onFiltersChange={setFilters}
                      onReset={() => setFilters(defaultFilters)}
                    />
                  </div>
                  <DisplayModeToggle mode={displayMode} onModeChange={setDisplayMode} />
                </div>
              </div>

              <PropertiesGrid 
                properties={filteredProperties} 
                displayMode={displayMode}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
