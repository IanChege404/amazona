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
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  Trash2,
  Eye,
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

export function VendorReplayManager() {
  const { toast } = useToast()
  const [replays, setReplays] = useState<WebhookReplay[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedReplay, setSelectedReplay] = useState<WebhookReplay | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [page, setPage] = useState(1)

  const fetchReplays = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/webhooks/replays?${params}`)
      if (!response.ok) throw new Error('Failed to fetch replays')

      const result = await response.json()
      const data = result.data.replays || []
      setReplays(data)

      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter((r: WebhookReplay) => r.status === 'pending').length,
        completed: data.filter((r: WebhookReplay) => r.status === 'completed').length,
        failed: data.filter((r: WebhookReplay) => r.status === 'failed').length,
      })
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
  }, [page, toast])

  useEffect(() => {
    fetchReplays()
  }, [fetchReplays])

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replays</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Replays Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Webhook Replays</CardTitle>
          <CardDescription>
            Retry failed webhook deliveries to your endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Event Type</TableHead>
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
                      No replays found. Your successful webhooks will appear here.
                    </TableCell>
                  </TableRow>
                ) : (
                  replays.map((replay) => (
                    <TableRow key={replay._id}>
                      <TableCell className="font-mono text-sm">
                        {replay.originalEventId.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm">{replay.eventType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcons[replay.status as keyof typeof statusIcons]}
                          <Badge className={statusColors[replay.status]}>
                            {replay.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {replay.totalAttempts === 1 ? (
                          <span>1 attempt</span>
                        ) : (
                          <span>{replay.totalAttempts} attempts</span>
                        )}
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
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                                    <div className="flex items-center gap-2 mt-1">
                                      {statusIcons[selectedReplay.status as keyof typeof statusIcons]}
                                      <Badge
                                        className={
                                          statusColors[
                                            selectedReplay.status as keyof typeof statusColors
                                          ]
                                        }
                                      >
                                        {selectedReplay.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Event Type
                                    </p>
                                    <p className="text-lg font-semibold mt-1">
                                      {selectedReplay.eventType}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Attempts
                                    </p>
                                    <p className="text-lg font-semibold mt-1">
                                      {selectedReplay.totalAttempts} /{' '}
                                      {selectedReplay.maxAttempts}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Success Rate
                                    </p>
                                    <p className="text-lg font-semibold mt-1">
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
                                  {selectedReplay.nextRetryAt && (
                                    <div className="col-span-2">
                                      <p className="text-sm font-medium text-muted-foreground">
                                        Next Retry Scheduled
                                      </p>
                                      <p className="text-sm mt-1">
                                        {format(
                                          new Date(selectedReplay.nextRetryAt),
                                          'MMMM dd, yyyy HH:mm:ss'
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
                                      <Card key={idx} className="p-3 bg-slate-50">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              {statusIcons[attempt.status as keyof typeof statusIcons]}
                                              <span className="font-medium text-sm">
                                                Attempt {idx + 1}
                                              </span>
                                              <Badge variant="outline" className="text-xs">
                                                {attempt.statusCode || 'pending'}
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                {attempt.latency}ms
                                              </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {format(
                                                new Date(attempt.timestamp),
                                                'MMM dd, yyyy HH:mm:ss'
                                              )}
                                            </p>
                                            {attempt.errorMessage && (
                                              <p className="text-xs text-red-600 mt-1 font-mono">
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
                                <div className="flex gap-2 pt-4 border-t">
                                  {selectedReplay.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleExecuteReplay(selectedReplay._id)
                                        }
                                      >
                                        <RotateCw className="mr-2 h-4 w-4" />
                                        Retry Now
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
                              title="Retry now"
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelReplay(replay._id)}
                              title="Cancel replay"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {(replay.status === 'failed' ||
                          replay.status === 'completed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteReplay(replay._id)}
                            title="Retry this replay"
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={replays.length < 20}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
