'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Badge,
} from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  Trash2,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Attempt {
  status: string
  statusCode?: number
  latency: number
  errorMessage?: string
  responseBody?: string
  timestamp: string
}

interface WebhookReplay {
  _id: string
  originalEventId: string
  eventType: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  attempts: Attempt[]
  totalAttempts: number
  successCount: number
  failureCount: number
  maxAttempts: number
  reason: string
  createdAt: string
  nextRetryAt?: string
  vendorId?: string
  subscriptionId?: string
}

interface ReplayStats {
  totalReplays: number
  successRate: number
  averageAttempts: number
  statusBreakdown: Record<string, number>
  eventTypeBreakdown: Record<string, number>
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  'in_progress': <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
  failed: <AlertCircle className="h-4 w-4" />,
  cancelled: <AlertCircle className="h-4 w-4" />,
}

export function WebhookReplayManager() {
  const { toast } = useToast()
  const [replays, setReplays] = useState<WebhookReplay[]>([])
  const [stats, setStats] = useState<ReplayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReplay, setSelectedReplay] = useState<WebhookReplay | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [filter, setFilter] = useState<{
    status?: string
    eventType?: string
    page: number
  }>({ page: 1 })
  const [batchData, setBatchData] = useState({
    eventIds: '',
    eventType: 'order.created',
    reason: 'Manual batch replay',
  })

  const fetchReplays = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.eventType) params.append('eventType', filter.eventType)
      params.append('page', filter.page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/webhooks/replays?${params}`)
      if (!response.ok) throw new Error('Failed to fetch replays')
      const result = await response.json()
      setReplays(result.data.replays || [])
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to fetch replays',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter.eventType) params.append('eventType', filter.eventType)

      const response = await fetch(`/api/webhooks/replays-stats?${params}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const result = await response.json()
      setStats(result.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [filter])

  useEffect(() => {
    fetchReplays()
    fetchStats()
  }, [fetchReplays, fetchStats])

  const handleExecuteReplay = async (replayId: string) => {
    try {
      const response = await fetch(`/api/webhooks/replays/${replayId}`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to execute replay')

      toast({
        title: 'Success',
        description: 'Replay executed successfully',
      })

      await fetchReplays()
      if (selectedReplay?._id === replayId) {
        const updated = await fetch(`/api/webhooks/replays/${replayId}`)
        const result = await updated.json()
        setSelectedReplay(result.data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to execute replay',
        variant: 'destructive',
      })
    }
  }

  const handleCancelReplay = async (replayId: string) => {
    try {
      const response = await fetch(`/api/webhooks/replays/${replayId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to cancel replay')

      toast({
        title: 'Success',
        description: 'Replay cancelled successfully',
      })

      await fetchReplays()
      setDetailsOpen(false)
      setSelectedReplay(null)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to cancel replay',
        variant: 'destructive',
      })
    }
  }

  const handleBatchReplay = async () => {
    try {
      const eventIds = batchData.eventIds
        .split('\n')
        .map((id) => id.trim())
        .filter((id) => id)

      if (eventIds.length === 0) {
        toast({
          title: 'Error',
          description: 'Please enter at least one event ID',
          variant: 'destructive',
        })
        return
      }

      const response = await fetch('/api/webhooks/replays-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds,
          eventType: batchData.eventType,
          reason: batchData.reason,
        }),
      })

      if (!response.ok) throw new Error('Failed to create batch replay')

      toast({
        title: 'Success',
        description: `Batch replay created for ${eventIds.length} events`,
      })

      setBatchOpen(false)
      setBatchData({
        eventIds: '',
        eventType: 'order.created',
        reason: 'Manual batch replay',
      })
      await fetchReplays()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create batch replay',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Replays</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReplays}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.successRate * 100)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attempts</CardTitle>
              <RotateCw className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageAttempts.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.statusBreakdown.pending || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Select
              value={filter.status || ''}
              onValueChange={(value) =>
                setFilter({ ...filter, status: value || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select
              value={filter.eventType || ''}
              onValueChange={(value) =>
                setFilter({ ...filter, eventType: value || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Event Types</SelectItem>
                <SelectItem value="order.created">Order Created</SelectItem>
                <SelectItem value="order.paid">Order Paid</SelectItem>
                <SelectItem value="order.delivered">Order Delivered</SelectItem>
                <SelectItem value="product.created">Product Created</SelectItem>
                <SelectItem value="product.updated">Product Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Batch Replay
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Batch Replay</DialogTitle>
                <DialogDescription>
                  Create replays for multiple failed events
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="batch-event-ids">Event IDs (one per line)</Label>
                  <Textarea
                    id="batch-event-ids"
                    placeholder="event-id-1&#10;event-id-2&#10;event-id-3"
                    value={batchData.eventIds}
                    onChange={(e) =>
                      setBatchData({ ...batchData, eventIds: e.target.value })
                    }
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="batch-event-type">Event Type</Label>
                  <Select
                    value={batchData.eventType}
                    onValueChange={(value) =>
                      setBatchData({ ...batchData, eventType: value })
                    }
                  >
                    <SelectTrigger id="batch-event-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order.created">Order Created</SelectItem>
                      <SelectItem value="order.paid">Order Paid</SelectItem>
                      <SelectItem value="order.delivered">
                        Order Delivered
                      </SelectItem>
                      <SelectItem value="product.created">Product Created</SelectItem>
                      <SelectItem value="product.updated">Product Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="batch-reason">Reason</Label>
                  <Input
                    id="batch-reason"
                    value={batchData.reason}
                    onChange={(e) =>
                      setBatchData({ ...batchData, reason: e.target.value })
                    }
                    placeholder="Reason for batch replay"
                  />
                </div>

                <Button onClick={handleBatchReplay} className="w-full">
                  Create Batch Replay
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Replays Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Replays</CardTitle>
          <CardDescription>
            {replays.length} replays
            {filter.status && ` (${filter.status})`}
            {filter.eventType && ` (${filter.eventType})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No replays found
                    </TableCell>
                  </TableRow>
                ) : (
                  replays.map((replay) => (
                    <TableRow key={replay._id}>
                      <TableCell className="font-mono text-sm">
                        {replay.originalEventId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{replay.eventType}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[replay.status]}>
                          {replay.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {replay.totalAttempts} / {replay.maxAttempts}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(replay.createdAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Dialog open={detailsOpen && selectedReplay?._id === replay._id}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReplay(replay)
                                setDetailsOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Replay Details</DialogTitle>
                              <DialogDescription>
                                {selectedReplay?.originalEventId}
                              </DialogDescription>
                            </DialogHeader>

                            {selectedReplay && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Status
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {selectedReplay.status}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Event Type
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {selectedReplay.eventType}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Attempts
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {selectedReplay.totalAttempts} / {selectedReplay.maxAttempts}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Success Rate
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {selectedReplay.attempts.length > 0
                                        ? Math.round(
                                            (selectedReplay.attempts.filter(
                                              (a) => a.status === 'success'
                                            ).length /
                                              selectedReplay.attempts.length) *
                                              100
                                          )
                                        : 0}
                                      %
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Reason
                                    </p>
                                    <p className="text-sm">{selectedReplay.reason}</p>
                                  </div>
                                  {selectedReplay.nextRetryAt && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">
                                        Next Retry
                                      </p>
                                      <p className="text-sm">
                                        {format(
                                          new Date(selectedReplay.nextRetryAt),
                                          'MMM dd, HH:mm:ss'
                                        )}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Attempts Timeline */}
                                <div>
                                  <h4 className="font-semibold mb-3">Attempt History</h4>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedReplay.attempts.map((attempt, idx) => (
                                      <Card key={idx} className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              {statusIcons[attempt.status as keyof typeof statusIcons]}
                                              <span className="font-medium text-sm">
                                                Attempt {idx + 1}
                                              </span>
                                              <Badge variant="outline" className="text-xs">
                                                {attempt.statusCode || 'N/A'}
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                {attempt.latency}ms
                                              </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {format(
                                                new Date(attempt.timestamp),
                                                'MMM dd, HH:mm:ss'
                                              )}
                                            </p>
                                            {attempt.errorMessage && (
                                              <p className="text-xs text-red-600 mt-1">
                                                {attempt.errorMessage}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                  {selectedReplay.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleExecuteReplay(selectedReplay._id)
                                        }
                                      >
                                        <RotateCw className="mr-2 h-4 w-4" />
                                        Execute Now
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          handleCancelReplay(selectedReplay._id)
                                        }
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Cancel
                                      </Button>
                                    </>
                                  )}
                                  {(selectedReplay.status === 'failed' ||
                                    selectedReplay.status === 'completed') && (
                                    <Button
                                      onClick={() =>
                                        handleExecuteReplay(selectedReplay._id)
                                      }
                                    >
                                      <RotateCw className="mr-2 h-4 w-4" />
                                      Retry
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {replay.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExecuteReplay(replay._id)}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelReplay(replay._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
