'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getVendorByUserId } from '@/lib/actions/vendor.actions'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Package,
  ShoppingCart,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import { NotificationCenter } from '@/components/shared/notification-center'

interface VendorLayoutProps {
  children: React.ReactNode
}

interface VendorData {
  _id: string
  businessName: string
  logo?: string
  status: string
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      const loadVendor = async () => {
        const userId = session.user.id as string
        const result = await getVendorByUserId(userId)
        if (result.success && result.data) {
          if (result.data.status !== 'approved') {
            toast({
              title: 'Access Denied',
              description: 'Your vendor account is not approved yet',
              variant: 'destructive',
            })
            router.push('/')
            return
          }
          setVendor(result.data)
        } else {
          toast({
            title: 'Error',
            description: 'Vendor account not found',
            variant: 'destructive',
          })
          router.push('/')
        }
        setIsLoading(false)
      }

      loadVendor()
    }
  }, [status, session, router])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p>Loading vendor dashboard...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return null
  }

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/vendor/dashboard',
      icon: BarChart3,
    },
    {
      label: 'Products',
      href: '/vendor/products',
      icon: Package,
    },
    {
      label: 'Orders',
      href: '/vendor/orders',
      icon: ShoppingCart,
    },
    {
      label: 'Analytics',
      href: '/vendor/analytics',
      icon: BarChart3,
    },
    {
      label: 'Payouts',
      href: '/vendor/payouts',
      icon: CreditCard,
    },
    {
      label: 'Settings',
      href: '/vendor/settings',
      icon: Settings,
    },
  ]

  const isActive = (href: string) => {
    return pathname.includes(href)
  }

  return (
    <div className='flex h-screen bg-background'>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-slate-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className='p-6 border-b border-slate-800 flex items-center gap-3'>
          {vendor.logo && (
            <div className='relative w-10 h-10 flex-shrink-0'>
              <Image
                src={vendor.logo}
                alt={vendor.businessName}
                fill
                className='object-contain'
              />
            </div>
          )}
          <div className='flex-1 min-w-0'>
            <h2 className='font-bold text-sm truncate'>{vendor.businessName}</h2>
            <p className='text-xs text-slate-400'>Vendor Dashboard</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className='flex-1 py-4 px-3 space-y-2 overflow-y-auto'>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className='w-5 h-5 flex-shrink-0' />
                <span className='font-medium text-sm'>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className='p-4 border-t border-slate-800'>
          <Button
            variant='ghost'
            className='w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800'
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
          >
            <LogOut className='w-5 h-5 mr-3' />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Top Bar */}
        <header className='bg-white border-b px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='p-2 hover:bg-slate-100 rounded-lg'
            >
              {sidebarOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
            </button>
            {!sidebarOpen && (
              <h1 className='font-bold text-lg'>{vendor.businessName}</h1>
            )}
          </div>
          <div className='flex items-center gap-4'>
            {vendor._id && (
              <NotificationCenter type='vendor' id={vendor._id} />
            )}
            <Button
              variant='outline'
              onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-auto bg-slate-50'>
          <div className='p-6'>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
