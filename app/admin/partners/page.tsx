'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  X,
  Save,
  Upload,
  Phone,
  Globe,
  MapPin,
  Tag,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { AdminLayout } from '@/components/admin/admin-layout'
import { mockPartners } from '@/lib/data'

// Extended partner type for admin
interface AdminPartner {
  id: string
  name: string
  category: 'restaurant' | 'spa' | 'tour' | 'activity' | 'transport' | 'driver' | 'other'
  shortDescription: string
  fullDescription: string
  image: string
  gallery?: string[]
  website?: string
  whatsapp?: string
  phone?: string
  email?: string
  district?: string
  address?: string
  pricingNotes?: string
  discountCode?: string
  discountDetails?: string
  bookingCTA?: string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  createdAt: string
  updatedAt: string
}

const categoryLabels: Record<string, string> = {
  restaurant: 'Restaurant',
  spa: 'Spa & Wellness',
  tour: 'Tours & Excursions',
  activity: 'Activities',
  transport: 'Transport',
  driver: 'Private Driver',
  other: 'Other Services',
}

const categoryOptions = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'tour', label: 'Tours & Excursions' },
  { value: 'activity', label: 'Activities' },
  { value: 'transport', label: 'Transport' },
  { value: 'driver', label: 'Private Driver' },
  { value: 'other', label: 'Other Services' },
]

// Convert mock partners to admin format
const adminPartners: AdminPartner[] = mockPartners.map(p => ({
  id: p.id,
  name: p.name,
  category: p.category,
  shortDescription: p.description.substring(0, 100),
  fullDescription: p.description,
  image: p.image,
  website: p.website,
  discountCode: p.discountCode,
  bookingCTA: p.bookingProcedure,
  status: 'published',
  featured: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}))

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<AdminPartner[]>(adminPartners)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<AdminPartner | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'restaurant' as AdminPartner['category'],
    shortDescription: '',
    fullDescription: '',
    image: '',
    website: '',
    whatsapp: '',
    phone: '',
    email: '',
    district: '',
    address: '',
    pricingNotes: '',
    discountCode: '',
    discountDetails: '',
    bookingCTA: '',
    status: 'draft' as AdminPartner['status'],
    featured: false,
  })

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || partner.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const openAddForm = () => {
    setEditingPartner(null)
    setFormData({
      name: '',
      category: 'restaurant',
      shortDescription: '',
      fullDescription: '',
      image: '',
      website: '',
      whatsapp: '',
      phone: '',
      email: '',
      district: '',
      address: '',
      pricingNotes: '',
      discountCode: '',
      discountDetails: '',
      bookingCTA: '',
      status: 'draft',
      featured: false,
    })
    setFormOpen(true)
  }

  const openEditForm = (partner: AdminPartner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      category: partner.category,
      shortDescription: partner.shortDescription,
      fullDescription: partner.fullDescription,
      image: partner.image,
      website: partner.website || '',
      whatsapp: partner.whatsapp || '',
      phone: partner.phone || '',
      email: partner.email || '',
      district: partner.district || '',
      address: partner.address || '',
      pricingNotes: partner.pricingNotes || '',
      discountCode: partner.discountCode || '',
      discountDetails: partner.discountDetails || '',
      bookingCTA: partner.bookingCTA || '',
      status: partner.status,
      featured: partner.featured,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // In production, this would save to the database
    console.log('Saving partner:', formData)
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (editingPartner) {
      // Update existing
      setPartners(partners.map(p => 
        p.id === editingPartner.id 
          ? { ...p, ...formData, updatedAt: new Date().toISOString() }
          : p
      ))
    } else {
      // Add new
      const newPartner: AdminPartner = {
        id: `partner-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setPartners([...partners, newPartner])
    }
    
    setIsSaving(false)
    setFormOpen(false)
  }

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AdminLayout title="Partners & Activities">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total Partners</p>
            <p className="text-2xl font-bold">{partners.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-green-600">
              {partners.filter(p => p.status === 'published').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Restaurants</p>
            <p className="text-2xl font-bold">
              {partners.filter(p => p.category === 'restaurant').length}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Services</p>
            <p className="text-2xl font-bold">
              {partners.filter(p => ['spa', 'tour', 'activity', 'transport', 'driver'].includes(p.category)).length}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search partners..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={openAddForm}>
            <Plus className="w-4 h-4" />
            Add Partner
          </Button>
        </div>

        {/* Partners Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <Image
                            src={partner.image}
                            alt={partner.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{partner.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {partner.shortDescription}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[partner.category] || partner.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {partner.website && (
                          <a 
                            href={partner.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" />
                          </a>
                        )}
                        {partner.phone && (
                          <a href={`tel:${partner.phone}`} className="text-muted-foreground hover:text-foreground">
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                        {partner.whatsapp && (
                          <a 
                            href={`https://wa.me/${partner.whatsapp}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        )}
                        {!partner.website && !partner.phone && !partner.whatsapp && (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {partner.discountCode ? (
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {partner.discountCode}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={partner.status === 'published' ? 'default' : partner.status === 'draft' ? 'secondary' : 'outline'}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditForm(partner)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {partner.website && (
                            <DropdownMenuItem asChild>
                              <a href={partner.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Visit Website
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredPartners.length} of {partners.length} partners
        </div>
      </div>

      {/* Partner Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Partner Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Le Jardin Restaurant"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateField('category', value as AdminPartner['category'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateField('status', value as AdminPartner['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="shortDescription">Short Description *</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => updateField('shortDescription', e.target.value)}
                    placeholder="Brief description for cards..."
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="fullDescription">Full Description</Label>
                  <Textarea
                    id="fullDescription"
                    value={formData.fullDescription}
                    onChange={(e) => updateField('fullDescription', e.target.value)}
                    placeholder="Detailed description..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+212 5 00 00 00 00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    placeholder="212600000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District / Area</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    placeholder="e.g., Medina"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Discount */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Pricing & Discounts
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="pricingNotes">Pricing Notes</Label>
                  <Textarea
                    id="pricingNotes"
                    value={formData.pricingNotes}
                    onChange={(e) => updateField('pricingNotes', e.target.value)}
                    placeholder="e.g., Lunch menu from 150 MAD, Dinner menu from 300 MAD"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountCode">Discount Code</Label>
                  <Input
                    id="discountCode"
                    value={formData.discountCode}
                    onChange={(e) => updateField('discountCode', e.target.value)}
                    placeholder="e.g., MARRAKECH10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountDetails">Discount Details</Label>
                  <Input
                    id="discountDetails"
                    value={formData.discountDetails}
                    onChange={(e) => updateField('discountDetails', e.target.value)}
                    placeholder="e.g., 10% off total bill"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="bookingCTA">Booking / Contact CTA Text</Label>
                  <Input
                    id="bookingCTA"
                    value={formData.bookingCTA}
                    onChange={(e) => updateField('bookingCTA', e.target.value)}
                    placeholder="e.g., Reserve a table via WhatsApp"
                  />
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Image
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="image">Cover Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => updateField('image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  In production, you would upload images here
                </p>
              </div>

              {formData.image && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={formData.image}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* Featured */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="featured">Featured Partner</Label>
                <p className="text-xs text-muted-foreground">Show prominently on website</p>
              </div>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => updateField('featured', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : editingPartner ? 'Update Partner' : 'Add Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
