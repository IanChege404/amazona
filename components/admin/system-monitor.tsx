'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MonitoringMetrics {
  errorRate: number
  avgResponseTime: number
  uptime: number
  activeRequests: number
  totalErrors: number
  lastErrorTime?: Date
}

/**
 * System health monitoring component
 * Displays error rates, response times, and uptime
 */
export function SystemHealthMonitor() {
  const [metrics, setMetrics] = useState<MonitoringMetrics>({
    errorRate: 0,
    avgResponseTime: 125,
    uptime: 99.9,
    activeRequests: 0,
    totalErrors: 0,
  })

  useEffect(() => {
    // Fetch metrics from monitoring API
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/system/health')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getHealthStatus = () => {
    if (metrics.uptime >= 99) return { label: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (metrics.uptime >= 95) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Degraded', color: 'bg-red-100 text-red-800' }
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Uptime Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.uptime.toFixed(2)}%</div>
          <Badge className={`mt-2 ${healthStatus.color}`}>{healthStatus.label}</Badge>
        </CardContent>
      </Card>

      {/* Error Rate Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Error Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}%</div>
          <p className="mt-2 text-xs text-gray-500">
            {metrics.totalErrors} total errors
          </p>
        </CardContent>
      </Card>

      {/* Response Time Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
          <p className="mt-2 text-xs text-gray-500">Average across all requests</p>
        </CardContent>
      </Card>

      {/* Active Requests Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeRequests}</div>
          <p className="mt-2 text-xs text-gray-500">
            {metrics.lastErrorTime
              ? `Last error: ${new Date(metrics.lastErrorTime).toLocaleTimeString()}`
              : 'No recent errors'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Error tracking card component
 */
export function ErrorTrackingCard() {
  const [topErrors, setTopErrors] = useState<
    Array<{
      message: string
      count: number
      lastOccurred: Date
    }>
  >([])

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const response = await fetch('/api/system/errors?limit=5')
        if (response.ok) {
          const data = await response.json()
          setTopErrors(data.errors || [])
        }
      } catch (error) {
        console.error('Failed to fetch errors:', error)
      }
    }

    fetchErrors()
    const interval = setInterval(fetchErrors, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Errors</CardTitle>
        <CardDescription>Top errors in the last 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        {topErrors.length === 0 ? (
          <p className="text-sm text-gray-500">No recent errors</p>
        ) : (
          <div className="space-y-3">
            {topErrors.map((error, idx) => (
              <div key={idx} className="flex items-start justify-between border-b pb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{error.message}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Occurrences: {error.count}
                  </p>
                </div>
                <Badge variant="outline">{error.count}x</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Request performance card
 */
export function RequestPerformanceCard() {
  const [performance, setPerformance] = useState<{
    p50: number
    p95: number
    p99: number
    max: number
  }>({
    p50: 100,
    p95: 250,
    p99: 500,
    max: 2000,
  })

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await fetch('/api/system/performance')
        if (response.ok) {
          const data = await response.json()
          setPerformance(data)
        }
      } catch (error) {
        console.error('Failed to fetch performance data:', error)
      }
    }

    fetchPerformance()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Percentiles</CardTitle>
        <CardDescription>Request latency distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">P50 (Median)</span>
            <span className="text-sm font-bold text-gray-900">{performance.p50}ms</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${(performance.p50 / performance.max) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">P95</span>
            <span className="text-sm font-bold text-gray-900">{performance.p95}ms</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-yellow-500"
              style={{ width: `${(performance.p95 / performance.max) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">P99</span>
            <span className="text-sm font-bold text-gray-900">{performance.p99}ms</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${(performance.p99 / performance.max) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
