'use client'

import { 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { AdminLayout } from '@/components/admin/admin-layout'

const bookings = [
  {
    id: 'BK001',
    guest: 'Jean-Pierre Martin',
    email: 'jp.martin@email.com',
    property: 'Riad Jardin Secret',
    checkIn: '2026-04-01',
    checkOut: '2026-04-05',
    guests: 4,
    status: 'confirmed',
    total: 1800,
  },
  {
    id: 'BK002',
    guest: 'Sarah Williams',
    email: 'sarah.w@email.com',
    property: 'Villa Palmeraie Oasis',
    checkIn: '2026-04-03',
    checkOut: '2026-04-10',
    guests: 8,
    status: 'pending',
    total: 8400,
  },
  {
    id: 'BK003',
    guest: 'Mohammed Al-Rashid',
    email: 'm.alrashid@email.com',
    property: 'Riad Ambre & Épices',
    checkIn: '2026-04-05',
    checkOut: '2026-04-08',
    guests: 2,
    status: 'confirmed',
    total: 960,
  },
  {
    id: 'BK004',
    guest: 'Emma Thompson',
    email: 'emma.t@email.com',
    property: 'Apartment Hivernage Elite',
    checkIn: '2026-04-07',
    checkOut: '2026-04-14',
    guests: 3,
    status: 'cancelled',
    total: 1260,
  },
  {
    id: 'BK005',
    guest: 'David Chen',
    email: 'd.chen@email.com',
    property: 'Villa Atlas Retreat',
    checkIn: '2026-04-12',
    checkOut: '2026-04-19',
    guests: 6,
    status: 'confirmed',
    total: 6650,
  },
  {
    id: 'BK006',
    guest: 'Sophie Dubois',
    email: 's.dubois@email.com',
    property: 'Apartment Guéliz Moderne',
    checkIn: '2026-04-15',
    checkOut: '2026-04-18',
    guests: 2,
    status: 'pending',
    total: 360,
  },
]

export default function AdminBookingsPage() {
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  return (
    <AdminLayout title="Bookings">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search bookings..." 
              className="pl-10 w-full sm:w-80"
            />
          </div>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4" />
            Filter
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
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.guest}</p>
                        <p className="text-sm text-muted-foreground hidden sm:block">{booking.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{booking.property}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking.checkIn}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking.checkOut}</TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">&euro;{booking.total}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancel Booking
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
          Showing {bookings.length} bookings
        </div>
      </div>
    </AdminLayout>
  )
}
