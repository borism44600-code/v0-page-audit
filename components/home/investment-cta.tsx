'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, Building2, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Growing Market',
    description: 'Steady demand for quality properties in Marrakech'
  },
  {
    icon: Building2,
    title: 'Property Selection',
    description: 'Help finding the right property for your goals'
  },
  {
    icon: Shield,
    title: 'Local Support',
    description: 'Guidance through the purchase and rental process'
  }
]

export function InvestmentCTA() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="bg-foreground rounded-2xl p-8 md:p-16 text-background">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="luxury-subheading text-background/60 mb-4">
                Thinking of Investing?
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold luxury-heading mb-6">
                Property Opportunities in Marrakech
              </h2>
              <p className="text-background/70 leading-relaxed mb-8">
                Interested in owning a property in Marrakech? We can help you navigate the market, 
                find the right property, and manage it as a rental if you choose. We&apos;ve helped 
                several clients through this process.
              </p>
              <Link href="/about#invest">
                <Button 
                  size="lg" 
                  className="bg-background text-foreground hover:bg-background/90 gap-2"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex gap-5 p-5 rounded-lg bg-background/5 border border-background/10"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg mb-1">{benefit.title}</h4>
                    <p className="text-background/60 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
