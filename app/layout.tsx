import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter, Noto_Sans_Arabic, Noto_Sans_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { I18nProvider } from '@/i18n/provider'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif'
})

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans'
})

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic'
})

const notoSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-chinese'
})

export const metadata: Metadata = {
  title: 'Marrakech Riads Rent | Stylish Stays in Marrakech',
  description: 'A carefully selected collection of riads, villas, and apartments in Marrakech. Quality properties, personal service, and a warm welcome in the Red City.',
  keywords: ['Marrakech', 'Riads', 'Villas', 'Apartments', 'Holiday Rentals', 'Morocco', 'Medina'],
  openGraph: {
    title: 'Marrakech Riads Rent | Stylish Stays in Marrakech',
    description: 'Quality properties and personal service in the Red City.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#C4A77D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      dir="ltr"
      suppressHydrationWarning
      className={`${cormorant.variable} ${inter.variable} ${notoArabic.variable} ${notoSC.variable}`}
    >
      <body className="font-serif antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
