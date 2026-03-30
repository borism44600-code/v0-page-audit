'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, SlidersHorizontal, Info } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PropertyFilters, PropertyFiltersState } from '@/components/properties/property-filters'
import { PropertiesGrid } from '@/components/properties/properties-grid'
import { DisplayModeToggle, DisplayMode } from '@/components/properties/display-mode-toggle'
import { DateSearchBar } from '@/components/search/date-search-bar'
import { mockProperties } from '@/lib/data'
import { PropertyFeatures } from '@/lib/types'
import { filterPropertiesByAvailability, PropertyAvailabilityResult } from '@/lib/availability'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/provider'

const defaultFilters: PropertyFiltersState = {
  priceRange: [0, 2000],
  districts: [],
  distanceFromCenter: [],
  features: [],
  parking: [],
  availability: { start: null, end: null },
  numberOfBedrooms: [], // Number of bedrooms filter
  totalGuestCapacity: null // Total guest capacity filter
}

export default function PropertiesPage() {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const [filters, setFilters] = useState<PropertyFiltersState>(defaultFilters)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('medium')
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [guests, setGuests] = useState(2)
  const [hasSearched, setHasSearched] = useState(false)

  const handleDatesChange = (newCheckIn: Date | null, newCheckOut: Date | null) => {
    setCheckIn(newCheckIn)
    setCheckOut(newCheckOut)
    if (!newCheckIn && !newCheckOut) {
      setHasSearched(false)
    }
  }

  const handleSearch = () => {
    setHasSearched(true)
  }

  // First apply standard filters
  const filteredByStandard = useMemo(() => {
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

      // Guest capacity filter (from search bar)
      if (property.totalGuestCapacity < guests) {
        return false
      }

      // Number of bedrooms filter
      const bedroomsFilter = filters.numberOfBedrooms || []
      if (bedroomsFilter.length > 0) {
        const matchesBedrooms = bedroomsFilter.some((b: number) => {
          if (b === 7) return property.numberOfBedrooms >= 7
          return property.numberOfBedrooms === b
        })
        if (!matchesBedrooms) {
          return false
        }
      }

      // Total guest capacity filter (from filters panel)
      if (filters.totalGuestCapacity != null && filters.totalGuestCapacity > 0) {
        if (property.totalGuestCapacity < filters.totalGuestCapacity) {
          return false
        }
      }

      return true
    })
  }, [filters, guests])

  // Then apply availability filter if dates are selected
  const { available, partial, unavailable } = useMemo(() => {
    if (!hasSearched || !checkIn || !checkOut) {
      return { 
        available: filteredByStandard, 
        partial: [] as PropertyAvailabilityResult[], 
        unavailable: [] 
      }
    }
    return filterPropertiesByAvailability(filteredByStandard, checkIn, checkOut)
  }, [filteredByStandard, checkIn, checkOut, hasSearched])

  const showAvailabilityStatus = hasSearched && checkIn && checkOut

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        {/* Hero Section with Date Search */}
        <section className="bg-gradient-to-b from-secondary/50 to-background py-12 mb-4">
          <div className="container mx-auto px-6">
            <div className="text-center mb-8">
              <p className="luxury-subheading text-gold mb-3">{t('subtitle')}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold luxury-heading mb-4">
                {t('title')}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t('description')}
              </p>
            </div>

            {/* Date Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <DateSearchBar
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                onDatesChange={handleDatesChange}
                onGuestsChange={setGuests}
                onSearch={handleSearch}
              />
            </div>
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
                <div>
                  {showAvailabilityStatus ? (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{available.length}</span>
                        {' '}{t('availability')}
                      </p>
                      {partial.length > 0 && (
                        <p className="text-sm text-gold">
                          {partial.length} {t('availability')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{filteredByStandard.length}</span>
                      {' '}{t('title')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {/* Mobile Filters Button */}
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

              {/* Available Properties */}
              {showAvailabilityStatus ? (
                <div className="space-y-12">
                  {/* Fully Available */}
                  {available.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <h2 className="text-xl font-semibold">{t('availability')}</h2>
                      </div>
                      <PropertiesGrid 
                        properties={available} 
                        displayMode={displayMode}
                        checkIn={checkIn}
                        checkOut={checkOut}
                      />
                    </section>
                  )}

                  {/* Partially Available - Split Stay Option */}
                  {partial.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 rounded-full bg-gold" />
                        <h2 className="text-xl font-semibold">{t('availability')}</h2>
                      </div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gold/5 border border-gold/20 rounded-xl p-4 mb-6"
                      >
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{t('availability')}</p>
                            <p className="text-sm text-muted-foreground">
                              {t('description')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                      <PropertiesGrid 
                        properties={partial.map(p => p.property)} 
                        displayMode={displayMode}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        partialAvailability={partial}
                      />
                    </section>
                  )}

                  {/* Unavailable */}
                  {unavailable.length > 0 && (
                    <section className="opacity-50">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <h2 className="text-xl font-semibold text-muted-foreground">{t('noResults')}</h2>
                      </div>
                      <PropertiesGrid 
                        properties={unavailable} 
                        displayMode={displayMode}
                      />
                    </section>
                  )}

                  {/* No Results */}
                  {available.length === 0 && partial.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{t('noResults')}</h3>
                      <p className="text-muted-foreground mb-6">
                        {t('noResultsDescription')}
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          handleDatesChange(null, null)
                          setFilters(defaultFilters)
                        }}
                      >
                        {t('clearFilters')}
                      </Button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <PropertiesGrid 
                  properties={filteredByStandard} 
                  displayMode={displayMode}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
