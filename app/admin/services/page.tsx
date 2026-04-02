import { getServices } from '@/lib/services/services'
import { ServicesAdmin } from '@/components/admin/services-admin'

export default async function AdminServicesPage() {
  // Fetch real services from database
  const services = await getServices()

  return <ServicesAdmin initialServices={services} />
}
