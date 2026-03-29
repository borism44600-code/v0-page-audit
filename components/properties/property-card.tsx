'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Users, MapPin, ArrowRight } from 'lucide-react'
import { Property } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PropertyCardProps {
  property: Property
  variant?: 'large' | 'medium' | 'small'
}

export function PropertyCard({ property, variant = 'medium' }: PropertyCardProps) {
  const isLarge = variant === 'large'
  const isSmall = variant === 'small'

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <article
        className={cn(
          'bg-card rounded-lg overflow-hidden transition-all duration-500 hover:shadow-xl',
          isLarge && 'flex flex-col lg:flex-row',
          isSmall && 'flex flex-row'
        )}
      >
        {/* Image Container */}
        <div
          className={cn(
            'relative overflow-hidden',
            isLarge && 'lg:w-1/2 aspect-[4/3] lg:aspect-auto',
            !isLarge && !isSmall && 'aspect-[4/3]',
            isSmall && 'w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0'
          )}
        >
          <Image
            src={property.images[0] || '/images/placeholder-property.jpg'}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes={isLarge ? '(max-width: 1024px) 100vw, 50vw' : isSmall ? '160px' : '(max-width: 768px) 100vw, 33vw'}
          />
          {/* Property Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-background/90 backdrop-blur-sm text-xs uppercase tracking-wider rounded-full">
              {property.type}
            </span>
          </div>
          {property.featured && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-gold text-foreground text-xs uppercase tracking-wider rounded-full">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            'p-5',
            isLarge && 'lg:w-1/2 lg:p-8 lg:flex lg:flex-col lg:justify-center',
            isSmall && 'p-3 sm:p-4 flex-1 flex flex-col justify-center'
          )}
        >
          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className={cn('text-xs uppercase tracking-wider', isSmall && 'text-[10px]')}>
              {property.location.subDistrict || property.location.district}
            </span>
          </div>

          {/* Title */}
          <h3
            className={cn(
              'font-semibold text-foreground group-hover:text-primary transition-colors',
              isLarge && 'text-2xl lg:text-3xl',
              !isLarge && !isSmall && 'text-lg',
              isSmall && 'text-sm sm:text-base line-clamp-2'
            )}
          >
            {property.title}
          </h3>

          {/* Description (only for large cards) */}
          {isLarge && (
            <p className="mt-4 text-muted-foreground leading-relaxed line-clamp-3">
              {property.shortDescription}
            </p>
          )}

          {/* Features */}
          <div
            className={cn(
              'flex items-center gap-4 text-muted-foreground',
              isLarge && 'mt-6',
              !isLarge && !isSmall && 'mt-3',
              isSmall && 'mt-2 gap-3'
            )}
          >
            <div className="flex items-center gap-1.5">
              <Bed className={cn('w-4 h-4', isSmall && 'w-3 h-3')} />
              <span className={cn('text-sm', isSmall && 'text-xs')}>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className={cn('w-4 h-4', isSmall && 'w-3 h-3')} />
              <span className={cn('text-sm', isSmall && 'text-xs')}>{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className={cn('w-4 h-4', isSmall && 'w-3 h-3')} />
              <span className={cn('text-sm', isSmall && 'text-xs')}>{property.maxGuests}</span>
            </div>
          </div>

          {/* Price & CTA */}
          <div
            className={cn(
              'flex items-center justify-between',
              isLarge && 'mt-8 pt-6 border-t border-border',
              !isLarge && !isSmall && 'mt-4 pt-4 border-t border-border',
              isSmall && 'mt-2'
            )}
          >
            <div>
              <span className={cn('text-2xl font-semibold text-foreground', isSmall && 'text-lg')}>
                {property.pricePerNight}€
              </span>
              <span className={cn('text-sm text-muted-foreground ml-1', isSmall && 'text-xs')}>
                / night
              </span>
            </div>
            {!isSmall && (
              <Button variant="ghost" size="sm" className="gap-2 group/btn">
                <span>View</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
