'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, Star, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { PropertyCard } from '@/components/properties/property-card'
import { mockProperties, type Property } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/i18n/provider'
import { getPublicPropertiesClient } from '@/lib/data-fetcher-client'

export function FeaturedProperties() {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const [featured, setFeatured] = useState<Property[]>(() => 
    mockProperties.filter(p => p.featured).slice(0, 3)
  )

  useEffect(() => {
    async function loadFeatured() {
      try {
        const properties = await getPublicPropertiesClient()
        const featuredProps = properties.filter(p => p.featured).slice(0, 3)
        if (featuredProps.length > 0) {
          setFeatured(featuredProps)
        }
      } catch (error) {
        // Keep mock data on error
        console.error('Error loading featured properties:', error)
      }
    }
    loadFeatured()
  }, [])

  const trustFeatures = [
    { icon: Shield, text: t('featured') },
    { icon: Star, text: t('new') },
    { icon: Clock, text: t('instantBooking') }
  ]

  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div>
            <p className="luxury-subheading text-gold mb-4">{t('subtitle')}</p>
            <h2 className="text-3xl md:text-5xl font-semibold luxury-heading mb-4">
              {t('featured')}
            </h2>
            <p className="text-muted-foreground max-w-xl">
              {t('description')}
            </p>
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              {trustFeatures.map((feature) => (
                <div key={feature.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <feature.icon className="w-4 h-4 text-gold" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/properties" className="mt-6 md:mt-0">
            <Button variant="outline" className="gap-2">
              {t('all')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Featured Properties Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Large Featured Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:row-span-2"
          >
            <PropertyCard property={featured[0]} variant="large" />
          </motion.div>

          {/* Smaller Cards */}
          {featured.slice(1).map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (index + 1) * 0.1 }}
            >
              <PropertyCard property={property} variant="medium" />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            {tCommon('more')}?
          </p>
          <Link href="/contact">
            <Button variant="outline" className="gap-2">
              {t('viewDetails')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
