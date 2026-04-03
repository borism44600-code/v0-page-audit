'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coffee, UtensilsCrossed, Plane, Bed, Baby, CheckCircle2 } from 'lucide-react'
import { getPropertyServicePricing, type PropertyServicePricing } from '@/app/admin/services/actions'

interface PropertyServicesProps {
  propertyId: string
}

export function PropertyServices({ propertyId }: PropertyServicesProps) {
  const [pricing, setPricing] = useState<PropertyServicePricing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadServices() {
      const data = await getPropertyServicePricing(propertyId)
      setPricing(data)
      setLoading(false)
    }
    loadServices()
  }, [propertyId])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Check if any service is available
  const hasAnyService = pricing && (
    pricing.breakfast_available ||
    pricing.lunch_available ||
    pricing.dinner_available ||
    pricing.transfer_available ||
    pricing.extra_bed_available ||
    pricing.crib_available
  )

  if (!hasAnyService) {
    return null
  }

  const services = [
    {
      id: 'breakfast',
      icon: Coffee,
      label: 'Breakfast',
      description: `${pricing?.breakfast_adult_price}€/adult, ${pricing?.breakfast_child_price}€/child`,
      available: pricing?.breakfast_available,
      color: 'amber'
    },
    {
      id: 'lunch',
      icon: UtensilsCrossed,
      label: 'Lunch',
      description: `${pricing?.lunch_adult_price}€/adult, ${pricing?.lunch_child_price}€/child`,
      available: pricing?.lunch_available,
      color: 'green'
    },
    {
      id: 'dinner',
      icon: UtensilsCrossed,
      label: 'Dinner',
      description: `${pricing?.dinner_adult_price}€/adult, ${pricing?.dinner_child_price}€/child`,
      available: pricing?.dinner_available,
      color: 'green'
    },
    {
      id: 'transfer',
      icon: Plane,
      label: 'Airport Transfer',
      description: `From ${pricing?.transfer_arrival_price}€`,
      available: pricing?.transfer_available,
      color: 'blue'
    },
    {
      id: 'extra_bed',
      icon: Bed,
      label: 'Extra Bed',
      description: `${pricing?.extra_bed_price}€/night`,
      available: pricing?.extra_bed_available,
      color: 'purple'
    },
    {
      id: 'crib',
      icon: Baby,
      label: 'Baby Crib',
      description: pricing?.crib_price ? `${pricing.crib_price}€` : 'Free',
      available: pricing?.crib_available,
      color: 'pink'
    }
  ].filter(s => s.available)

  const colorClasses = {
    amber: 'bg-amber-500/10 text-amber-600',
    green: 'bg-green-500/10 text-green-600',
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
    pink: 'bg-pink-500/10 text-pink-600'
  } as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-semibold mb-6">Services Available</h2>
      <p className="text-muted-foreground mb-4">
        Add these services when you book, or contact us to customize your stay.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <div
              key={service.id}
              className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[service.color as keyof typeof colorClasses]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">{service.label}</p>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
