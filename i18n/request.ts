import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { locales, defaultLocale, type Locale } from './config'

// Detect language from browser Accept-Language header
function detectBrowserLanguage(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null
  
  // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=')
      return {
        code: code.split('-')[0].toLowerCase(), // Get primary language code
        q: qValue ? parseFloat(qValue) : 1
      }
    })
    .sort((a, b) => b.q - a.q)
  
  // Find first matching supported locale
  for (const lang of languages) {
    const matchedLocale = locales.find(locale => locale === lang.code)
    if (matchedLocale) return matchedLocale
    
    // Special case: map 'ar' variants to 'ar' or 'ma'
    if (lang.code === 'ar') return 'ar'
  }
  
  return null
}

export default getRequestConfig(async () => {
  // Priority 1: Check cookie for user's language preference
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined
  
  let locale: Locale = defaultLocale
  
  if (localeCookie && locales.includes(localeCookie)) {
    locale = localeCookie
  } else {
    // Priority 2: Detect from browser language
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language')
    const detectedLocale = detectBrowserLanguage(acceptLanguage)
    
    if (detectedLocale) {
      locale = detectedLocale
    }
    // Priority 3: Default to English (already set)
  }
  
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
