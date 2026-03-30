'use client'

import { useParams } from 'next/navigation'
import { mockProperties } from '@/lib/data'
import NewPropertyPage from '../../new/page'

// This page reuses the new property form but loads existing data
// In production, this would fetch the property from the database
export default function EditPropertyPage() {
  const params = useParams()
  const propertyId = params.id as string
  
  // Find existing property
  const property = mockProperties.find(p => p.id === propertyId)
  
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Property Not Found</h1>
          <p className="text-muted-foreground">The property you are looking for does not exist.</p>
        </div>
      </div>
    )
  }

  // For now, redirect to new property page - in production this would load existing data
  return <NewPropertyPage />
}
