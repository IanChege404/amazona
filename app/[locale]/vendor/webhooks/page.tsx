import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { VendorWebhooksManagement } from '@/components/vendor/vendor-webhooks-management'

export const metadata: Metadata = {
  title: 'Webhooks | Vendor Dashboard',
  description: 'Manage your webhook subscriptions and view delivery history',
}

export default async function VendorWebhooksPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhook Management</h1>
        <p className="text-gray-600 mt-2">
          Subscribe to events and integrate with your systems in real-time
        </p>
      </div>

      <VendorWebhooksManagement />
    </div>
  )
}
