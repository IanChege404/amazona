'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WebhookEventType } from '@/lib/webhooks/types'

interface WebhookTestResult {
  status: 'success' | 'failed'
  statusCode?: number
  response?: string
  duration: number
  error?: string
}

/**
 * Webhook Testing Component
 * For admin dashboard to test webhook delivery
 */
export function WebhookTester() {
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventType>(WebhookEventType.ORDER_CREATED)
  const [testUrl, setTestUrl] = useState('http://localhost:3001/webhooks')
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testWebhook = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      const startTime = Date.now()

      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: selectedEvent,
          url: testUrl,
        }),
      })

      const duration = Date.now() - startTime
      const data = await response.json()

      setTestResult({
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status,
        response: JSON.stringify(data, null, 2),
        duration,
      })
    } catch (error) {
      setTestResult({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Tester</CardTitle>
        <CardDescription>Send test webhook events to verify delivery</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Event Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700">Event Type</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value as WebhookEventType)}
              className="mt-1 w-full rounded border border-gray-300 p-2"
            >
              {Object.values(WebhookEventType).map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </div>

          {/* URL Input */}
          <div>
            <label className="text-sm font-medium text-gray-700">Webhook URL</label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="http://localhost:3001/webhooks"
              className="mt-1 w-full rounded border border-gray-300 p-2"
            />
          </div>

          {/* Send Button */}
          <Button onClick={testWebhook} disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Test Webhook'}
          </Button>

          {/* Test Result */}
          {testResult && (
            <div className="rounded-md bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold">Test Result</h3>
                <Badge
                  className={testResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                >
                  {testResult.status === 'success' ? 'Success' : 'Failed'}
                </Badge>
              </div>

              {testResult.statusCode && (
                <p className="mt-2 text-xs text-gray-600">
                  Status Code: <span className="font-mono">{testResult.statusCode}</span>
                </p>
              )}

              <p className="mt-1 text-xs text-gray-600">
                Duration: <span className="font-mono">{testResult.duration}ms</span>
              </p>

              {testResult.error && (
                <pre className="mt-3 overflow-auto rounded bg-red-50 p-2 text-xs text-red-700">
                  {testResult.error}
                </pre>
              )}

              {testResult.response && (
                <pre className="mt-3 overflow-auto rounded bg-gray-100 p-2 text-xs">
                  {testResult.response}
                </pre>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Webhook Logs Component
 * Display webhook delivery history
 */
export function WebhookLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/webhooks/logs?filter=${filter}`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Logs</CardTitle>
        <CardDescription>Recent webhook delivery history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by event..."
              className="flex-1 rounded border border-gray-300 p-2 text-sm"
            />
            <Button onClick={fetchLogs} disabled={loading} size="sm">
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">No webhooks found</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded border border-gray-200 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-700">{log.event}</p>
                      <p className="mt-1 text-xs text-gray-500">{log.url}</p>
                    </div>
                    <Badge
                      className={
                        log.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {log.statusCode || 'Error'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString()} • {log.duration}ms
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
