import { Metadata } from 'next'
import VendorList from './vendor-list'

export const metadata: Metadata = {
  title: 'Admin - Manage Vendors',
}

export default async function AdminVendors() {
  return <VendorList />
}
