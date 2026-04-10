'use client'

import { useVendorNotifications, useUserNotifications } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationCenterProps {
  type: 'vendor' | 'user'
  id: string
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200'
    case 'error':
      return 'bg-red-50 border-red-200'
    case 'warning':
      return 'bg-amber-50 border-amber-200'
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200'
  }
}

export function NotificationCenter({
  type,
  id,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayCount, setDisplayCount] = useState(0)

  const vendorNotifications = useVendorNotifications(id)
  const userNotifications = useUserNotifications(id)

  const isVendor = type === 'vendor'
  const { notifications, isConnected, clearNotifications } = isVendor ? vendorNotifications : userNotifications

  useEffect(() => {
    setDisplayCount(notifications.length)
  }, [notifications])

  const handleClearAll = () => {
    clearNotifications()
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {displayCount > 9 ? '9+' : displayCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="m-0">
              {isVendor ? 'Vendor' : 'Order'} Notifications
            </DropdownMenuLabel>
            {!isConnected && (
              <Badge variant="outline" className="text-xs">
                Offline
              </Badge>
            )}
          </div>
          {displayCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 px-2 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification, index) => (
              <div
                key={notification.id || notification.timestamp || `notification-${index}`}
                className={`p-3 border-l-4 ${getNotificationColor(notification.type as NotificationType)}`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type as NotificationType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          disabled={notifications.length === 0}
          onClick={handleClearAll}
          className="text-xs justify-center cursor-pointer"
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Clear All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
