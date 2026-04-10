import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { WebhookReplayManager } from '@/components/admin/webhook-replay-manager'

export const metadata = {
  title: 'Webhook Replays | Admin',
  description: 'Manage webhook replay operations and retry failed events',
}

export default async function WebhookReplaysPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.role?.includes('admin')) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhook Replays</h1>
        <p className="text-muted-foreground mt-2">
          Manage webhook replay operations and retry failed event deliveries
        </p>
      </div>

      <WebhookReplayManager />
    </div>
  )
}
