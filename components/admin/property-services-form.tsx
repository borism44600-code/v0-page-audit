'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Coffee, UtensilsCrossed, Plane, Baby, Bed, Loader2, Save, CheckCircle2
} from 'lucide-react'
import { 
  getPropertyServicePricing, 
  updatePropertyServicePricing,
  type PropertyServicePricing 
} from '@/app/admin/services/actions'

interface PropertyServicesFormProps {
  propertyId: string
}

export function PropertyServicesForm({ propertyId }: PropertyServicesFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Form state
  const [pricing, setPricing] = useState<Partial<PropertyServicePricing>>({
    // Breakfast
    breakfast_available: false,
    breakfast_adult_price: 15,
    breakfast_child_price: 8,
    breakfast_child_age_limit: 12,
    // Meals
    lunch_available: false,
    lunch_adult_price: 25,
    lunch_child_price: 15,
    dinner_available: false,
    dinner_adult_price: 40,
    dinner_child_price: 20,
    // Transfer
    transfer_available: false,
    transfer_arrival_price: 25,
    transfer_departure_price: 25,
    transfer_roundtrip_price: 45,
    transfer_max_passengers: 6,
    transfer_vehicle_type: 'Standard',
    // Extras
    extra_bed_available: false,
    extra_bed_price: 30,
    crib_available: false,
    crib_price: 0
  })

  // Load existing pricing
  useEffect(() => {
    async function loadPricing() {
      const existing = await getPropertyServicePricing(propertyId)
      if (existing) {
        setPricing(existing)
      }
    }
    loadPricing()
  }, [propertyId])

  const handleSave = () => {
    setSaveSuccess(false)
    setSaveError(null)
    
    startTransition(async () => {
      const result = await updatePropertyServicePricing(propertyId, pricing)
      
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    })
  }

  const updatePricing = (field: string, value: number | boolean | string) => {
    setPricing(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
  }

  return (
    <div className="space-y-6">
      {/* Breakfast Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Breakfast Service</CardTitle>
                <CardDescription>Configure breakfast pricing for guests</CardDescription>
              </div>
            </div>
            <Switch
              checked={pricing.breakfast_available}
              onCheckedChange={(checked) => updatePricing('breakfast_available', checked)}
            />
          </div>
        </CardHeader>
        {pricing.breakfast_available && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Adult Price</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={pricing.breakfast_adult_price}
                    onChange={(e) => updatePricing('breakfast_adult_price', parseFloat(e.target.value) || 0)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Child Price</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={pricing.breakfast_child_price}
                    onChange={(e) => updatePricing('breakfast_child_price', parseFloat(e.target.value) || 0)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Child Age Limit</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="18"
                    value={pricing.breakfast_child_age_limit}
                    onChange={(e) => updatePricing('breakfast_child_age_limit', parseInt(e.target.value) || 12)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Meals Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">Meals Service</CardTitle>
              <CardDescription>Configure lunch and dinner pricing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lunch */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Lunch Available</Label>
              <Switch
                checked={pricing.lunch_available}
                onCheckedChange={(checked) => updatePricing('lunch_available', checked)}
              />
            </div>
            {pricing.lunch_available && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-border">
                <div className="space-y-2">
                  <Label>Adult Price</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={pricing.lunch_adult_price}
                      onChange={(e) => updatePricing('lunch_adult_price', parseFloat(e.target.value) || 0)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Child Price</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={pricing.lunch_child_price}
                      onChange={(e) => updatePricing('lunch_child_price', parseFloat(e.target.value) || 0)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dinner */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Dinner Available</Label>
              <Switch
                checked={pricing.dinner_available}
                onCheckedChange={(checked) => updatePricing('dinner_available', checked)}
              />
            </div>
            {pricing.dinner_available && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-border">
                <div className="space-y-2">
                  <Label>Adult Price</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={pricing.dinner_adult_price}
                      onChange={(e) => updatePricing('dinner_adult_price', parseFloat(e.target.value) || 0)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Child Price</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={pricing.dinner_child_price}
                      onChange={(e) => updatePricing('dinner_child_price', parseFloat(e.target.value) || 0)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Airport Transfer Pricing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Airport Transfer</CardTitle>
                <CardDescription>Configure airport transfer pricing</CardDescription>
              </div>
            </div>
            <Switch
              checked={pricing.transfer_available}
              onCheckedChange={(checked) => updatePricing('transfer_available', checked)}
            />
          </div>
        </CardHeader>
        {pricing.transfer_available && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Arrival Price</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={pricing.transfer_arrival_price}
                    onChange={(e) => updatePricing('transfer_arrival_price', parseFloat(e.target.value) || 0)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Departure Price</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={pricing.transfer_departure_price}
                    onChange={(e) => updatePricing('transfer_departure_price', parseFloat(e.target.value) || 0)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Round Trip Price</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={pricing.transfer_roundtrip_price}
                    onChange={(e) => updatePricing('transfer_roundtrip_price', parseFloat(e.target.value) || 0)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Passengers</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={pricing.transfer_max_passengers}
                  onChange={(e) => updatePricing('transfer_max_passengers', parseInt(e.target.value) || 6)}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Input
                  value={pricing.transfer_vehicle_type}
                  onChange={(e) => updatePricing('transfer_vehicle_type', e.target.value)}
                  placeholder="e.g., Standard, Premium, Van"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Extra Bed & Crib */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Bed className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Extra Bedding</CardTitle>
              <CardDescription>Configure extra bed and crib pricing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Extra Bed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bed className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Extra Bed Available</Label>
                <p className="text-xs text-muted-foreground">Per night</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pricing.extra_bed_available && (
                <div className="relative w-24">
                  <Input
                    type="number"
                    min="0"
                    value={pricing.extra_bed_price}
                    onChange={(e) => updatePricing('extra_bed_price', parseFloat(e.target.value) || 0)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
              )}
              <Switch
                checked={pricing.extra_bed_available}
                onCheckedChange={(checked) => updatePricing('extra_bed_available', checked)}
              />
            </div>
          </div>

          {/* Crib */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Baby className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Crib Available</Label>
                <p className="text-xs text-muted-foreground">Per stay (usually free)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pricing.crib_available && (
                <div className="relative w-24">
                  <Input
                    type="number"
                    min="0"
                    value={pricing.crib_price}
                    onChange={(e) => updatePricing('crib_price', parseFloat(e.target.value) || 0)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                </div>
              )}
              <Switch
                checked={pricing.crib_available}
                onCheckedChange={(checked) => updatePricing('crib_available', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Saved successfully
          </p>
        )}
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Service Pricing
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
