import { getPartners } from '@/lib/services/partners'
import { PartnersAdmin } from '@/components/admin/partners-admin'
// RE-ENABLE: import { requireAdmin } from '@/lib/services/auth'

export default async function AdminPartnersPage() {
  // ============================================================================
  // TEMPORARY: Auth bypass active (TEST MODE)
  // RE-ENABLE: Uncomment the line below when admin auth is restored
  // await requireAdmin()
  // ============================================================================
  
  // Fetch real partners from database
  const partners = await getPartners()

  return <PartnersAdmin initialPartners={partners} />
}
