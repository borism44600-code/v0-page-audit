'use client'

import { useState, useMemo } from 'react'
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

export default function PropertiesPage() {
  const [filters, setFilters] = useState<PropertyFiltersState>(defaultFilters)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('medium')

  const filteredProperties = useMemo(() => {
    return mockProperties.filter(property => {
      // Price filter
      if (property.pricePerNight < filters.priceRange[0] || 
          property.pricePerNight > filters.priceRange[1]) {
        return false
      }

      // District filter
      if (filters.districts.length > 0) {
        const propertyDistrict = property.location.subDistrict || property.location.district
        if (!filters.districts.some(d => propertyDistrict.includes(d))) {
          return false
        }
      }

      // Distance filter
      if (filters.distanceFromCenter.length > 0 && property.location.distanceFromCenter) {
        if (!filters.distanceFromCenter.includes(property.location.distanceFromCenter)) {
          return false
        }
      }

      // Features filter
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(
          feature => property.features[feature as keyof PropertyFeatures]
        )
        if (!hasAllFeatures) {
          return false
        }
      }

      // Parking filter
      if (filters.parking.length > 0) {
        if (!filters.parking.includes(property.parking)) {
          return false
        }
      }

      return true
    })
  }, [filters])

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        {/* Page Header */}
        <section className="bg-secondary/30 py-12 mb-8">
          <div className="container mx-auto px-6">
            <p className="luxury-subheading text-muted-foreground mb-3">Our Collection</p>
            <h1 className="text-3xl md:text-4xl font-semibold luxury-heading">
              All Properties
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Browse our selection of riads, villas, and apartments in Marrakech. 
              We keep our collection small so we can know each property well.
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="container mx-auto px-6">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <PropertyFilters 
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters(defaultFilters)}
            />

            {/* Properties */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{filteredProperties.length}</span>
                  {' '}properties found
                </p>
                <div className="flex items-center gap-4">
                  {/* Mobile Filters Button (rendered inside PropertyFilters) */}
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

              {/* Properties Grid */}
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
