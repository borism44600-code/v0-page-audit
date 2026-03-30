'use client'

import { useState } from 'react'
import { 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AdminLayout } from '@/components/admin/admin-layout'

// Extended booking type for admin
interface AdminBooking {
  id: string
  guest: {
    name: string
    email: string
    phone: string
  }
  property: {
    id: string
    name: string
  }
  checkIn: string
  checkOut: string
  nights: number
  guests: {
    adults: number
    children: number
  }
  extras: {
    name: string
    quantity: number
    price: number
  }[]
  pricing: {
    nightlyRate: number
    subtotal: number
    cleaningFee: number
    extras: number
    total: number
  }
  payment: {
    method: 'card' | 'paypal' | 'bank_transfer'
    status: 'pending' | 'paid' | 'refunded' | 'partial_refund'
    transactionId?: string
    paidAt?: string
  }
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  source: 'website' | 'airbnb' | 'booking' | 'manual'
  notes?: string
  createdAt: string
  updatedAt: string
}

// Mock bookings data
const mockBookings: AdminBooking[] = [
  {
    id: 'BK001',
    guest: {
      name: 'Jean-Pierre Martin',
      email: 'jp.martin@email.com',
      phone: '+33 6 12 34 56 78',
    },
    property: { id: 'p1', name: 'Riad Jardin Secret' },
    checkIn: '2026-04-01',
    checkOut: '2026-04-05',
    nights: 4,
    guests: { adults: 2, children: 0 },
    extras: [
      { name: 'Airport Transfer (Round Trip)', quantity: 1, price: 60 },
      { name: 'Breakfast', quantity: 4, price: 60 },
    ],
    pricing: {
      nightlyRate: 450,
      subtotal: 1800,
      cleaningFee: 80,
      extras: 120,
      total: 2000,
    },
    payment: {
      method: 'card',
      status: 'paid',
      transactionId: 'pi_3NxYZ123456789',
      paidAt: '2026-03-15T10:30:00Z',
    },
    status: 'confirmed',
    source: 'website',
    createdAt: '2026-03-15T10:25:00Z',
    updatedAt: '2026-03-15T10:30:00Z',
  },
  {
    id: 'BK002',
    guest: {
      name: 'Sarah Williams',
      email: 'sarah.w@email.com',
      phone: '+44 7700 900123',
    },
    property: { id: 'p2', name: 'Villa Palmeraie Oasis' },
    checkIn: '2026-04-03',
    checkOut: '2026-04-10',
    nights: 7,
    guests: { adults: 6, children: 2 },
    extras: [
      { name: 'Private Driver (Full Day)', quantity: 2, price: 400 },
      { name: 'Chef Service (Dinner)', quantity: 3, price: 450 },
    ],
    pricing: {
      nightlyRate: 1200,
      subtotal: 8400,
      cleaningFee: 150,
      extras: 850,
      total: 9400,
    },
    payment: {
      method: 'paypal',
      status: 'pending',
    },
    status: 'pending',
    source: 'website',
    notes: 'Guest requested late check-out if possible',
    createdAt: '2026-03-20T14:15:00Z',
    updatedAt: '2026-03-20T14:15:00Z',
  },
  {
    id: 'BK003',
    guest: {
      name: 'Mohammed Al-Rashid',
      email: 'm.alrashid@email.com',
      phone: '+971 50 123 4567',
    },
    property: { id: 'p3', name: 'Riad Ambre & Epices' },
    checkIn: '2026-04-05',
    checkOut: '2026-04-08',
    nights: 3,
    guests: { adults: 2, children: 0 },
    extras: [],
    pricing: {
      nightlyRate: 320,
      subtotal: 960,
      cleaningFee: 50,
      extras: 0,
      total: 1010,
    },
    payment: {
      method: 'card',
      status: 'paid',
      transactionId: 'pi_3NxABC987654321',
      paidAt: '2026-03-18T08:45:00Z',
    },
    status: 'confirmed',
    source: 'airbnb',
    createdAt: '2026-03-18T08:40:00Z',
    updatedAt: '2026-03-18T08:45:00Z',
  },
  {
    id: 'BK004',
    guest: {
      name: 'Emma Thompson',
      email: 'emma.t@email.com',
      phone: '+1 555 123 4567',
    },
    property: { id: 'p4', name: 'Apartment Hivernage Elite' },
    checkIn: '2026-04-07',
    checkOut: '2026-04-14',
    nights: 7,
    guests: { adults: 2, children: 1 },
    extras: [
      { name: 'Airport Transfer (One Way)', quantity: 1, price: 35 },
    ],
    pricing: {
      nightlyRate: 180,
      subtotal: 1260,
      cleaningFee: 40,
      extras: 35,
      total: 1335,
    },
    payment: {
      method: 'card',
      status: 'refunded',
      transactionId: 'pi_3NxDEF456789012',
    },
    status: 'cancelled',
    source: 'website',
    notes: 'Cancelled due to travel restrictions',
    createdAt: '2026-03-10T16:20:00Z',
    updatedAt: '2026-03-25T09:00:00Z',
  },
  {
    id: 'BK005',
    guest: {
      name: 'David Chen',
      email: 'd.chen@email.com',
      phone: '+86 138 1234 5678',
    },
    property: { id: 'p5', name: 'Villa Atlas Retreat' },
    checkIn: '2026-04-12',
    checkOut: '2026-04-19',
    nights: 7,
    guests: { adults: 4, children: 2 },
    extras: [
      { name: 'Excursion - Atlas Mountains', quantity: 6, price: 480 },
      { name: 'Breakfast', quantity: 7, price: 105 },
    ],
    pricing: {
      nightlyRate: 950,
      subtotal: 6650,
      cleaningFee: 120,
      extras: 585,
      total: 7355,
    },
    payment: {
      method: 'bank_transfer',
      status: 'paid',
      transactionId: 'BT-2026-0412-001',
      paidAt: '2026-03-28T11:00:00Z',
    },
    status: 'confirmed',
    source: 'manual',
    notes: 'VIP guest - repeat customer',
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-03-28T11:00:00Z',
  },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'secondary', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'default', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'destructive', icon: XCircle },
  completed: { label: 'Completed', color: 'outline', icon: CheckCircle2 },
}

