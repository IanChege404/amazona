'use client'

import { useCallback, useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReconciliationRun {
  _id: string
  startedAt: string
  completedAt?: string
  status: string
  type: string
  ordersChecked: number
  paymentsChecked: number
  discrepanciesFound: number
  discrepanciesResolved: number
  summary: Record<string, any>
}

interface Discrepancy {
  _id: string
  type: string
  severity: string
  status: string
  expectedAmount: number
  actualAmount: number
  difference: number
  createdAt: string
  resolution?: string
  orderId?: string
}

interface ReconciliationStatus {
  latestRun?: ReconciliationRun
  pendingCount: number
  criticalCount: number
  pendinDiscrepancies: Discrepancy[]
  criticalDiscrepancies: Discrepancy[]
  recentRuns: ReconciliationRun[]
  balanceHistory: Array<{
    available: number
    pending: number
    total: number
    createdAt: string
  }>
}

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  ignored: 'bg-gray-100 text-gray-800',
}

const typeIcons = {
  order_mismatch: <AlertCircle className="h-4 w-4" />,
  payment_mismatch: <AlertTriangle className="h-4 w-4" />,
  payout_mismatch: <TrendingDown className="h-4 w-4" />,
  balance_mismatch: <TrendingUp className="h-4 w-4" />,
}

