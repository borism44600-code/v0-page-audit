// PayPal configuration and utilities
// Uses environment variables for security - never hardcode credentials

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

// Sandbox (testing) vs Live environment
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export interface PayPalOrderData {
  bookingId: string
  propertyId: string
  propertyTitle: string
  checkIn: string
  checkOut: string
  nights: number
  guests: {
    adults: number
    children: number
  }
  totalAmount: number
  currency: string
  customerEmail?: string
  customerName?: string
}

export interface PayPalOrder {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

export interface PayPalCaptureResult {
  id: string
  status: string
  payer?: {
    email_address?: string
    name?: {
      given_name?: string
      surname?: string
    }
  }
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string
        status: string
        amount: {
          currency_code: string
          value: string
        }
      }>
    }
  }>
}

/**
 * Generate a unique booking reference
 */
export function generateBookingReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `MRR-${timestamp}-${random}`
}

/**
 * Get PayPal access token using client credentials
 * Required for server-side API calls
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.')
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get PayPal access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Create a PayPal order
 * Called from server-side API route
 */
export async function createPayPalOrder(orderData: PayPalOrderData): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken()

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: orderData.bookingId,
        description: `${orderData.propertyTitle} - ${orderData.nights} night${orderData.nights > 1 ? 's' : ''} (${orderData.checkIn} to ${orderData.checkOut})`,
        custom_id: orderData.bookingId,
        soft_descriptor: 'MARRAKECH RIADS',
        amount: {
          currency_code: orderData.currency,
          value: orderData.totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: orderData.currency,
              value: orderData.totalAmount.toFixed(2),
            },
          },
        },
        items: [
          {
            name: orderData.propertyTitle,
            description: `${orderData.nights} night stay, ${orderData.guests.adults} adult${orderData.guests.adults > 1 ? 's' : ''}${orderData.guests.children > 0 ? `, ${orderData.guests.children} child${orderData.guests.children > 1 ? 'ren' : ''}` : ''}`,
            unit_amount: {
              currency_code: orderData.currency,
              value: orderData.totalAmount.toFixed(2),
            },
            quantity: '1',
            category: 'DIGITAL_GOODS',
          },
        ],
      },
    ],
    application_context: {
      brand_name: 'Marrakech Riads Rent',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking`,
    },
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': orderData.bookingId, // Idempotency key
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create PayPal order: ${error}`)
  }

  return response.json()
}

/**
 * Capture a PayPal order after customer approval
 * Called from server-side API route
 */
export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to capture PayPal order: ${error}`)
  }

  return response.json()
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrderDetails(orderId: string): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get PayPal order details: ${error}`)
  }

  return response.json()
}

/**
 * Validate PayPal configuration
 */
export function isPayPalConfigured(): boolean {
  return !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET)
}

/**
 * Get client-side PayPal Client ID
 */
export function getPayPalClientId(): string {
  return PAYPAL_CLIENT_ID || ''
}