const paymentStatusConfig = {
  pending: { label: 'Pending', color: 'secondary' },
  paid: { label: 'Paid', color: 'default' },
  refunded: { label: 'Refunded', color: 'destructive' },
  partial_refund: { label: 'Partial Refund', color: 'outline' },
}

const sourceConfig = {
  website: { label: 'Website', color: 'default' },
  airbnb: { label: 'Airbnb', color: 'secondary' },
  booking: { label: 'Booking.com', color: 'secondary' },
  manual: { label: 'Manual', color: 'outline' },
}

export default function AdminBookingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Filter bookings
  const filteredBookings = mockBookings.filter(booking => {
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.property.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    const matchesSource = sourceFilter === 'all' || booking.source === sourceFilter
    
    return matchesSearch && matchesStatus && matchesSource
  })

  // Stats
  const confirmedCount = mockBookings.filter(b => b.status === 'confirmed').length
  const pendingCount = mockBookings.filter(b => b.status === 'pending').length
  const cancelledCount = mockBookings.filter(b => b.status === 'cancelled').length
  const totalRevenue = mockBookings
    .filter(b => b.status !== 'cancelled' && b.payment.status === 'paid')
    .reduce((sum, b) => sum + b.pricing.total, 0)

  const openDetails = (booking: AdminBooking) => {
    setSelectedBooking(booking)
    setDetailsOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminLayout title="Bookings">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-red-500">{cancelledCount}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">&euro;{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search bookings..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="booking">Booking.com</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Bookings Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead className="hidden md:table-cell">Property</TableHead>
                  <TableHead className="hidden lg:table-cell">Check In</TableHead>
                  <TableHead className="hidden lg:table-cell">Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const StatusIcon = statusConfig[booking.status].icon
                  return (
                    <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(booking)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {booking.id}
                          <Badge variant="outline" className="text-[10px] px-1">
                            {sourceConfig[booking.source].label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.guest.name}</p>
                          <p className="text-sm text-muted-foreground hidden sm:block">{booking.guest.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{booking.property.name}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(booking.checkIn)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(booking.checkOut)}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[booking.status].color as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[booking.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={paymentStatusConfig[booking.payment.status].color as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          {paymentStatusConfig[booking.payment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">&euro;{booking.pricing.total.toLocaleString()}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(booking)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Booking
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {booking.status === 'pending' && (
                              <DropdownMenuItem>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Confirm Booking
                              </DropdownMenuItem>
                            )}
                            {booking.status !== 'cancelled' && (
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Booking
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredBookings.length} of {mockBookings.length} bookings
        </div>
      </div>

      {/* Booking Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedBooking && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  Booking {selectedBooking.id}
                  <Badge variant={statusConfig[selectedBooking.status].color as 'default' | 'secondary' | 'destructive' | 'outline'}>
                    {statusConfig[selectedBooking.status].label}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Guest Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Guest Information
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.guest.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedBooking.guest.email}`} className="text-primary hover:underline">
                        {selectedBooking.guest.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedBooking.guest.phone}`} className="text-primary hover:underline">
                        {selectedBooking.guest.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Booking Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Booking Details
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property</span>
                      <span className="font-medium">{selectedBooking.property.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in</span>
                      <span className="font-medium">{formatDate(selectedBooking.checkIn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-out</span>
                      <span className="font-medium">{formatDate(selectedBooking.checkOut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nights</span>
                      <span className="font-medium">{selectedBooking.nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Guests</span>
                      <span className="font-medium">
                        {selectedBooking.guests.adults} adults
                        {selectedBooking.guests.children > 0 && `, ${selectedBooking.guests.children} children`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source</span>
                      <Badge variant="outline">{sourceConfig[selectedBooking.source].label}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Pricing & Payment
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        &euro;{selectedBooking.pricing.nightlyRate} x {selectedBooking.nights} nights
                      </span>
                      <span>&euro;{selectedBooking.pricing.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cleaning fee</span>
                      <span>&euro;{selectedBooking.pricing.cleaningFee}</span>
                    </div>
                    {selectedBooking.extras.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Extras:</span>
                          {selectedBooking.extras.map((extra, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {extra.name} x{extra.quantity}
                              </span>
                              <span>&euro;{extra.price}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-primary">&euro;{selectedBooking.pricing.total}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Payment Status</span>
                      <Badge variant={paymentStatusConfig[selectedBooking.payment.status].color as 'default' | 'secondary' | 'destructive' | 'outline'}>
                        {paymentStatusConfig[selectedBooking.payment.status].label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="capitalize">{selectedBooking.payment.method.replace('_', ' ')}</span>
                    </div>
                    {selectedBooking.payment.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {selectedBooking.payment.transactionId}
                        </code>
                      </div>
                    )}
                    {selectedBooking.payment.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid At</span>
                        <span>{formatDateTime(selectedBooking.payment.paidAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-semibold">Notes</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm">{selectedBooking.notes}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                  <p>Created: {formatDateTime(selectedBooking.createdAt)}</p>
                  <p>Last updated: {formatDateTime(selectedBooking.updatedAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {selectedBooking.status === 'pending' && (
                    <Button className="flex-1">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </Button>
                  )}
                  {selectedBooking.status !== 'cancelled' && (
                    <Button variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {selectedBooking.status !== 'cancelled' && (
                    <Button variant="destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}
