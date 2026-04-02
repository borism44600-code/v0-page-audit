'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, Star, Clock, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PropertyCard } from '@/components/properties/property-card'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/i18n/provider'
import { fetchPublishedPropertiesClient } from '@/lib/data-fetcher-client'
import { type UiProperty } from '@/lib/adapters/property-adapter'

export function FeaturedProperties() {
  const t = useTranslations('properties')
  const tCommon = useTranslations('common')
  const [properties, setProperties] = useState<UiProperty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await fetchPublishedPropertiesClient()
        setProperties(data.filter(p => p.featured).slice(0, 3))
      } catch (error) {
        console.error('Error loading featured properties:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProperties()
  }, [])

  const trustFeatures = [
    { icon: Shield, text: t('featured') },
    { icon: Star, text: t('new') },
    { icon: Clock, text: t('instantBooking') }
  ]

  // Premium empty state when no properties are available
  if (!loading && properties.length === 0) {
    return (
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="luxury-subheading text-gold mb-4">{t('subtitle')}</p>
            <h2 className="text-3xl md:text-5xl font-semibold luxury-heading mb-4">
              {t('featured')}
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl mx-auto mt-12 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Properties Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re currently preparing our exclusive collection of handpicked properties in Marrakech.
              Contact us to be the first to know when they become available.
            </p>
            <Link href="/contact">
              <Button variant="outline" className="gap-2">
                Get Notified
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    )
  }

  // Loading state
  if (loading) {
    return (
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mx-auto mb-4" />
            <div className="h-12 w-96 bg-muted rounded mx-auto mb-12" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-xl lg:row-span-2" />
              <div className="h-44 bg-muted rounded-xl" />
              <div className="h-44 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {properties[0] && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:row-span-2"
            >
              <PropertyCard property={properties[0]} variant="large" />
            </motion.div>
          )}

          {properties.slice(1).map((property, index) => (
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
