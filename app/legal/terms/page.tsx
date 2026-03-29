import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Link 
              href="/legal" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Legal
            </Link>

            <h1 className="font-serif text-4xl mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-12">Last updated: March 2026</p>

            <div className="prose prose-neutral max-w-none">
              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  Welcome to Marrakech Riads Rent. These Terms of Service govern your use of our website, 
                  services, and rental properties. By accessing our platform or making a booking, you agree 
                  to be bound by these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">2. Booking and Reservations</h2>
                <p className="text-muted-foreground mb-4">
                  When you make a booking through our platform, you enter into a rental agreement with 
                  Marrakech Riads Rent. Bookings are subject to availability and confirmation.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>A deposit of 30% is required to confirm your booking</li>
                  <li>The remaining balance is due 14 days before arrival</li>
                  <li>Bookings made within 14 days of arrival require full payment</li>
                  <li>All prices are quoted in Euros unless otherwise stated</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">3. Cancellation Policy</h2>
                <p className="text-muted-foreground mb-4">
                  Our standard cancellation policy applies to all bookings unless otherwise specified:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>More than 30 days before check-in: Full refund minus processing fees</li>
                  <li>15-30 days before check-in: 50% refund</li>
                  <li>Less than 15 days before check-in: No refund</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">4. Guest Responsibilities</h2>
                <p className="text-muted-foreground mb-4">
                  As a guest, you agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Treat the property with care and respect</li>
                  <li>Not exceed the maximum occupancy stated in your booking</li>
                  <li>Comply with house rules and local regulations</li>
                  <li>Report any damage or issues promptly</li>
                  <li>Leave the property in a reasonable condition</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">5. Liability</h2>
                <p className="text-muted-foreground mb-4">
                  While we take every precaution to ensure your safety and comfort, Marrakech Riads Rent 
                  is not liable for personal injury, loss, or damage to personal belongings during your stay. 
                  We recommend guests obtain appropriate travel insurance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">6. Property Descriptions</h2>
                <p className="text-muted-foreground mb-4">
                  We strive to provide accurate descriptions and photographs of all properties. However, 
                  minor variations may occur. If a property differs significantly from its description, 
                  please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">7. Changes to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify these terms at any time. Changes will be posted on this 
                  page with an updated revision date. Continued use of our services after changes 
                  constitutes acceptance of the modified terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">8. Contact</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms of Service, please contact us at 
                  legal@marrakechriadsrent.com or through our Contact page.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
