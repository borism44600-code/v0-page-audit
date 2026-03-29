'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'

const categories = [
  {
    title: 'Riads',
    description: 'Traditional Moroccan houses with interior courtyards, blending heritage and luxury.',
    image: '/images/categories/riads.jpg',
    href: '/properties/riads',
    count: 12
  },
  {
    title: 'Villas',
    description: 'Spacious private estates with pools, gardens, and stunning mountain views.',
    image: '/images/categories/villas.jpg',
    href: '/properties/villas',
    count: 8
  },
  {
    title: 'Apartments',
    description: 'Modern residences in prime locations for the contemporary traveler.',
    image: '/images/categories/apartments.jpg',
    href: '/properties/apartments',
    count: 15
  }
]

export function CategoriesSection() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="luxury-subheading text-muted-foreground mb-4">Our Collection</p>
          <h2 className="text-3xl md:text-5xl font-semibold luxury-heading">
            All Our Properties
          </h2>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={category.href} className="group block">
                <article className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-semibold mb-2">
                          {category.title}
                        </h3>
                        <p className="text-white/80 text-sm md:text-base max-w-xs leading-relaxed">
                          {category.description}
                        </p>
                        <p className="mt-4 text-sm text-white/60">
                          {category.count} properties
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:text-foreground">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-primary hover:underline underline-offset-4 transition-all"
          >
            <span>View All Properties</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
