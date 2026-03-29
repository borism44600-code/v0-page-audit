import Link from 'next/link'
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react'

const footerLinks = {
  properties: [
    { href: '/properties/riads', label: 'Riads' },
    { href: '/properties/villas', label: 'Villas' },
    { href: '/properties/apartments', label: 'Apartments' },
    { href: '/properties', label: 'All Properties' },
  ],
  services: [
    { href: '/services', label: 'Concierge' },
    { href: '/partners', label: 'Our Partners' },
    { href: '/services#experiences', label: 'Experiences' },
    { href: '/booking', label: 'Book Now' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/faq', label: 'FAQ' },
    { href: '/about#invest', label: 'Investment' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cancellation', label: 'Cancellation Policy' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <h3 className="text-2xl font-semibold tracking-tight">Marrakech Riads</h3>
              <p className="text-xs tracking-[0.3em] uppercase text-background/60 mt-1">Rent</p>
            </Link>
            <p className="mt-6 text-background/70 leading-relaxed max-w-sm">
              Discover the art of Moroccan living with our curated collection of luxury riads, 
              villas, and apartments in the heart of Marrakech.
            </p>
            
            {/* Contact Info */}
            <div className="mt-8 space-y-3">
              <a href="mailto:contact@marrakechriadsrent.com" className="flex items-center gap-3 text-background/70 hover:text-background transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">contact@marrakechriadsrent.com</span>
              </a>
              <a href="tel:+212500000000" className="flex items-center gap-3 text-background/70 hover:text-background transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+212 5 00 00 00 00</span>
              </a>
              <div className="flex items-center gap-3 text-background/70">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Marrakech, Morocco</span>
              </div>
            </div>
          </div>

          {/* Properties Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wider uppercase mb-6">Properties</h4>
            <ul className="space-y-3">
              {footerLinks.properties.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-background/70 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wider uppercase mb-6">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-background/70 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wider uppercase mb-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-background/70 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-medium tracking-wider uppercase mb-6">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-background/70 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/50">
            &copy; {new Date().getFullYear()} Marrakech Riads Rent. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-background/50 hover:text-background transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-background/50 hover:text-background transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
