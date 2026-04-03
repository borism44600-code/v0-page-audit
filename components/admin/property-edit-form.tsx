'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, Save, Eye, Bed, Trash2, Plus, Users, Sofa, Bath,
  MapPin, DollarSign, Image as ImageIcon, Globe, Settings2, Car, Loader2,
  Sparkles, Flame, Waves, Wind, Wifi, ThermometerSun, Mountain, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminLayout } from '@/components/admin/admin-layout'
import { updatePropertyAction, addPropertyImageAction, deletePropertyImageAction, setCoverImageAction } from '@/app/admin/actions'

// Import the AdminFormProperty type from the adapter
import type { AdminFormProperty } from '@/lib/adapters/admin-property-adapter'
import { PropertyServicesForm } from './property-services-form'
import { PropertyPricingForm } from './property-pricing-form'
import { 
  MAIN_DISTRICTS, MEDINA_DISTRICTS, KASBAH_DISTRICTS,
  BEDROOM_OPTIONS, GUEST_CAPACITY_OPTIONS,
  SleepingSpace, BedType, BED_TYPE_LABELS,
  BathroomType, BATHROOM_TYPE_LABELS,
  FEATURE_LABELS, type PropertyFeatures
} from '@/lib/types'

interface PropertyEditFormProps {
  property: AdminFormProperty
}

interface FormSection {
  id: string
  title: string
  icon: React.ElementType
}

const sections: FormSection[] = [
  { id: 'general', title: 'General', icon: Settings2 },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'capacity', title: 'Capacity', icon: Bed },
  { id: 'features', title: 'Features', icon: Sparkles },
  { id: 'pricing', title: 'Pricing', icon: DollarSign },
  { id: 'services', title: 'Services', icon: Users },
  { id: 'parking', title: 'Parking', icon: Car },
  { id: 'sync', title: 'Sync', icon: Globe },
  { id: 'seo', title: 'SEO', icon: Globe },
  { id: 'media', title: 'Media', icon: ImageIcon },
]

