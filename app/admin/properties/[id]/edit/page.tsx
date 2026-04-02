import { notFound } from 'next/navigation'
import { getPropertyById } from '@/lib/services/properties'
import { PropertyEditForm } from '@/components/admin/property-edit-form'

interface EditPropertyPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  // NOTE: Admin authentication is currently disabled at middleware level
  // When re-enabling, uncomment: await requireAdmin()
  
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
