import { getPartners } from '@/lib/services/partners'
import { PartnersAdmin } from '@/components/admin/partners-admin'

export default async function AdminPartnersPage() {
  // NOTE: Admin authentication is currently disabled at middleware level
  // When re-enabling, add: await requireAdmin()
  
  // Fetch real partners from database
  const partners = await getPartners()

  return <PartnersAdmin initialPartners={partners} />
}