export function ReconciliationDashboard() {
  const { toast } = useToast()
  const [status, setStatus] = useState<ReconciliationStatus | null>(null)
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [filter, setFilter] = useState({
    type: '',
    status: '',
    severity: '',
    page: 1,
  })
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<Discrepancy | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolution, setResolution] = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reconciliation')
      if (!response.ok) throw new Error('Failed to fetch status')
      const result = await response.json()
      setStatus(result.data)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to fetch reconciliation status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchDiscrepancies = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter.type) params.append('type', filter.type)
      if (filter.status) params.append('status', filter.status)
      if (filter.severity) params.append('severity', filter.severity)
      params.append('page', filter.page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/admin/reconciliation/discrepancies?${params}`)
      if (!response.ok) throw new Error('Failed to fetch discrepancies')
      const result = await response.json()
      setDiscrepancies(result.data.discrepancies || [])
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to fetch discrepancies',
        variant: 'destructive',
      })
    }
  }, [filter, toast])

  useEffect(() => {
    fetchStatus()
    fetchDiscrepancies()
  }, [fetchStatus, fetchDiscrepancies])

  const handleRunReconciliation = async (type: string) => {
    try {
      setRunning(true)
      const response = await fetch('/api/admin/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) throw new Error('Failed to run reconciliation')

      toast({
        title: 'Success',
        description: 'Reconciliation started',
      })

      await fetchStatus()
      await fetchDiscrepancies()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to run reconciliation',
        variant: 'destructive',
      })
    } finally {
      setRunning(false)
    }
  }

  const handleResolveDiscrepancy = async () => {
    if (!selectedDiscrepancy || !resolution.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a resolution',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/reconciliation/discrepancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discrepancyId: selectedDiscrepancy._id,
          resolution,
        }),
      })

      if (!response.ok) throw new Error('Failed to resolve discrepancy')

      toast({
        title: 'Success',
        description: 'Discrepancy resolved',
      })

      setResolveOpen(false)
      setResolution('')
      await fetchDiscrepancies()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to resolve discrepancy',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.criticalCount || 0}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {status?.latestRun
                ? formatDistanceToNow(new Date(status.latestRun.startedAt), {
                    addSuffix: true,
                  })
                : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.latestRun?.status === 'completed' ? (
                <CheckCircle2 className="inline h-3 w-3 mr-1 text-green-600" />
              ) : (
                <Clock className="inline h-3 w-3 mr-1 text-yellow-600" />
              )}
              {status?.latestRun?.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Found Today</CardTitle>
            <Eye className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.latestRun?.discrepanciesFound || 0}
            </div>
            <p className="text-xs text-muted-foreground">In latest run</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Run Reconciliation</CardTitle>
          <CardDescription>
            Verify orders, payments, and Stripe balance
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            onClick={() => handleRunReconciliation('full')}
            disabled={running}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            Full Reconciliation
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRunReconciliation('stripe')}
            disabled={running}
          >
            Check Stripe Balance
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRunReconciliation('payout')}
            disabled={running}
          >
            Verify Payouts
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Discrepancies</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Select value={filter.type} onValueChange={(value) => setFilter({ ...filter, type: value, page: 1 })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="order_mismatch">Order Mismatch</SelectItem>
                <SelectItem value="payment_mismatch">Payment Mismatch</SelectItem>
                <SelectItem value="payout_mismatch">Payout Mismatch</SelectItem>
                <SelectItem value="balance_mismatch">Balance Mismatch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={filter.status} onValueChange={(value) => setFilter({ ...filter, status: value, page: 1 })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={filter.severity} onValueChange={(value) => setFilter({ ...filter, severity: value, page: 1 })}>
              <SelectTrigger>
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Discrepancies</CardTitle>
          <CardDescription>
            {discrepancies.length} items
            {filter.type && ` (${filter.type})`}
            {filter.status && ` (${filter.status})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discrepancies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No discrepancies found
                    </TableCell>
                  </TableRow>
                ) : (
                  discrepancies.map((disc) => (
                    <TableRow key={disc._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {typeIcons[disc.type as keyof typeof typeIcons]}
                          {disc.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={severityColors[disc.severity as keyof typeof severityColors]}>
                          {disc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ${disc.expectedAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ${disc.actualAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <span className={disc.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                          ${Math.abs(disc.difference).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[disc.status as keyof typeof statusColors]}>
                          {disc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(disc.createdAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Dialog open={detailsOpen && selectedDiscrepancy?._id === disc._id}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDiscrepancy(disc)
                                setDetailsOpen(true)
                              }}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Discrepancy Details</DialogTitle>
                            </DialogHeader>

                            {selectedDiscrepancy && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                                    <p className="text-lg font-semibold mt-1">{selectedDiscrepancy.type}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Severity</p>
                                    <p className="mt-1">
                                      <Badge className={severityColors[selectedDiscrepancy.severity as keyof typeof severityColors]}>
                                        {selectedDiscrepancy.severity}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Expected Amount</p>
                                    <p className="text-lg font-semibold mt-1">
                                      ${selectedDiscrepancy.expectedAmount.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Actual Amount</p>
                                    <p className="text-lg font-semibold mt-1">
                                      ${selectedDiscrepancy.actualAmount.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-sm font-medium text-muted-foreground">Difference</p>
                                    <p className={`text-lg font-semibold mt-1 ${selectedDiscrepancy.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      ${Math.abs(selectedDiscrepancy.difference).toFixed(2)}
                                    </p>
                                  </div>
                                  {selectedDiscrepancy.orderId && (
                                    <div className="col-span-2">
                                      <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                                      <p className="font-mono text-sm mt-1">{selectedDiscrepancy.orderId}</p>
                                    </div>
                                  )}
                                  {selectedDiscrepancy.resolution && (
                                    <div className="col-span-2">
                                      <p className="text-sm font-medium text-muted-foreground">Resolution</p>
                                      <p className="text-sm mt-1">{selectedDiscrepancy.resolution}</p>
                                    </div>
                                  )}
                                </div>

                                {selectedDiscrepancy.status === 'pending' && (
                                  <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
                                    <DialogTrigger asChild>
                                      <Button className="w-full">Resolve Discrepancy</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Resolve Discrepancy</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="resolution-note">Resolution Note</Label>
                                          <Input
                                            id="resolution-note"
                                            placeholder="How was this discrepancy resolved?"
                                            value={resolution}
                                            onChange={(e) => setResolution(e.target.value)}
                                            className="mt-1"
                                          />
                                        </div>
                                        <Button
                                          onClick={handleResolveDiscrepancy}
                                          className="w-full"
                                        >
                                          Confirm Resolution
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
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
