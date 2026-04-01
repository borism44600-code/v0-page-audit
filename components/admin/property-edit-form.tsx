'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, Save, Eye, Bed, Trash2,
  MapPin, DollarSign, Image as ImageIcon, Globe, Settings2, Car, Loader2
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
  { id: 'pricing', title: 'Pricing', icon: DollarSign },
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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
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
        internal_ical_url: formData.internalIcalUrl
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
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    placeholder="e.g., Medina, Gueliz, Palmeraie"
                  />
                </div>

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
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-lg font-semibold">Capacity & Rooms</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="1"
                    value={formData.numberOfBedrooms}
                    onChange={(e) => handleInputChange('numberOfBedrooms', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Number of Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="1"
                    value={formData.numberOfBathrooms}
                    onChange={(e) => handleInputChange('numberOfBathrooms', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bedroomCapacity">Bedroom Guest Capacity</Label>
                  <Input
                    id="bedroomCapacity"
                    type="number"
                    min="1"
                    value={formData.bedroomGuestCapacity}
                    onChange={(e) => handleInputChange('bedroomGuestCapacity', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="additionalCapacity">Additional Guest Capacity</Label>
                  <Input
                    id="additionalCapacity"
                    type="number"
                    min="0"
                    value={formData.additionalGuestCapacity}
                    onChange={(e) => handleInputChange('additionalGuestCapacity', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="totalCapacity">Total Guest Capacity</Label>
                  <Input
                    id="totalCapacity"
                    type="number"
                    min="1"
                    value={formData.totalGuestCapacity}
                    onChange={(e) => handleInputChange('totalGuestCapacity', parseInt(e.target.value) || 1)}
                  />
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

              {/* Non-persisted field - kept for future use */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Additional (not saved to database)</h4>
                  <Badge variant="outline" className="text-xs">UI Only</Badge>
                </div>
                <div className="grid gap-2 opacity-60">
                  <Label htmlFor="serviceFee">Service Fee (EUR)</Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    min="0"
                    value={formData.serviceFee}
                    onChange={(e) => handleInputChange('serviceFee', parseFloat(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">This field is not yet connected to the database.</p>
                </div>
              </div>
            </div>
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
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((image) => (
                      <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                        <Image
                          src={image.image_url}
                          alt={image.alt_text || property.title}
                          fill
                          className="object-cover"
                        />
                        {image.is_cover && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-primary">Cover</Badge>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!image.is_cover && (
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
