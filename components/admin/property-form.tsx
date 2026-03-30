'use client'

import { useState } from 'react'
import { Bed, Users, Sofa, Bath, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Property, PropertyType, BEDROOM_OPTIONS, SLEEPING_CAPACITY_OPTIONS } from '@/lib/types'

interface PropertyFormProps {
  property?: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<Property>) => void
}

export function PropertyForm({ property, open, onOpenChange, onSave }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: property?.title || '',
    type: property?.type || 'riad' as PropertyType,
    shortDescription: property?.shortDescription || '',
    pricePerNight: property?.pricePerNight || 0,
    bedrooms: property?.bedrooms || 1,
    bathrooms: property?.bathrooms || 1,
    maxGuests: property?.maxGuests || 2,
    mainSleepingCapacity: property?.mainSleepingCapacity || 2,
    additionalSleepingCapacity: property?.additionalSleepingCapacity || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {property ? 'Edit Property' : 'Add New Property'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Riad Jardin Secret"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="type">Property Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateField('type', value as PropertyType)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riad">Riad</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price per Night (€)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.pricePerNight}
                  onChange={(e) => updateField('pricePerNight', parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  placeholder="Brief description of the property..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Room Configuration */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Room Configuration
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bedrooms" className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-primary" />
                  Bedrooms
                </Label>
                <Select
                  value={formData.bedrooms.toString()}
                  onValueChange={(value) => updateField('bedrooms', parseInt(value))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select" />
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

              <div>
                <Label htmlFor="bathrooms" className="flex items-center gap-2">
                  <Bath className="w-4 h-4 text-primary" />
                  Bathrooms
                </Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.bathrooms}
                  onChange={(e) => updateField('bathrooms', parseInt(e.target.value) || 1)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="maxGuests" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Max Guests
                </Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.maxGuests}
                  onChange={(e) => updateField('maxGuests', parseInt(e.target.value) || 1)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Sleeping Capacity */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Sleeping Capacity
            </h3>
            <p className="text-sm text-muted-foreground -mt-2">
              Specify how many guests can sleep in regular beds vs. extra beds
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-secondary/30 rounded-xl p-4">
                <Label htmlFor="mainSleeping" className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bed className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="block font-medium">Main Beds</span>
                    <span className="text-xs text-muted-foreground">In bedrooms</span>
                  </div>
                </Label>
                <Select
                  value={formData.mainSleepingCapacity.toString()}
                  onValueChange={(value) => updateField('mainSleepingCapacity', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLEEPING_CAPACITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-secondary/30 rounded-xl p-4">
                <Label htmlFor="additionalSleeping" className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Sofa className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <span className="block font-medium">Extra Beds</span>
                    <span className="text-xs text-muted-foreground">Sofa beds, pull-outs, etc.</span>
                  </div>
                </Label>
                <Select
                  value={formData.additionalSleepingCapacity.toString()}
                  onValueChange={(value) => updateField('additionalSleepingCapacity', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select capacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="1">1 extra</SelectItem>
                    <SelectItem value="2">2 extra</SelectItem>
                    <SelectItem value="3">3 extra</SelectItem>
                    <SelectItem value="4">4 extra</SelectItem>
                    <SelectItem value="5">5+ extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Capacity Summary */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total sleeping capacity</span>
                <span className="font-semibold">
                  {formData.mainSleepingCapacity + formData.additionalSleepingCapacity} guests
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="w-3 h-3" />
                  {formData.mainSleepingCapacity} in beds
                </span>
                {formData.additionalSleepingCapacity > 0 && (
                  <span className="flex items-center gap-1">
                    <Sofa className="w-3 h-3" />
                    +{formData.additionalSleepingCapacity} extra
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-gold text-black hover:bg-gold/90">
              <Save className="w-4 h-4 mr-2" />
              {property ? 'Save Changes' : 'Create Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
