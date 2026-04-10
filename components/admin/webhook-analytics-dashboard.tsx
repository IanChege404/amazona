'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface WebhookStats {
  totalEvents: number
  successfulDeliveries: number
  failedDeliveries: number
  pendingDeliveries: number
  averageLatency: number
  successRate: number
}

interface FailedWebhook {
  _id: string
  eventType: string
  url: string
  status: string
  errorMessage?: string
  timestamp: Date
}

export function WebhookAnalyticsDashboard() {
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [failedWebhooks, setFailedWebhooks] = useState<FailedWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/webhooks/stats')
        const result = await response.json()

        if (result.success) {
          setStats(result.data.stats)
          setFailedWebhooks(result.data.failedWebhooks)
        } else {
          setError('Failed to fetch statistics')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <WebhookAnalyticsSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        <div className="flex gap-2 items-center">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statusData = [
    { name: 'Successful', value: stats.successfulDeliveries, color: '#22c55e' },
    { name: 'Failed', value: stats.failedDeliveries, color: '#ef4444' },
    { name: 'Pending', value: stats.pendingDeliveries, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-gray-500">in the last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">{stats.successfulDeliveries} successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedDeliveries}</div>
            <p className="text-xs text-gray-500">needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Clock className="h-4 w-4 text-blue-500" />
              Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageLatency.toFixed(0)}ms</div>
            <p className="text-xs text-gray-500">average delivery time</p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Status Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Status Distribution</CardTitle>
          <CardDescription>Breakdown of webhook delivery statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Failed Webhooks Alert */}
      {failedWebhooks.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Failed Webhooks ({failedWebhooks.length})</CardTitle>
            <CardDescription>Recent delivery failures requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedWebhooks.slice(0, 5).map((webhook) => (
                <div
                  key={webhook._id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{webhook.eventType}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(webhook.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 truncate">{webhook.url}</p>
                  {webhook.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">{webhook.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WebhookAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
