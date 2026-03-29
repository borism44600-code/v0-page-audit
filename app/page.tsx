import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { CategoriesSection } from '@/components/home/categories-section'
import { FeaturedProperties } from '@/components/home/featured-properties'
import { ServicesSection } from '@/components/home/services-section'
import { ExperiencesSection } from '@/components/home/experiences-section'
import { InvestmentCTA } from '@/components/home/investment-cta'
import { BookingCTA } from '@/components/home/booking-cta'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturedProperties />
        <ServicesSection />
        <ExperiencesSection />
        <InvestmentCTA />
        <BookingCTA />
      </main>
      <Footer />
    </>
  )
}
