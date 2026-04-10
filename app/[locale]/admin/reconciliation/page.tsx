import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ReconciliationDashboard } from '@/components/admin/reconciliation-dashboard'

export const metadata = {
  title: 'Reconciliation | Admin',
  description: 'Financial reconciliation and discrepancy management',
}

export default async function ReconciliationPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Reconciliation</h1>
        <p className="text-muted-foreground mt-2">
          Monitor financial reconciliation and resolve discrepancies
        </p>
      </div>

      <ReconciliationDashboard />
    </div>
  )
}
