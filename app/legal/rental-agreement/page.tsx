import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RentalAgreementPage() {
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

            <h1 className="font-serif text-4xl mb-4">Rental Agreement</h1>
            <p className="text-muted-foreground mb-12">Standard Terms and Conditions</p>

            <div className="prose prose-neutral max-w-none">
              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">1. Parties to the Agreement</h2>
                <p className="text-muted-foreground mb-4">
                  This rental agreement is between Marrakech Riads Rent SARL (&quot;the Company&quot;) and 
                  the guest making the reservation (&quot;the Guest&quot;). By completing a booking, the Guest 
                  agrees to these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">2. Rental Period</h2>
                <p className="text-muted-foreground mb-4">
                  The rental period begins at 3:00 PM on the check-in date and ends at 11:00 AM on 
                  the check-out date, unless otherwise arranged in writing.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">3. Occupancy</h2>
                <p className="text-muted-foreground mb-4">
                  The property may only be occupied by the number of guests specified in the booking. 
                  Additional guests require prior approval and may incur additional charges. 
                  Subletting is strictly prohibited.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">4. Security Deposit</h2>
                <p className="text-muted-foreground mb-4">
                  A security deposit may be required for certain properties. This will be clearly 
                  stated at the time of booking. The deposit is refundable within 7 days of checkout, 
                  subject to inspection of the property.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">5. Property Care</h2>
                <p className="text-muted-foreground mb-4">
                  The Guest agrees to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Treat the property and its contents with care and respect</li>
                  <li>Use all amenities and appliances as intended</li>
                  <li>Report any damage or malfunction immediately</li>
                  <li>Not remove any items from the property</li>
                  <li>Not make any alterations to the property</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">6. House Rules</h2>
                <p className="text-muted-foreground mb-4">
                  Guests must comply with house rules, which may include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>No smoking inside the property</li>
                  <li>No parties or events without prior approval</li>
                  <li>Respect for quiet hours (typically 10 PM - 8 AM)</li>
                  <li>Pet policies specific to each property</li>
                  <li>Pool and terrace safety guidelines</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">7. Damage and Liability</h2>
                <p className="text-muted-foreground mb-4">
                  The Guest is liable for any damage caused to the property during their stay, 
                  whether by the Guest, their party, or any visitors. Costs for repair or 
                  replacement will be charged to the Guest.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">8. Insurance</h2>
                <p className="text-muted-foreground mb-4">
                  Guests are strongly advised to obtain comprehensive travel insurance covering 
                  trip cancellation, medical emergencies, and personal liability. The Company&apos;s 
                  property insurance does not cover guests&apos; personal belongings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">9. Force Majeure</h2>
                <p className="text-muted-foreground mb-4">
                  Neither party shall be liable for failure to perform obligations due to 
                  circumstances beyond their reasonable control, including natural disasters, 
                  war, terrorism, or government actions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">10. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  This agreement is governed by the laws of the Kingdom of Morocco. Any disputes 
                  shall be subject to the exclusive jurisdiction of the courts of Marrakech.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-serif text-2xl mb-4">11. Contact</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about this rental agreement, please contact legal@marrakechriadsrent.com 
                  or call +212 5 24 XX XX XX.
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
