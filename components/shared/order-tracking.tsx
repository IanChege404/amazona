'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Package, Truck } from 'lucide-react'

interface OrderStatus {
  status: string
  message: string
  timestamp: string
}

interface OrderTrackingProps {
  orderId: string
  initialStatus?: string
  isPaid?: boolean
  isDelivered?: boolean
}

interface PusherChannel {
  bind: (event: string, callback: (data: OrderStatus) => void) => void
  unbind_all: () => void
}

interface PusherConnection {
  bind: (event: string, callback: () => void) => void
  unbind_all: () => void
}

interface PusherInstance {
  disconnect: () => void
  subscribe: (channel: string) => PusherChannel
  connection: PusherConnection
}

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Clock },
  { key: 'paid', label: 'Payment Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

function getStepIndex(status: string, isPaid: boolean, isDelivered: boolean): number {
  if (isDelivered) return 4
  if (status === 'shipped') return 3
  if (status === 'processing') return 2
  if (isPaid) return 1
  return 0
}

export function OrderTracking({
  orderId,
  initialStatus = 'placed',
  isPaid = false,
  isDelivered = false,
}: OrderTrackingProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus)
  const [statusMessages, setStatusMessages] = useState<OrderStatus[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [currentIsPaid, setCurrentIsPaid] = useState(isPaid)
  const [currentIsDelivered, setCurrentIsDelivered] = useState(isDelivered)

  const activeStep = getStepIndex(currentStatus, currentIsPaid, currentIsDelivered)

  useEffect(() => {
    // Only connect if Pusher key is configured
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!pusherKey || !orderId) return

    let pusherInstance: PusherInstance | null = null
    let channel: PusherChannel | null = null

    const initPusher = async () => {
      try {
        const PusherClient = (await import('pusher-js')).default

        pusherInstance = new PusherClient(pusherKey, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
          authEndpoint: '/api/pusher/auth',
        })

        pusherInstance.connection.bind('connected', () => {
          setIsConnected(true)
        })

        channel = pusherInstance.subscribe(`order-${orderId}`)

        channel.bind('status-updated', (data: OrderStatus) => {
          setCurrentStatus(data.status)
          setStatusMessages((prev) => [data, ...prev].slice(0, 10))

          if (data.status === 'paid' || data.status === 'processing' || data.status === 'shipped') {
            setCurrentIsPaid(true)
          }
          if (data.status === 'delivered') setCurrentIsDelivered(true)
        })
      } catch (error) {
        console.warn('Pusher initialization failed:', error)
      }
    }

    initPusher()

    return () => {
      if (pusherInstance) {
        pusherInstance.connection.unbind_all()
        if (channel) channel.unbind_all()
        pusherInstance.disconnect()
      }
    }
  }, [orderId])

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Order Tracking</CardTitle>
          {process.env.NEXT_PUBLIC_PUSHER_KEY && (
            <Badge variant={isConnected ? 'default' : 'secondary'} className='text-xs'>
              {isConnected ? '● Live' : '○ Connecting...'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className='relative'>
          {/* Progress Line */}
          <div className='absolute top-5 left-5 right-5 h-0.5 bg-muted' />
          <div
            className='absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500'
            style={{
              width: activeStep === 0 ? '0%' : `${(activeStep / (STATUS_STEPS.length - 1)) * 100}%`,
            }}
          />

          {/* Steps */}
          <div className='relative flex justify-between'>
            {STATUS_STEPS.map((step, index) => {
              const Icon = step.icon
              const isComplete = index < activeStep
              const isActive = index === activeStep

              return (
                <div key={step.key} className='flex flex-col items-center gap-2'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isComplete
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isActive
                          ? 'bg-background border-primary text-primary'
                          : 'bg-background border-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className='w-4 h-4' />
                  </div>
                  <span
                    className={`text-xs text-center max-w-[60px] leading-tight ${
                      isActive ? 'font-semibold text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Messages */}
        {statusMessages.length > 0 && (
          <div className='mt-6 space-y-2'>
            <p className='text-sm font-medium'>Recent Updates</p>
            <div className='space-y-1 max-h-32 overflow-y-auto'>
              {statusMessages.map((msg, idx) => (
                <div key={idx} className='text-xs text-muted-foreground flex justify-between gap-4'>
                  <span>{msg.message}</span>
                  <span className='shrink-0'>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
