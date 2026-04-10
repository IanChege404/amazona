'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WebhookEventType } from '@/lib/webhooks/types'

interface VendorWebhook {
  _id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  description?: string
  failureCount: number
  lastSuccessAt?: Date
  lastFailureAt?: Date
  deliveryCount?: number
  successRate?: number
}

export function VendorWebhooksManagement() {
  const [webhooks, setWebhooks] = useState<VendorWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    description: '',
    retryAttempts: 5,
    timeoutSeconds: 10,
  })

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vendor/webhooks?includeStats=true')
      const result = await response.json()

      if (result.success) {
        setWebhooks(result.data)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch webhooks',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch webhooks',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWebhook = async () => {
    if (!formData.url || formData.events.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'URL and at least one event type are required',
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/vendor/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Webhook created successfully',
        })
        setFormData({
          url: '',
          events: [],
          description: '',
          retryAttempts: 5,
          timeoutSeconds: 10,
        })
        fetchWebhooks()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to create webhook',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create webhook',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const response = await fetch(`/api/vendor/webhooks/${webhookId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Webhook deleted successfully',
        })
        fetchWebhooks()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete webhook',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete webhook',
      })
    }
  }

  const handleTestWebhook = async (webhookId: string, eventType: string) => {
    try {
      const response = await fetch(`/api/vendor/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: `Webhook test successful (${result.data.duration}ms)`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Webhook test failed',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to test webhook',
      })
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    })
  }

  const getHealthBadge = (webhook: VendorWebhook) => {
    if (!webhook.isActive) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (webhook.failureCount >= 5) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Disabled
        </Badge>
      )
    }
    if (webhook.lastSuccessAt) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>
      )
    }
    return <Badge variant="secondary">Pending</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your webhook subscriptions ({webhooks.length})
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook Subscription</DialogTitle>
              <DialogDescription>
                Subscribe to events and receive notifications at your endpoint
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="url">Webhook URL *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/webhooks"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="events">Event Types *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 p-3 border rounded bg-gray-50 max-h-48 overflow-y-auto">
                  {Object.values(WebhookEventType).map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              events: [...formData.events, event],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              events: formData.events.filter((ev) => ev !== event),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Production webhook"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="retries">Retry Attempts</Label>
                  <Input
                    id="retries"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.retryAttempts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retryAttempts: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="5"
                    max="60"
                    value={formData.timeoutSeconds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        timeoutSeconds: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleCreateWebhook} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create Webhook'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No webhooks yet</h3>
              <p className="text-gray-600 text-sm mt-1">
                Create your first webhook to receive event notifications
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook._id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{webhook.url}</h3>
                      {getHealthBadge(webhook)}
                    </div>
                    {webhook.description && (
                      <p className="text-sm text-gray-600">{webhook.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook._id, webhook.events[0])}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {webhook.deliveryCount !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Deliveries</p>
                      <p className="text-lg font-semibold">{webhook.deliveryCount}</p>
                    </div>
                  )}
                  {webhook.successRate !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="text-lg font-semibold">{webhook.successRate.toFixed(1)}%</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Secret</p>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <code className="text-xs font-mono flex-1">
                      {showSecrets[webhook._id]
                        ? webhook.secret
                        : '*'.repeat(webhook.secret.length)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [webhook._id]: !showSecrets[webhook._id],
                        })
                      }
                    >
                      {showSecrets[webhook._id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(webhook.secret, 'Secret')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Subscribed Events ({webhook.events.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="secondary">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
