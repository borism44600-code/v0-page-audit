'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  Loader2
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AdminLayout } from '@/components/admin/admin-layout'
import { createServiceAction, updateServiceAction, deleteServiceAction } from '@/app/admin/actions'

interface Service {
  id: string
  name_en: string
  name_fr?: string
  description_en?: string
  description_fr?: string
  category: string
  price?: number
  price_unit?: string
  image?: string
  slug?: string
  is_active?: boolean
  sort_order?: number
  created_at?: string
}

interface ServicesAdminProps {
  initialServices: Service[]
}

const categoryLabels: Record<string, string> = {
  concierge: 'Concierge',
  transport: 'Transport',
  catering: 'Catering',
  wellness: 'Wellness & Spa',
  cleaning: 'Cleaning',
  experiences: 'Experiences',
  other: 'Other',
}

const categoryOptions = [
  { value: 'concierge', label: 'Concierge' },
  { value: 'transport', label: 'Transport' },
  { value: 'catering', label: 'Catering' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'other', label: 'Other' },
]

const emptyService: Partial<Service> = {
  name_en: '',
  name_fr: '',
  description_en: '',
  description_fr: '',
  category: 'concierge',
  price: 0,
  price_unit: 'per service',
  image: '',
  is_active: true,
  sort_order: 0,
}

export function ServicesAdmin({ initialServices }: ServicesAdminProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [services, setServices] = useState<Service[]>(initialServices)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null)
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<Service>>(emptyService)
  const [isSaving, setIsSaving] = useState(false)

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description_en || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && service.is_active) ||
      (statusFilter === 'inactive' && !service.is_active)
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleOpenCreate = () => {
    setFormData(emptyService)
    setEditingService(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (service: Service) => {
    setFormData(service)
    setEditingService(service)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name_en || !formData.category) {
      return
    }

    setIsSaving(true)

    try {
      if (editingService?.id) {
        // Update existing service
        const result = await updateServiceAction(editingService.id, formData)
        if (result.error) {
          console.error('Error updating service:', result.error)
          return
        }
        setServices(prev => prev.map(s => 
          s.id === editingService.id ? { ...s, ...formData } as Service : s
        ))
      } else {
        // Create new service
        const result = await createServiceAction({
          name_en: formData.name_en!,
          name_fr: formData.name_fr,
          description_en: formData.description_en,
          description_fr: formData.description_fr,
          category: formData.category!,
          price: formData.price,
          price_unit: formData.price_unit,
          image: formData.image,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        if (result.error) {
          console.error('Error creating service:', result.error)
          return
        }
        if (result.data) {
          setServices(prev => [result.data as Service, ...prev])
        }
      }
      
      setIsDialogOpen(false)
      setFormData(emptyService)
      setEditingService(null)
      
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteServiceId) return

    setIsSaving(true)
    try {
      const result = await deleteServiceAction(deleteServiceId)
      if (result.error) {
        console.error('Error deleting service:', result.error)
        return
      }
      
      setServices(prev => prev.filter(s => s.id !== deleteServiceId))
      setDeleteServiceId(null)
      
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    const result = await updateServiceAction(service.id, { is_active: !service.is_active })
    if (result.error) {
      console.error('Error toggling service status:', result.error)
      return
    }
    setServices(prev => prev.map(s => 
      s.id === service.id ? { ...s, is_active: !s.is_active } : s
    ))
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Services</h1>
            <p className="text-muted-foreground">Manage your concierge and guest services</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Services Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No services found. Click "Add Service" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        {service.image ? (
                          <Image
                            src={service.image}
                            alt={service.name_en}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No img
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name_en}</p>
                        {service.description_en && (
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {service.description_en}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[service.category] || service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.price ? (
                        <span>{service.price}€ {service.price_unit || ''}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(service)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(service)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {service.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteServiceId(service.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_en">Name (English) *</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="Service name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_fr">Name (French)</Label>
                  <Input
                    id="name_fr"
                    value={formData.name_fr || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_fr: e.target.value }))}
                    placeholder="Nom du service"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category || 'concierge'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (EUR)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_unit">Price Unit</Label>
                  <Input
                    id="price_unit"
                    value={formData.price_unit || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_unit: e.target.value }))}
                    placeholder="per service, per hour, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_en">Description (English)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                  placeholder="Describe the service..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_fr">Description (French)</Label>
                <Textarea
                  id="description_fr"
                  value={formData.description_fr || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_fr: e.target.value }))}
                  placeholder="Description du service..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active (visible on public site)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.name_en}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingService ? 'Save Changes' : 'Create Service'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteServiceId} onOpenChange={() => setDeleteServiceId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this service? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
