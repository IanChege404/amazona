import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Vendor Dashboard',
}

export default async function VendorDashboard() {
  // TODO: Fetch real data from getVendorAnalytics in Phase 3
  const stats = {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalProducts: 0,
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground'>Welcome to your vendor dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center justify-between'>
              Total Revenue
              <DollarSign className='w-4 h-4 text-primary' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${stats.totalRevenue.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground mt-1'>Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center justify-between'>
              Total Orders
              <ShoppingCart className='w-4 h-4 text-primary' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalOrders}</div>
            <p className='text-xs text-muted-foreground mt-1'>All-time sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center justify-between'>
              Avg Order Value
              <TrendingUp className='w-4 h-4 text-primary' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${stats.avgOrderValue.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground mt-1'>Average per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center justify-between'>
              Products
              <Package className='w-4 h-4 text-primary' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalProducts}</div>
            <p className='text-xs text-muted-foreground mt-1'>Active listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder Sections */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest orders and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-center py-8 text-muted-foreground'>
              <p>No recent activity yet</p>
              <p className='text-sm'>Your orders will appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Link href='/vendor/products' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>Add Product</p>
              <p className='text-xs text-muted-foreground'>Create new listing</p>
            </Link>
            <Link href='/vendor/orders' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>View Orders</p>
              <p className='text-xs text-muted-foreground'>Manage your sales</p>
            </Link>
            <Link href='/vendor/settings' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>Settings</p>
              <p className='text-xs text-muted-foreground'>Account & billing</p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Complete these steps to get the most out of your store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0'>
                ✓
              </div>
              <div>
                <p className='font-medium text-sm'>Account Created</p>
                <p className='text-xs text-muted-foreground'>You&rsquo;re all set to start selling</p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0'>
                2
              </div>
              <div>
                <p className='font-medium text-sm'>Complete Stripe Setup</p>
                <p className='text-xs text-muted-foreground'>
                  Connect your Stripe account to receive payments
                </p>
                <Link href='/vendor/settings' className='text-xs text-primary mt-1 inline-block'>
                  Go to Settings →
                </Link>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold flex-shrink-0'>
                3
              </div>
              <div>
                <p className='font-medium text-sm'>Add Your First Product</p>
                <p className='text-xs text-muted-foreground'>Create your first product listing</p>
                <Link href='/vendor/products' className='text-xs text-primary mt-1 inline-block'>
                  Create Product \u2192
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
