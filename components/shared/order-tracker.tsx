'use client'

import { useOrderTracker } from '@/hooks/use-realtime'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface OrderTrackerProps {
  orderId: string
  initialStatus?: string
}

const ORDER_STEPS = [
  { id: 'pending', label: 'Order Placed', description: 'We received your order' },
  { id: 'confirmed', label: 'Confirmed', description: 'Order confirmed' },
  { id: 'processing', label: 'Processing', description: 'Preparing your order' },
  { id: 'shipped', label: 'Shipped', description: 'On the way to you' },
  { id: 'delivered', label: 'Delivered', description: 'Order delivered' },
]

export function OrderTracker({ orderId, initialStatus = 'pending' }: OrderTrackerProps) {
  const [displayStatus, setDisplayStatus] = useState(initialStatus)
  const { status: realtimeStatus, isConnected } = useOrderTracker({
    orderId,
    enabled: true,
  })

  // Update display status when realtime status changes
  useEffect(() => {
    if (realtimeStatus?.status) {
      setDisplayStatus(realtimeStatus.status)
    }
  }, [realtimeStatus])

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.id === displayStatus)

  return (
    <div className="space-y-4">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
          <AlertCircle className="h-4 w-4" />
          <span>Real-time updates temporarily unavailable</span>
        </div>
      )}

      {/* Status stepper */}
      <div className="space-y-4">
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex

          return (
            <div key={step.id} className="flex gap-4">
              {/* Icon column */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-green-100 text-green-700'
                      : isCurrent
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Connector line to next step */}
                {index < ORDER_STEPS.length - 1 && (
                  <div
                    className={`h-12 w-1 my-2 ${
                      isCompleted ? 'bg-green-200' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Content column */}
              <div className="flex-1 pt-1">
                <p
                  className={`font-semibold ${
                    isCompleted || isCurrent
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-sm ${
                    isCompleted || isCurrent
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </p>

                {/* Show timestamp for completed steps */}
                {isCompleted && realtimeStatus?.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(realtimeStatus.timestamp).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Status badge for current step */}
              {isCurrent && (
                <Badge className="self-center bg-blue-500">
                  In Progress
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      {/* Latest message */}
      {realtimeStatus?.message && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Status Update:</strong> {realtimeStatus.message}
          </p>
        </div>
      )}
    </div>
  )
}
