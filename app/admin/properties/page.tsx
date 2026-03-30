'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
  Bed,
  Users,
  Sofa,
  Copy,
  Archive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { AdminLayout } from '@/components/admin/admin-layout'
import { mockProperties } from '@/lib/data'

export default function AdminPropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProperties = mockProperties.filter(property =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location.district.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AdminLayout title="Properties">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search properties..." 
              className="pl-10 w-full sm:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/admin/properties/new">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Add Property
            </Button>
          </Link>
        </div>

        {/* Properties Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden lg:table-cell">Rooms</TableHead>
                  <TableHead className="hidden xl:table-cell">Capacity</TableHead>
                  <TableHead>Price/Night</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={property.images[0]}
                            alt={property.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{property.title}</p>
                          <p className="text-sm text-muted-foreground truncate md:hidden">
                            {property.location.district}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {property.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {property.location.subDistrict || property.location.district}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm">
                        <Bed className="w-3.5 h-3.5 text-muted-foreground" />
                        {property.numberOfBedrooms}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1" title="Bedroom guests">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {property.bedroomGuestCapacity}
                        </span>
                        {property.additionalGuestCapacity > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground" title="Additional guests">
                            <Sofa className="w-3.5 h-3.5" />
                            +{property.additionalGuestCapacity}
                          </span>
                        )}
                        <span className="font-medium text-primary" title="Total capacity">
                          = {property.totalGuestCapacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      &euro;{property.pricePerNight}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={property.featured ? 'default' : 'outline'}>
                        {property.featured ? 'Featured' : 'Standard'}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/properties/${property.id}`} target="_blank">
                              <Eye className="w-4 h-4 mr-2" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/properties/${property.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
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
          Showing {filteredProperties.length} of {mockProperties.length} properties
        </div>
      </div>
    </AdminLayout>
  )
}
