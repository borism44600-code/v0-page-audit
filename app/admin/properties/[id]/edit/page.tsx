import { notFound } from 'next/navigation'
import { getPropertyById } from '@/lib/services/properties'
import { PropertyEditForm } from '@/components/admin/property-edit-form'
// RE-ENABLE: import { requireAdmin } from '@/lib/services/auth'

interface EditPropertyPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  // ============================================================================
  // TEMPORARY: Auth bypass active (TEST MODE)
  // RE-ENABLE: Uncomment the line below when admin auth is restored
  // await requireAdmin()
  // ============================================================================
  
  const { id } = await params
  
  // Fetch property data
  let property
  try {
    property = await getPropertyById(id)
  } catch {
    notFound()
  }
  
  if (!property) {
    notFound()
  }

  return <PropertyEditForm property={property} />
}
