import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { WebhookAnalyticsDashboard } from '@/components/admin/webhook-analytics-dashboard'
import { WebhookTrendsChart } from '@/components/admin/webhook-trends-chart'
import { WebhookEventLogsViewer } from '@/components/admin/webhook-event-logs-viewer'

export const metadata: Metadata = {
  title: 'Webhook Analytics | Admin Dashboard',
  description: 'Monitor webhook delivery status, trends, and performance metrics',
}

export default async function WebhookAnalyticsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhook Analytics</h1>
        <p className="text-gray-600 mt-2">Monitor webhook delivery status and performance</p>
      </div>

      {/* Overview Dashboard */}
      <WebhookAnalyticsDashboard />

      {/* Trends */}
      <WebhookTrendsChart />

      {/* Event Logs */}
      <WebhookEventLogsViewer />
    </div>
  )
}
