import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { VendorReplayManager } from '@/components/vendor/vendor-replay-manager'

export const metadata = {
  title: 'Webhook Replays | Vendor',
  description: 'View and manage your webhook replay operations',
}

export default async function VendorWebhookReplaysPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.role?.includes('vendor')) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhook Replays</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your webhook delivery retry operations
        </p>
      </div>

      <VendorReplayManager />
    </div>
  )
}
