'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Star, Shield, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

const trustIndicators = [
  { icon: Star, text: 'Carefully Selected Properties' },
  { icon: Shield, text: 'Personal Service' },
  { icon: Clock, text: 'Here When You Need Us' }
]

export function HeroSection() {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Luxury Moroccan Riad with traditional architecture and serene courtyard"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Refined Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center text-white">
        {/* Eyebrow with emotional hook */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="text-sm md:text-base tracking-[0.3em] uppercase mb-6 text-gold">
            Thoughtfully Selected Stays in Marrakech
          </p>
        </motion.div>

        {/* Emotional headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight luxury-heading max-w-5xl mx-auto text-balance"
        >
          A Warm Welcome Awaits in Marrakech
        </motion.h1>

        {/* Evocative description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
        >
          Discover our collection of stylish riads and villas, each chosen for its character and charm. 
          Experience genuine Moroccan hospitality in the medina and the finest neighborhoods of the Red City.
        </motion.p>

        {/* Strong CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/properties">
            <Button size="lg" className="text-base px-8 gap-2 bg-gold text-black hover:bg-gold/90 font-medium">
              View Our Properties
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/booking">
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 border-white/50 text-white hover:bg-white/10 hover:text-white"
            >
              Book Your Stay
            </Button>
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {trustIndicators.map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-white/70">
              <item.icon className="w-4 h-4 text-gold" />
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs tracking-wider uppercase text-white/60">Discover</span>
            <div className="w-px h-12 bg-gradient-to-b from-gold/60 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
