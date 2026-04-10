'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface WebhookEventLog {
  _id: string
  eventType: string
  eventId: string
  url: string
  status: 'success' | 'failed' | 'pending' | 'retry'
  statusCode?: number
  latency: number
  errorMessage?: string
  timestamp: Date
  retryAttempt: number
}

interface PaginatedResponse {
  logs: WebhookEventLog[]
  total: number
  page: number
  limit: number
}

export function WebhookEventLogsViewer() {
  const [logs, setLogs] = useState<WebhookEventLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [urlFilter, setUrlFilter] = useState<string>('')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(eventTypeFilter !== 'all' && { eventType: eventTypeFilter }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(urlFilter && { subscriptionId: urlFilter }),
        })

        const response = await fetch(`/api/analytics/webhooks/logs?${params}`)
        const result = await response.json()

        if (result.success) {
          setLogs(result.data.logs)
          setPagination({
            page: result.data.page,
            limit: result.data.limit,
            total: result.data.total,
          })
        } else {
          setError('Failed to fetch logs')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [pagination.page, eventTypeFilter, statusFilter, urlFilter])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
      retry: 'outline',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Event Logs</CardTitle>
        <CardDescription>View and analyze webhook delivery attempts</CardDescription>

        {/* Filters */}
        <div className="flex gap-3 mt-4">
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="ORDER.CREATED">Order Created</SelectItem>
              <SelectItem value="ORDER.PAID">Order Paid</SelectItem>
              <SelectItem value="PAYMENT.SUCCEEDED">Payment Succeeded</SelectItem>
              <SelectItem value="PAYMENT.FAILED">Payment Failed</SelectItem>
              <SelectItem value="PRODUCT.CREATED">Product Created</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="retry">Retry</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by URL..."
            value={urlFilter}
            onChange={(e) => setUrlFilter(e.target.value)}
            className="flex-1"
          />
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 mb-4">
            <div className="flex gap-2 items-center">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded font-medium text-sm">
              <div className="col-span-2">Event Type</div>
              <div className="col-span-2">URL</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Code</div>
              <div className="col-span-1">Latency</div>
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-2">Error</div>
            </div>

            {/* Table Rows */}
            {logs.map((log) => (
              <div key={log._id} className="grid grid-cols-12 gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-sm">
                <div className="col-span-2 font-medium">{log.eventType}</div>
                <div className="col-span-2 truncate text-gray-600">{log.url}</div>
                <div className="col-span-1">{getStatusBadge(log.status)}</div>
                <div className="col-span-1">{log.statusCode || '-'}</div>
                <div className="col-span-1 text-gray-600">{log.latency}ms</div>
                <div className="col-span-2 text-gray-600">
                  {new Date(log.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="col-span-2 truncate text-xs text-red-600">
                  {log.errorMessage || '-'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-500">No logs found</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {totalPages} • Total: {pagination.total} events
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))
                }
                disabled={pagination.page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
