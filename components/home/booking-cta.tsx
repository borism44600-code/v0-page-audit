'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Phone, Mail } from 'lucide-react'

export function BookingCTA() {
  return (
    <section className="relative py-32 md:py-48 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Book Your Stay"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="luxury-subheading text-white/70 mb-4">Ready to Experience Luxury?</p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-semibold luxury-heading max-w-3xl mx-auto text-balance">
            Your Moroccan Dream Awaits
          </h2>
          <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto">
            Let us help you find the perfect property for an unforgettable stay in Marrakech.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/booking">
            <Button size="lg" className="text-base px-8 gap-2 bg-white text-foreground hover:bg-white/90">
              Book Your Stay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 border-white/50 text-white hover:bg-white/10 hover:text-white"
            >
              Contact Us
            </Button>
          </Link>
        </motion.div>

        {/* Quick Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-white/70"
        >
          <a href="tel:+212500000000" className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone className="w-4 h-4" />
            <span>+212 5 00 00 00 00</span>
          </a>
          <a href="mailto:contact@marrakechriadsrent.com" className="flex items-center gap-2 hover:text-white transition-colors">
            <Mail className="w-4 h-4" />
            <span>contact@marrakechriadsrent.com</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
