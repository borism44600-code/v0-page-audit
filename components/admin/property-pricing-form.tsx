'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus, CalendarDays, DollarSign, Clock, Loader2, Save, AlertCircle } from 'lucide-react'
import { 
  getPricingRules, 
  setMonthlyPrices, 
  createPricingRule, 
  deletePricingRule,
  getBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  type PricingRule,
  type BlockedDate
} from '@/app/admin/pricing/actions'
import { format } from 'date-fns'

interface PropertyPricingFormProps {
  propertyId: string
  basePrice: number
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function PropertyPricingForm({ propertyId, basePrice }: PropertyPricingFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Monthly prices
  const [monthlyPrices, setMonthlyPrices] = useState<{ month: number; price: number; minNights: number }[]>(
    MONTHS.map((_, i) => ({ month: i + 1, price: basePrice, minNights: 1 }))
  )
  
  // Period overrides
  const [periodRules, setPeriodRules] = useState<PricingRule[]>([])
  
  // Date overrides
  const [dateOverrides, setDateOverrides] = useState<PricingRule[]>([])
  
  // Blocked dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  
  // New rule form state
  const [newPeriodStart, setNewPeriodStart] = useState<Date>()
  const [newPeriodEnd, setNewPeriodEnd] = useState<Date>()
  const [newPeriodPrice, setNewPeriodPrice] = useState('')
  const [newPeriodName, setNewPeriodName] = useState('')
  const [newPeriodMinNights, setNewPeriodMinNights] = useState('1')
  
  // New block form state
  const [newBlockStart, setNewBlockStart] = useState<Date>()
  const [newBlockEnd, setNewBlockEnd] = useState<Date>()
  const [newBlockReason, setNewBlockReason] = useState('')
  const [newBlockType, setNewBlockType] = useState<'manual' | 'maintenance' | 'owner_use'>('manual')
  
  useEffect(() => {
    loadData()
  }, [propertyId])
  
  async function loadData() {
    setLoading(true)
    setError(null)
    
    try {
      // Load pricing rules
      const { data: rules, error: rulesError } = await getPricingRules(propertyId)
      if (rulesError) throw new Error(rulesError)
      
      if (rules) {
        // Separate rules by type
        const monthly = rules.filter(r => r.rule_type === 'monthly')
        const periods = rules.filter(r => r.rule_type === 'period')
        const dates = rules.filter(r => r.rule_type === 'date_override')
        
        // Map monthly rules to state
        if (monthly.length > 0) {
          setMonthlyPrices(MONTHS.map((_, i) => {
            const rule = monthly.find(r => r.month === i + 1)
            return {
              month: i + 1,
              price: rule?.price_per_night || basePrice,
              minNights: rule?.min_nights || 1
            }
          }))
        }
        
        setPeriodRules(periods)
        setDateOverrides(dates)
      }
      
      // Load blocked dates
      const { data: blocks, error: blocksError } = await getBlockedDates(propertyId)
      if (blocksError) throw new Error(blocksError)
      
      if (blocks) {
        setBlockedDates(blocks)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing data')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSaveMonthlyPrices() {
    setSaving(true)
    setError(null)
    
    try {
      const { error } = await setMonthlyPrices(propertyId, monthlyPrices)
      if (error) throw new Error(error)
      
      setSuccessMessage('Monthly prices saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save monthly prices')
    } finally {
      setSaving(false)
    }
  }
  
  async function handleAddPeriodRule() {
    if (!newPeriodStart || !newPeriodEnd || !newPeriodPrice) {
      setError('Please fill in all period fields')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const { data, error } = await createPricingRule({
        property_id: propertyId,
        rule_type: 'period',
        start_date: format(newPeriodStart, 'yyyy-MM-dd'),
        end_date: format(newPeriodEnd, 'yyyy-MM-dd'),
        price_per_night: parseFloat(newPeriodPrice),
        min_nights: parseInt(newPeriodMinNights) || 1,
        name: newPeriodName || undefined,
        priority: 20,
        is_active: true
      })
      
      if (error) throw new Error(error)
      
      if (data) {
        setPeriodRules([...periodRules, data])
      }
      
      // Reset form
      setNewPeriodStart(undefined)
      setNewPeriodEnd(undefined)
      setNewPeriodPrice('')
      setNewPeriodName('')
      setNewPeriodMinNights('1')
      
      setSuccessMessage('Period pricing rule added')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add period rule')
    } finally {
      setSaving(false)
    }
  }
  
  async function handleDeletePeriodRule(id: string) {
    setSaving(true)
    
    try {
      const { error } = await deletePricingRule(id)
      if (error) throw new Error(error)
      
      setPeriodRules(periodRules.filter(r => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule')
    } finally {
      setSaving(false)
    }
  }
  
  async function handleAddBlockedDate() {
    if (!newBlockStart || !newBlockEnd) {
      setError('Please select start and end dates')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const { data, error } = await createBlockedDate({
        property_id: propertyId,
        start_date: format(newBlockStart, 'yyyy-MM-dd'),
        end_date: format(newBlockEnd, 'yyyy-MM-dd'),
        reason: newBlockReason || undefined,
        block_type: newBlockType
      })
      
      if (error) throw new Error(error)
      
      if (data) {
        setBlockedDates([...blockedDates, data])
      }
      
      // Reset form
      setNewBlockStart(undefined)
      setNewBlockEnd(undefined)
      setNewBlockReason('')
      setNewBlockType('manual')
      
      setSuccessMessage('Blocked dates added')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add blocked dates')
    } finally {
      setSaving(false)
    }
  }
  
  async function handleDeleteBlockedDate(id: string) {
    setSaving(true)
    
    try {
      const { error } = await deleteBlockedDate(id)
      if (error) throw new Error(error)
      
      setBlockedDates(blockedDates.filter(b => b.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blocked dates')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}
      
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            Monthly Prices
          </TabsTrigger>
          <TabsTrigger value="periods" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Special Periods
          </TabsTrigger>
          <TabsTrigger value="blocked" className="gap-2">
            <Clock className="w-4 h-4" />
            Blocked Dates
          </TabsTrigger>
        </TabsList>
        
        {/* Monthly Prices Tab */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Pricing</CardTitle>
              <CardDescription>
                Set different prices for each month of the year. Leave at base price ({basePrice}€) if no seasonal variation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {monthlyPrices.map((mp, index) => (
                  <div key={mp.month} className="space-y-2 p-3 border rounded-lg">
                    <Label className="font-medium">{MONTHS[index]}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={mp.price}
                        onChange={(e) => {
                          const newPrices = [...monthlyPrices]
                          newPrices[index].price = parseFloat(e.target.value) || 0
                          setMonthlyPrices(newPrices)
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">€/night</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={mp.minNights}
                        onChange={(e) => {
                          const newPrices = [...monthlyPrices]
                          newPrices[index].minNights = parseInt(e.target.value) || 1
                          setMonthlyPrices(newPrices)
                        }}
                        className="w-16"
                        min={1}
                      />
                      <span className="text-xs text-muted-foreground">min nights</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveMonthlyPrices} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Monthly Prices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Special Periods Tab */}
        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Special Period Pricing</CardTitle>
              <CardDescription>
                Override prices for specific date ranges (holidays, events, high season).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing periods */}
              {periodRules.length > 0 && (
                <div className="space-y-2">
                  <Label>Active Period Rules</Label>
                  <div className="space-y-2">
                    {periodRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{rule.name || 'Period Override'}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.start_date} → {rule.end_date} | {rule.price_per_night}€/night
                            {rule.min_nights && rule.min_nights > 1 && ` | Min ${rule.min_nights} nights`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePeriodRule(rule.id)}
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add new period */}
              <div className="border-t pt-6">
                <Label className="mb-4 block">Add New Period</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Period Name (optional)</Label>
                    <Input
                      value={newPeriodName}
                      onChange={(e) => setNewPeriodName(e.target.value)}
                      placeholder="e.g., Christmas Season"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Price per Night (€)</Label>
                    <Input
                      type="number"
                      value={newPeriodPrice}
                      onChange={(e) => setNewPeriodPrice(e.target.value)}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Start Date</Label>
                    <Calendar
                      mode="single"
                      selected={newPeriodStart}
                      onSelect={setNewPeriodStart}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">End Date</Label>
                    <Calendar
                      mode="single"
                      selected={newPeriodEnd}
                      onSelect={setNewPeriodEnd}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Minimum Nights</Label>
                    <Input
                      type="number"
                      value={newPeriodMinNights}
                      onChange={(e) => setNewPeriodMinNights(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={handleAddPeriodRule} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Period Rule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Blocked Dates Tab */}
        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocked Dates</CardTitle>
              <CardDescription>
                Block dates manually for maintenance, owner use, or other reasons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing blocks */}
              {blockedDates.length > 0 && (
                <div className="space-y-2">
                  <Label>Currently Blocked</Label>
                  <div className="space-y-2">
                    {blockedDates.map((block) => (
                      <div key={block.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium text-red-800">
                            {block.start_date} → {block.end_date}
                          </p>
                          <p className="text-sm text-red-600">
                            {block.block_type === 'maintenance' && 'Maintenance'}
                            {block.block_type === 'owner_use' && 'Owner Use'}
                            {block.block_type === 'manual' && 'Manual Block'}
                            {block.reason && ` - ${block.reason}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBlockedDate(block.id)}
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add new block */}
              <div className="border-t pt-6">
                <Label className="mb-4 block">Block New Dates</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Block Type</Label>
                    <Select value={newBlockType} onValueChange={(v) => setNewBlockType(v as typeof newBlockType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Block</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="owner_use">Owner Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Reason (optional)</Label>
                    <Input
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      placeholder="e.g., Renovation work"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Start Date</Label>
                    <Calendar
                      mode="single"
                      selected={newBlockStart}
                      onSelect={setNewBlockStart}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">End Date</Label>
                    <Calendar
                      mode="single"
                      selected={newBlockEnd}
                      onSelect={setNewBlockEnd}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={handleAddBlockedDate} disabled={saving} variant="destructive">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Block These Dates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
