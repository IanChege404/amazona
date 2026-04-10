'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface StripeStatus {
  isConnected: boolean
  isVerified: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirements: string[]
}

export default function VendorSettingsPage() {
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const fetchStripeStatus = async () => {
      try {
        const response = await fetch('/api/vendors/stripe/connect', {
          method: 'GET',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch Stripe status')
        }

        const data = await response.json()
        setStripeStatus({
          isConnected: !!data.accountId,
          isVerified: data.charges_enabled && data.payouts_enabled,
          chargesEnabled: data.charges_enabled,
          payoutsEnabled: data.payouts_enabled,
          requirements: data.requirements_due || [],
        })
      } catch (error) {
        console.error('Error fetching Stripe status:', error)
        toast({
          title: 'Error',
          description: 'Could not fetch Stripe account status',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStripeStatus()
  }, [])

  const handleConnectStripe = async () => {
    setConnecting(true)
    try {
      const response = await fetch('/api/vendors/stripe/connect', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create Stripe connect session')
      }

      const data = await response.json()
      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect Stripe',
        variant: 'destructive',
      })
      setConnecting(false)
    }
  }

  const handleRefreshStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/vendors/stripe/connect', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to refresh status')
      }

      const data = await response.json()
      setStripeStatus({
        isConnected: !!data.accountId,
        isVerified: data.charges_enabled && data.payouts_enabled,
        chargesEnabled: data.charges_enabled,
        payoutsEnabled: data.payouts_enabled,
        requirements: data.requirements_due || [],
      })

      toast({
        title: 'Success',
        description: 'Stripe account status updated',
      })
    } catch (error) {
      console.error('Error refreshing status:', error)
      toast({
        title: 'Error',
        description: 'Could not refresh status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your vendor account settings and payment methods</p>
      </div>

      {/* Stripe Payment Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* Stripe logo simplified */}
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
            </svg>
            Stripe Payment Setup
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to accept payments from customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          {stripeStatus && (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Connection Status</span>
                    <Badge
                      variant={stripeStatus.isConnected ? 'default' : 'secondary'}
                      className={
                        stripeStatus.isConnected
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {stripeStatus.isConnected ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {stripeStatus.isConnected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stripeStatus.isConnected
                      ? 'Your Stripe account is ready to accept payments'
                      : 'Connect your Stripe account to start selling'}
                  </p>
                </div>
              </div>

              {/* Verification Status */}
              {stripeStatus.isConnected && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Charges Enabled</span>
                    <Badge
                      variant={stripeStatus.chargesEnabled ? 'default' : 'secondary'}
                      className={
                        stripeStatus.chargesEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {stripeStatus.chargesEnabled ? '✓ Yes' : '✗ No'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Payouts Enabled</span>
                    <Badge
                      variant={stripeStatus.payoutsEnabled ? 'default' : 'secondary'}
                      className={
                        stripeStatus.payoutsEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {stripeStatus.payoutsEnabled ? '✓ Yes' : '✗ No'}
                    </Badge>
                  </div>

                  {/* Requirements */}
                  {stripeStatus.requirements.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-amber-900">
                            Action Required
                          </p>
                          <ul className="mt-1 space-y-1">
                            {stripeStatus.requirements.map((req, idx) => (
                              <li key={idx} className="text-sm text-amber-700">
                                • {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {!stripeStatus.isConnected ? (
                  <Button
                    onClick={handleConnectStripe}
                    disabled={connecting}
                    className="gap-2"
                    size="lg"
                  >
                    {connecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    {connecting ? 'Connecting...' : 'Connect Stripe Account'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleRefreshStatus}
                      variant="outline"
                      disabled={loading}
                      className="gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Refresh Status
                    </Button>
                    <Button
                      onClick={handleConnectStripe}
                      variant="outline"
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Stripe Dashboard
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your vendor account details</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Account settings form coming soon</p>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <CardDescription>Configure how you receive payments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Managed through Stripe Dashboard</p>
        </CardContent>
      </Card>
    </div>
  )
}
