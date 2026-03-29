export type PropertyType = 'riad' | 'villa' | 'apartment'

export type DistanceFromCenter = 
  | 'walking' 
  | 'less-5-min' 
  | 'less-15-min' 
  | 'less-30-min' 
  | 'more-30-min'

export type ParkingType = 
  | 'private' 
  | 'nearby' 
  | 'door-dropoff' 
  | 'door-parking' 
  | 'walk-3-min' 
  | 'walk-5-min' 
  | 'less-500m'

export interface PropertyFeatures {
  heatedPool: boolean
  unheatedPool: boolean
  jacuzzi: boolean
  hammam: boolean
  bathtub: boolean
  fireplace: boolean
  gasStove: boolean
  washingMachine: boolean
  iron: boolean
  dishwasher: boolean
  oven: boolean
  coffeeMachine: boolean
  fridge: boolean
  privateTerminate: boolean
  terrace: boolean
  mountainView: boolean
  koutboubiaView: boolean
  mouleyYazidView: boolean
  monumentsView: boolean
  souks: boolean
}

export interface Property {
  id: string
  title: string
  type: PropertyType
  description: string
  shortDescription: string
  pricePerNight: number
  monthlyPrices?: Record<number, number> // Month (1-12) to price mapping
  location: {
    district: string
    subDistrict?: string
    distanceFromCenter?: DistanceFromCenter
  }
  features: PropertyFeatures
  parking: ParkingType
  images: string[]
  bedrooms: number
  bathrooms: number
  maxGuests: number
  amenities: string[]
  availability: {
    start: string
    end: string
  }[]
  featured: boolean
  createdAt: string
  updatedAt: string
}

export interface PartnerCategory {
  id: string
  name: string
  slug: string
}

export interface Partner {
  id: string
  name: string
  category: 'restaurant' | 'spa' | 'tour' | 'activity' | 'transport'
  description: string
  image: string
  website?: string
  discountCode?: string
  bookingProcedure?: string
}

export interface BookingAddon {
  id: string
  name: string
  description: string
  pricePerPerson?: number
  priceFlat?: number
  image?: string
}

export interface Booking {
  id: string
  propertyId: string
  checkIn: string
  checkOut: string
  guests: {
    adults: number
    children: number
  }
  addons: {
    addonId: string
    quantity: number
    persons?: number
  }[]
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
  contactInfo: {
    name: string
    email: string
    phone: string
  }
  createdAt: string
}

export interface Service {
  id: string
  name: string
  description: string
  image: string
  category: 'breakfast' | 'meals' | 'excursion' | 'spa' | 'transport'
}

// Location districts
export const KASBAH_DISTRICTS = [
  'Kasbah Royal District'
] as const

export const MEDINA_DISTRICTS = [
  'Arset el Houta',
  'Arset El Maach', 
  'Arset Moulay Moussa',
  'Assouel',
  'Azbezd, les Souks',
  'Bab Doukkala',
  'Bab El Hmar',
  'Ben Salah',
  'Derb Dabachi',
  'Derb el Bacha',
  'El Moukef',
  'Kaât Benahid ou Medersa Ben Youssef',
  'Kennaria',
  'Le Mellah',
  'Mouassine',
  'Rahba Kedima',
  'Riad Laârous',
  'Riad Zitoun',
  'Rmila',
  'Sidi Ben Slimane',
  'Sidi Bou Amar',
  'Bab El Khemis',
  'Bab Aylan & Bab Ghmat',
  'Sidi Mimoun'
] as const

export const APARTMENT_DISTRICTS = [
  'Guéliz',
  'Hivernage', 
  'Airport'
] as const

export const MAIN_DISTRICTS = [
  'Kasbah Royal District',
  'Medina of Marrakech',
  ...APARTMENT_DISTRICTS
] as const

export const DISTANCE_OPTIONS = [
  { value: 'walking', label: 'Within walking distance' },
  { value: 'less-5-min', label: 'Less than 5 minutes by car' },
  { value: 'less-15-min', label: 'Less than 15 minutes by car' },
  { value: 'less-30-min', label: 'Less than 30 minutes by car' },
  { value: 'more-30-min', label: 'More than 30 minutes by car' }
] as const

export const PARKING_OPTIONS = [
  { value: 'private', label: 'Property with private parking' },
  { value: 'nearby', label: 'Parking nearby' },
  { value: 'door-dropoff', label: 'Drop-off at the door' },
  { value: 'door-parking', label: 'Parking at the door' },
  { value: 'walk-3-min', label: '< 3-minute walk' },
  { value: 'walk-5-min', label: '< 5-minute walk' },
  { value: 'less-500m', label: '< 500m' }
] as const

export const FEATURE_LABELS: Record<keyof PropertyFeatures, string> = {
  heatedPool: 'Heated Swimming Pool',
  unheatedPool: 'Unheated Swimming Pool',
  jacuzzi: 'Jacuzzi',
  hammam: 'Hammam',
  bathtub: 'Bathtub',
  fireplace: 'Fireplace',
  gasStove: 'Gas Stove / Kitchen',
  washingMachine: 'Washing Machine',
  iron: 'Iron / Ironing Board',
  dishwasher: 'Dishwasher',
  oven: 'Oven',
  coffeeMachine: 'Coffee / Tea Maker',
  fridge: 'Fridge(s)',
  privateTerminate: 'Private Terrace',
  terrace: 'Terrace',
  mountainView: 'Mountain View',
  koutboubiaView: 'Koutoubia View',
  mouleyYazidView: 'Moulay Lyazid Mosque View',
  monumentsView: 'View of Monuments',
  souks: 'Near Souks'
}
