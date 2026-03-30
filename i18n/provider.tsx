'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { locales, defaultLocale, type Locale, getDirection } from './config'

// Import messages
import en from './messages/en.json'
import fr from './messages/fr.json'
import es from './messages/es.json'
import ar from './messages/ar.json'
import ma from './messages/ma.json'
import zh from './messages/zh.json'

const messages: Record<Locale, typeof en> = { en, fr, es, ar, ma, zh }

type Messages = typeof en

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  direction: 'ltr' | 'rtl'
}

const I18nContext = createContext<I18nContextType | null>(null)

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let value: unknown = obj
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return path // Return key if not found
    }
  }
  return typeof value === 'string' ? value : path
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get locale from cookie or browser
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined

    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale)
    } else {
      // Detect from browser
      const browserLang = navigator.language.split('-')[0] as Locale
      if (locales.includes(browserLang)) {
        setLocaleState(browserLang)
      }
    }
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    setLocaleState(newLocale)
    // Update document direction
    document.documentElement.dir = getDirection(newLocale)
    document.documentElement.lang = newLocale
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = getNestedValue(messages[locale] as unknown as Record<string, unknown>, key)
    
    // Replace parameters like {name} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      })
    }
    
    return text
  }

  const direction = getDirection(locale)

  // Update document attributes when locale changes
  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = direction
      document.documentElement.lang = locale
    }
  }, [locale, direction, mounted])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, direction }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslations(namespace?: string) {
  const { t, locale } = useI18n()
  
  return (key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return t(fullKey, params)
  }
}
