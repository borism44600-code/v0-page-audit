import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | Marrakech Riads Rent',
  description: 'Manage properties, bookings, and partners',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