export function PropertyEditForm({ property }: PropertyEditFormProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Form state initialized from property (using AdminFormProperty from adapter)
  const syncData = property.availability_sync?.[0] || {}
  
  const [formData, setFormData] = useState({
    // Basic info
    title: property.title || '',
    slug: property.slug || '',
    type: property.type || 'riad',
    shortDescription: property.description_short || '',
    description: property.description_long || '',
    status: property.status || 'draft',
    featured: property.featured || false,
    // Location
    city: property.city || 'Marrakech',
    district: property.district || '',
    subDistrict: property.sub_district || '',
    address: property.address || '',
    mapLocation: property.map_location || '',
    // Capacity
    numberOfBedrooms: property.num_bedrooms || 1,
    numberOfBathrooms: property.num_bathrooms || 1,
    bedroomGuestCapacity: property.bedroom_guest_capacity || 2,
    additionalGuestCapacity: property.additional_guest_capacity || 0,
    totalGuestCapacity: property.total_guest_capacity || 2,
    // Pricing
    pricePerNight: property.price_per_night || 0,
    cleaningFee: property.cleaning_fee || 0,
    securityDeposit: property.security_deposit || 0,
    // Parking
    parkingType: property.parking_type || 'none',
    parkingSpots: property.parking_spots || 0,
    // SEO
    seoTitle: property.seo_title || '',
    seoDescription: property.seo_description || '',
    // Sync URLs
    airbnbIcalUrl: syncData.airbnb_ical_url || '',
    bookingIcalUrl: syncData.booking_ical_url || '',
    internalIcalUrl: syncData.internal_ical_url || '',
    // === NON-PERSISTED FIELDS (kept for UI but not saved to DB) ===
    // These are marked in UI with a visual indicator
    serviceFee: 0,        // NOT IN DB SCHEMA
    parkingNotes: '',     // NOT IN DB SCHEMA
    seoKeywords: '',      // NOT IN DB SCHEMA
  })

  // Features state - initialized from property.features
  const defaultFeatures: PropertyFeatures = {
    heatedPool: false, unheatedPool: false, heatedPlungePool: false, unheatedPlungePool: false,
    jacuzzi: false, hammam: false, bathtub: false, fireplace: false,
    terrace: false, rooftop: false, privateTerminate: false,
    wifi: false, airConditioning: false,
    breakfastPossible: false, mealsPossible: false, airportTransferPossible: false,
    privateDriverPossible: false, excursionsPossible: false,
    gasStove: false, washingMachine: false, iron: false, dishwasher: false,
    oven: false, coffeeMachine: false, fridge: false,
    mountainView: false, koutboubiaView: false, mouleyYazidView: false, monumentsView: false, souks: false
  }
  const [features, setFeatures] = useState<PropertyFeatures>(() => {
    const propFeatures = property.features as Partial<PropertyFeatures> | null
    return { ...defaultFeatures, ...propFeatures }
  })

  // Sleeping arrangements state - initialized from property.property_rooms if available
  // Convert DB property_rooms format to SleepingSpace format
  const [sleepingArrangements, setSleepingArrangements] = useState<SleepingSpace[]>(() => {
    if (!property.property_rooms || property.property_rooms.length === 0) {
      return []
    }
    return property.property_rooms.map(room => {
      // Determine bathroomType from DB columns
      let bathroomType: BathroomType = 'none'
      if (room.has_shower && room.has_bathtub) {
        bathroomType = 'both'
      } else if (room.has_shower) {
        bathroomType = 'shower'
      } else if (room.has_bathtub) {
        bathroomType = 'bathtub'
      }
      
      return {
        roomName: room.room_name || 'Room',
        roomType: room.room_name?.toLowerCase().includes('living') ? 'living-room' : 'bedroom',
        beds: [{
          type: (room.bed_type as BedType) || 'double',
          quantity: room.bed_count || 1
        }],
        ensuite: room.has_bathroom || false,
        bathroomType: room.has_bathroom ? bathroomType : 'none'
      }
    })
  })

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
  }

  // Sleeping arrangements management functions
  const addBedroom = () => {
    const newRoom: SleepingSpace = {
      roomName: `Bedroom ${sleepingArrangements.filter(r => r.roomType === 'bedroom').length + 1}`,
      roomType: 'bedroom',
      beds: [{ type: 'double', quantity: 1 }],
      ensuite: false
    }
    setSleepingArrangements([...sleepingArrangements, newRoom])
  }

  const addLivingRoom = () => {
    const newRoom: SleepingSpace = {
      roomName: 'Living Room',
      roomType: 'living-room',
      beds: [{ type: 'sofa-bed-double', quantity: 1 }],
      notes: 'Additional sleeping space'
    }
    setSleepingArrangements([...sleepingArrangements, newRoom])
  }

  const removeRoom = (index: number) => {
    setSleepingArrangements(sleepingArrangements.filter((_, i) => i !== index))
  }

  const updateRoom = (index: number, updates: Partial<SleepingSpace>) => {
    setSleepingArrangements(sleepingArrangements.map((room, i) => 
      i === index ? { ...room, ...updates } : room
    ))
  }

  const addBedToRoom = (roomIndex: number) => {
    const room = sleepingArrangements[roomIndex]
    updateRoom(roomIndex, {
      beds: [...room.beds, { type: 'single', quantity: 1 }]
    })
  }

  const removeBedFromRoom = (roomIndex: number, bedIndex: number) => {
    const room = sleepingArrangements[roomIndex]
    updateRoom(roomIndex, {
      beds: room.beds.filter((_, i) => i !== bedIndex)
    })
  }

  const updateBed = (roomIndex: number, bedIndex: number, updates: Partial<{ type: BedType; quantity: number }>) => {
    const room = sleepingArrangements[roomIndex]
    updateRoom(roomIndex, {
      beds: room.beds.map((bed, i) => i === bedIndex ? { ...bed, ...updates } : bed)
    })
  }

  const handleSave = async (publish = false) => {
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    
    // Validation
    if (!formData.title.trim()) {
      setSaveError('Property title is required')
      setIsSaving(false)
      return
    }
    
    try {
      // Prepare data - aligned with Supabase schema via actions.ts mapping
      // NOTE: serviceFee, parkingNotes, seoKeywords are NOT included (not in DB schema)
      const propertyData = {
        title: formData.title,
        slug: formData.slug,
        type: formData.type as 'riad' | 'villa' | 'apartment' | 'house',
        description_short: formData.shortDescription,
        description_long: formData.description,
        city: formData.city,
        district: formData.district,
        sub_district: formData.subDistrict,
        address: formData.address,
        map_location: formData.mapLocation,
        price_per_night: formData.pricePerNight,
        cleaning_fee: formData.cleaningFee,
        security_deposit: formData.securityDeposit,
        num_bedrooms: formData.numberOfBedrooms,
        num_bathrooms: formData.numberOfBathrooms,
        bedroom_guest_capacity: formData.bedroomGuestCapacity,
        additional_guest_capacity: formData.additionalGuestCapacity,
        total_guest_capacity: formData.totalGuestCapacity,
        parking_type: formData.parkingType,
        parking_spots: formData.parkingSpots,
        seo_title: formData.seoTitle,
        seo_description: formData.seoDescription,
        status: publish ? 'published' : formData.status,
        featured: formData.featured,
        airbnb_ical_url: formData.airbnbIcalUrl,
        booking_ical_url: formData.bookingIcalUrl,
        internal_ical_url: formData.internalIcalUrl,
        sleeping_arrangements: sleepingArrangements,
        features: features
      }

      // Call action and CHECK the result
      const result = await updatePropertyAction(property.id, propertyData)
      
      // Check if there was an error
      if (result.error) {
        setSaveError(result.error)
        return // Don't show success on error
      }
      
      // Only show success if no error
      setSaveSuccess(true)
      router.refresh()
    } catch (error) {
      console.error('Error updating property:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save property. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetCover = async (imageId: string) => {
    try {
      await setCoverImageAction(imageId, property.id)
      router.refresh()
    } catch (error) {
      console.error('Error setting cover image:', error)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return
    try {
      await deletePropertyImageAction(imageId, property.id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  return (
    <AdminLayout title={`Edit: ${property.title}`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/admin/properties">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
            </div>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 space-y-6">
          {/* Error Alert */}
          {saveError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Save Error</p>
                <p className="text-sm opacity-90">{saveError}</p>
              </div>
              <button onClick={() => setSaveError(null)} className="ml-auto text-destructive/70 hover:text-destructive">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={formData.status === 'draft' ? 'secondary' : formData.status === 'published' ? 'default' : 'outline'}>
                {formData.status}
              </Badge>
              {saveSuccess && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Saved!
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/properties/${property.slug}`} target="_blank">
                <Button variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </Link>
              <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Publish
              </Button>
            </div>
          </div>

          {/* General Section */}
          {activeSection === 'general' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">General Information</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Property Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Riad Luxe Medina"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="riad-luxe-medina"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Property Type</Label>
                  <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="riad">Riad</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    placeholder="Brief property description..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed property description..."
                    rows={6}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured">Featured Property</Label>
                    <p className="text-sm text-muted-foreground">Show this property prominently</p>
                  </div>
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(v) => handleInputChange('featured', v)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location Section */}
          {activeSection === 'location' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">Location</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="district">District / Quarter</Label>
                  <Select value={formData.district} onValueChange={(v) => handleInputChange('district', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAIN_DISTRICTS.map(district => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sub-district for Medina or Kasbah */}
                {(formData.district === 'Medina of Marrakech' || formData.district === 'Kasbah Royal District') && (
                  <div className="grid gap-2">
                    <Label htmlFor="subDistrict">Sub-District / Area</Label>
                    <Select 
                      value={formData.subDistrict || ''} 
                      onValueChange={(v) => handleInputChange('subDistrict', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub-district (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.district === 'Kasbah Royal District' ? KASBAH_DISTRICTS : MEDINA_DISTRICTS).map(sub => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Full address..."
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mapLocation">Google Maps Link</Label>
                  <Input
                    id="mapLocation"
                    value={formData.mapLocation}
                    onChange={(e) => handleInputChange('mapLocation', e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Capacity Section */}
          {activeSection === 'capacity' && (
            <div className="space-y-6">
              {/* Room Configuration */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bed className="w-5 h-5 text-primary" />
                  Room Configuration
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-primary" />
                      Bedrooms
                    </Label>
                    <Select
                      value={formData.numberOfBedrooms.toString()}
                      onValueChange={(value) => handleInputChange('numberOfBedrooms', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BEDROOM_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-primary" />
                      Bathrooms
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.numberOfBathrooms}
                      onChange={(e) => handleInputChange('numberOfBathrooms', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </div>

              {/* Guest Capacity */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Guest Capacity
                </h2>
                <p className="text-sm text-muted-foreground -mt-4">
                  Specify how many guests can be accommodated in different sleeping areas
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-muted/30 rounded-xl p-4">
                    <Label className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bed className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="block font-medium">Bedroom Guests</span>
                        <span className="text-xs text-muted-foreground">In bedrooms only</span>
                      </div>
                    </Label>
                    <Select
                      value={formData.bedroomGuestCapacity.toString()}
                      onValueChange={(value) => {
                        const bedroomCapacity = parseInt(value)
                        handleInputChange('bedroomGuestCapacity', bedroomCapacity)
                        handleInputChange('totalGuestCapacity', bedroomCapacity + formData.additionalGuestCapacity)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GUEST_CAPACITY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4">
                    <Label className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Sofa className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <span className="block font-medium">Additional Guests</span>
                        <span className="text-xs text-muted-foreground">Sofa beds, etc.</span>
                      </div>
                    </Label>
                    <Select
                      value={formData.additionalGuestCapacity.toString()}
                      onValueChange={(value) => {
                        const additionalCapacity = parseInt(value)
                        handleInputChange('additionalGuestCapacity', additionalCapacity)
                        handleInputChange('totalGuestCapacity', formData.bedroomGuestCapacity + additionalCapacity)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} guest{n > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <Label className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="block font-medium">Total Capacity</span>
                        <span className="text-xs text-muted-foreground">Auto-calculated</span>
                      </div>
                    </Label>
                    <div className="text-2xl font-semibold text-primary">
                      {formData.totalGuestCapacity} guests
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      = {formData.bedroomGuestCapacity} (bedrooms) + {formData.additionalGuestCapacity} (additional)
                    </p>
                  </div>
                </div>
              </div>

              {/* Sleeping Arrangements */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Detailed Sleeping Arrangements</h2>
                    <p className="text-sm text-muted-foreground">
                      Specify beds and bathroom facilities in each room
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addBedroom}>
                      <Plus className="w-3 h-3 mr-1" />
                      Bedroom
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addLivingRoom}>
                      <Plus className="w-3 h-3 mr-1" />
                      Living Room
                    </Button>
                  </div>
                </div>

                {sleepingArrangements.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <Bed className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No sleeping arrangements defined yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add bedrooms and living rooms to specify beds in each space.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sleepingArrangements.map((room, roomIndex) => (
                      <div 
                        key={roomIndex}
                        className="bg-muted/30 rounded-xl p-4 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {room.roomType === 'bedroom' ? (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bed className="w-4 h-4 text-primary" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Sofa className="w-4 h-4 text-amber-600" />
                              </div>
                            )}
                            <div>
                              <Input
                                value={room.roomName}
                                onChange={(e) => updateRoom(roomIndex, { roomName: e.target.value })}
                                className="font-medium h-8 w-40"
                              />
                              <span className="text-xs text-muted-foreground capitalize">
                                {room.roomType.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {room.roomType === 'bedroom' && (
                              <label className="flex items-center gap-2 text-sm">
                                <Switch
                                  checked={room.ensuite || false}
                                  onCheckedChange={(checked) => updateRoom(roomIndex, { 
                                    ensuite: checked,
                                    bathroomType: checked ? 'shower' : 'none'
                                  })}
                                />
                                <span className="text-muted-foreground">Ensuite</span>
                              </label>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRoom(roomIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Bathroom Type selector (when ensuite is enabled) */}
                        {room.roomType === 'bedroom' && room.ensuite && (
                          <div className="pl-11 pb-2">
                            <Label className="text-xs text-muted-foreground mb-1 block">Bathroom Type</Label>
                            <Select
                              value={room.bathroomType || 'shower'}
                              onValueChange={(value) => updateRoom(roomIndex, { bathroomType: value as BathroomType })}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(BATHROOM_TYPE_LABELS).map(([value, label]) => (
                                  value !== 'none' && (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Beds in this room */}
                        <div className="space-y-2 pl-11">
                          {room.beds.map((bed, bedIndex) => (
                            <div key={bedIndex} className="flex items-center gap-2">
                              <Select
                                value={bed.type}
                                onValueChange={(value) => updateBed(roomIndex, bedIndex, { type: value as BedType })}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(BED_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-muted-foreground">x</span>
                              <Input
                                type="number"
                                min="1"
                                max="4"
                                value={bed.quantity}
                                onChange={(e) => updateBed(roomIndex, bedIndex, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-16"
                              />
                              {room.beds.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBedFromRoom(roomIndex, bedIndex)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addBedToRoom(roomIndex)}
                            className="text-primary"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Bed
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features & Amenities Section */}
          {activeSection === 'features' && (
            <div className="space-y-6">
              {/* Pool & Wellness */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Waves className="w-5 h-5 text-primary" />
                  Pool & Wellness
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['heatedPool', 'unheatedPool', 'heatedPlungePool', 'unheatedPlungePool', 'jacuzzi', 'hammam'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <Switch
                        checked={features[key]}
                        onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, [key]: checked }))}
                      />
                      <span className="text-sm">{FEATURE_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comfort & Interior */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  Comfort & Interior
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['fireplace', 'bathtub', 'wifi', 'airConditioning'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <Switch
                        checked={features[key]}
                        onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, [key]: checked }))}
                      />
                      <span className="text-sm">{FEATURE_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Outdoor Spaces */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mountain className="w-5 h-5 text-primary" />
                  Outdoor & Views
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['terrace', 'rooftop', 'privateTerminate', 'mountainView', 'koutboubiaView', 'mouleyYazidView', 'monumentsView', 'souks'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <Switch
                        checked={features[key]}
                        onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, [key]: checked }))}
                      />
                      <span className="text-sm">{FEATURE_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kitchen & Appliances */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Kitchen & Appliances
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['gasStove', 'oven', 'fridge', 'dishwasher', 'washingMachine', 'iron', 'coffeeMachine'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <Switch
                        checked={features[key]}
                        onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, [key]: checked }))}
                      />
                      <span className="text-sm">{FEATURE_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Services Available */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Services Available
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['breakfastPossible', 'mealsPossible', 'airportTransferPossible', 'privateDriverPossible', 'excursionsPossible'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <Switch
                        checked={features[key]}
                        onCheckedChange={(checked) => setFeatures(prev => ({ ...prev, [key]: checked }))}
                      />
                      <span className="text-sm">{FEATURE_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Section */}
          {activeSection === 'pricing' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">Pricing</h3>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pricePerNight">Price per Night (EUR)</Label>
                  <Input
                    id="pricePerNight"
                    type="number"
                    min="0"
                    value={formData.pricePerNight}
                    onChange={(e) => handleInputChange('pricePerNight', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cleaningFee">Cleaning Fee (EUR)</Label>
                  <Input
                    id="cleaningFee"
                    type="number"
                    min="0"
                    value={formData.cleaningFee}
                    onChange={(e) => handleInputChange('cleaningFee', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="securityDeposit">Security Deposit (EUR)</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    min="0"
                    value={formData.securityDeposit}
                    onChange={(e) => handleInputChange('securityDeposit', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

            </div>
            
            {/* Advanced Pricing Management */}
            <div className="mt-6">
              <PropertyPricingForm 
                propertyId={property.id} 
                basePrice={formData.pricePerNight}
              />
            </div>
          )}

          {/* Services Section */}
          {activeSection === 'services' && (
            <PropertyServicesForm propertyId={property.id} />
          )}

          {/* Parking Section */}
          {activeSection === 'parking' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">Parking</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="parkingType">Parking Type</Label>
                  <Select value={formData.parkingType} onValueChange={(v) => handleInputChange('parkingType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parking</SelectItem>
                      <SelectItem value="street">Street Parking</SelectItem>
                      <SelectItem value="private">Private Parking</SelectItem>
                      <SelectItem value="garage">Garage</SelectItem>
                      <SelectItem value="valet">Valet Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="parkingSpots">Number of Spots</Label>
                  <Input
                    id="parkingSpots"
                    type="number"
                    min="0"
                    value={formData.parkingSpots}
                    onChange={(e) => handleInputChange('parkingSpots', parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Non-persisted field - kept for future use */}
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Additional (not saved to database)</h4>
                    <Badge variant="outline" className="text-xs">UI Only</Badge>
                  </div>
                  <div className="grid gap-2 opacity-60">
                    <Label htmlFor="parkingNotes">Parking Notes</Label>
                    <Textarea
                      id="parkingNotes"
                      value={formData.parkingNotes}
                      onChange={(e) => handleInputChange('parkingNotes', e.target.value)}
                      placeholder="Additional parking information..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">This field is not yet connected to the database.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Section */}
          {activeSection === 'sync' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">Calendar Sync</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="airbnbIcal">Airbnb iCal URL</Label>
                  <Input
                    id="airbnbIcal"
                    value={formData.airbnbIcalUrl}
                    onChange={(e) => handleInputChange('airbnbIcalUrl', e.target.value)}
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bookingIcal">Booking.com iCal URL</Label>
                  <Input
                    id="bookingIcal"
                    value={formData.bookingIcalUrl}
                    onChange={(e) => handleInputChange('bookingIcalUrl', e.target.value)}
                    placeholder="https://admin.booking.com/..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="internalIcal">Internal iCal URL</Label>
                  <Input
                    id="internalIcal"
                    value={formData.internalIcalUrl}
                    onChange={(e) => handleInputChange('internalIcalUrl', e.target.value)}
                    placeholder="Your own calendar URL..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEO Section */}
          {activeSection === 'seo' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">SEO</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                    placeholder="Custom page title for search engines"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription}
                    onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                    placeholder="Meta description for search engines..."
                    rows={3}
                  />
                </div>

                {/* Non-persisted field - kept for future use */}
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Additional (not saved to database)</h4>
                    <Badge variant="outline" className="text-xs">UI Only</Badge>
                  </div>
                  <div className="grid gap-2 opacity-60">
                    <Label htmlFor="seoKeywords">SEO Keywords</Label>
                    <Input
                      id="seoKeywords"
                      value={formData.seoKeywords}
                      onChange={(e) => handleInputChange('seoKeywords', e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                    <p className="text-xs text-muted-foreground">This field is not yet connected to the database.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media Section */}
          {activeSection === 'media' && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">Property Images</h3>
              
              {/* Existing Images */}
              {property.property_images && property.property_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {property.property_images
                    .filter(img => img.media?.blob_url)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((image) => (
                      <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                        <Image
                          src={image.media!.blob_url}
                          alt={image.media?.alt_text || property.title}
                          fill
                          className="object-cover"
                        />
                        {image.is_primary && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-primary">Cover</Badge>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!image.is_primary && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSetCover(image.id)}
                            >
                              Set Cover
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No images uploaded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Image upload will be available after saving
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bottom Save Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save & Publish
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
