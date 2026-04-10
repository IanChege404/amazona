'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { WebhookEventType } from '@/lib/webhooks/types'

interface WebhookTrend {
  date: string
  count: number
  successRate: number
  averageLatency: number
  failureRate: number
}

export function WebhookTrendsChart() {
  const [trends, setTrends] = useState<WebhookTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [days, setDays] = useState<'7' | '30' | '90'>('30')

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          days,
          ...(selectedEvent !== 'all' && { eventType: selectedEvent }),
        })

        const response = await fetch(`/api/analytics/webhooks/trends?${params}`)
        const result = await response.json()

        if (result.success) {
          setTrends(
            result.data.map((t: any) => ({
              ...t,
              date: new Date(t.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
            }))
          )
        } else {
          setError('Failed to fetch trends')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [selectedEvent, days])

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Webhook Trends</CardTitle>
            <CardDescription>Event delivery patterns over time</CardDescription>
          </div>
          <div className="flex gap-3">
            <Select value={days} onValueChange={(v: any) => setDays(v)}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7d</SelectItem>
                <SelectItem value="30">Last 30d</SelectItem>
                <SelectItem value="90">Last 90d</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="ORDER.CREATED">Order Created</SelectItem>
                <SelectItem value="ORDER.PAID">Order Paid</SelectItem>
                <SelectItem value="ORDER.DELIVERED">Order Delivered</SelectItem>
                <SelectItem value="PAYMENT.SUCCEEDED">Payment Succeeded</SelectItem>
                <SelectItem value="PAYMENT.FAILED">Payment Failed</SelectItem>
                <SelectItem value="PRODUCT.CREATED">Product Created</SelectItem>
                <SelectItem value="PRODUCT.UPDATED">Product Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-80 w-full" />
        ) : trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" label={{ value: 'Event Count', angle: -90, position: 'insideLeft' }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Success Rate (%)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Event Count" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                stroke="#22c55e"
                name="Success Rate (%)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="averageLatency"
                stroke="#f59e0b"
                name="Avg Latency (ms)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">No data available</div>
        )}
      </CardContent>
    </Card>
  )
}
