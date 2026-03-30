'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Calendar, RefreshCw, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminLayout } from '@/components/admin/admin-layout'
import { CalendarSync } from '@/components/admin/calendar-sync'
import { mockProperties } from '@/lib/data'

export default function AdminCalendarPage() {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const selectedPropertyData = mockProperties.find(p => p.id === selectedProperty)

  return (
    <AdminLayout title="Calendar Sync">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground">
              Synchronize availability calendars with Airbnb to prevent double bookings.
            </p>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            How Calendar Sync Works
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">Import from Airbnb</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to your Airbnb listing calendar</li>
                <li>Click &quot;Availability settings&quot; then &quot;Export calendar&quot;</li>
                <li>Copy the iCal URL provided</li>
                <li>Paste it here and click &quot;Sync Now&quot;</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Export to Airbnb</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the export URL from below</li>
                <li>Go to your Airbnb listing calendar</li>
                <li>Click &quot;Availability settings&quot; then &quot;Import calendar&quot;</li>
                <li>Paste the URL and save</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProperties.map((property) => (
            <div 
              key={property.id}
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-gold/50 transition-colors"
            >
              {/* Property Image */}
              <div className="relative h-32">
                <Image
                  src={property.images[0]}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-semibold text-white truncate">{property.title}</h3>
                  <p className="text-xs text-white/80">{property.location.district}</p>
                </div>
                <Badge 
                  variant="secondary" 
                  className="absolute top-3 right-3 capitalize"
                >
                  {property.type}
                </Badge>
              </div>

              {/* Sync Status */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Airbnb Sync</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-xs">Not configured</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => setSelectedProperty(property.id)}
                >
                  <Settings2 className="w-4 h-4" />
                  Configure Sync
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Sync Configuration Dialog */}
        <Dialog 
          open={!!selectedProperty} 
          onOpenChange={(open) => !open && setSelectedProperty(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Calendar Sync Settings
              </DialogTitle>
            </DialogHeader>
            {selectedPropertyData && (
              <CalendarSync 
                propertyId={selectedPropertyData.id}
                propertyTitle={selectedPropertyData.title}
                className="border-0 p-0"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
