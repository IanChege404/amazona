import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react'
import { connectToDatabase } from '@/lib/db'
import Vendor from '@/lib/db/models/vendor.model'
import Product from '@/lib/db/models/product.model'
import { getVendorStats } from '@/lib/actions/vendor.actions'

export const metadata: Metadata = {
  title: 'Vendor Dashboard',
}

interface RecentProduct {
  _id: string
  name: string
  price: number
  isPublished: boolean
}

export default async function VendorDashboard() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  await connectToDatabase()

  const vendor = await Vendor.findOne({ userId: session.user.id })

  if (!vendor) {
    redirect('/become-a-vendor')
  }

  if (vendor.status === 'suspended') {
    return (
      <div className='space-y-8'>
        <div>
          <h1 className='text-3xl font-bold'>Dashboard</h1>
          <p className='text-destructive mt-2'>
            Your account has been suspended. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Fetch real stats if vendor is approved
  let stats = { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalProducts: 0 }
  let recentProducts: RecentProduct[] = []

  if (vendor.status === 'approved') {
    const statsResult = await getVendorStats(vendor._id.toString())
    if (statsResult.success && statsResult.data) {
      const d = statsResult.data
      stats = {
        totalRevenue: d.totalRevenue,
        totalOrders: d.totalOrders,
        avgOrderValue: d.totalOrders > 0 ? d.totalRevenue / d.totalOrders : 0,
        totalProducts: d.totalProducts,
      }
    }

    recentProducts = await Product.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name price isPublished')
      .lean()
  }

  const isPending = vendor.status === 'pending'

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Welcome back, {vendor.businessName}
          {isPending && (
            <span className='ml-2 text-yellow-600 font-medium'>
              (Application under review)
            </span>
          )}
        </p>
      </div>

      {isPending && (
        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='pt-6'>
            <p className='text-yellow-800 font-medium'>Your vendor application is pending review.</p>
            <p className='text-yellow-700 text-sm mt-1'>
              Our team typically reviews applications within 24-48 hours. You will receive an email
              once approved.
            </p>
          </CardContent>
        </Card>
      )}

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

      {/* Recent Products + Quick Links */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>Your latest product listings</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProducts.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                <p>No products yet</p>
                <p className='text-sm'>Create your first product to start selling</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {recentProducts.map((p) => (
                  <div key={p._id} className='flex items-center justify-between py-2 border-b last:border-0'>
                    <span className='text-sm font-medium truncate max-w-[60%]'>{p.name}</span>
                    <div className='flex items-center gap-3'>
                      <span className='text-sm text-muted-foreground'>${p.price?.toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {p.isPublished ? 'Live' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Link href='/vendor/products/new' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>Add Product</p>
              <p className='text-xs text-muted-foreground'>Create new listing</p>
            </Link>
            <Link href='/vendor/products' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>My Products</p>
              <p className='text-xs text-muted-foreground'>Manage your listings</p>
            </Link>
            <Link href='/vendor/orders' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>View Orders</p>
              <p className='text-xs text-muted-foreground'>Manage your sales</p>
            </Link>
            <Link href='/vendor/analytics' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>Analytics</p>
              <p className='text-xs text-muted-foreground'>View performance metrics</p>
            </Link>
            <Link href='/vendor/settings' className='block p-2 rounded hover:bg-muted'>
              <p className='font-medium text-sm'>Settings</p>
              <p className='text-xs text-muted-foreground'>Account &amp; billing</p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      {vendor.status === 'approved' && (
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
                  <p className='font-medium text-sm'>Account Approved</p>
                  <p className='text-xs text-muted-foreground'>You&rsquo;re approved to start selling</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${vendor.stripeOnboardingComplete ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {vendor.stripeOnboardingComplete ? '✓' : '2'}
                </div>
                <div>
                  <p className='font-medium text-sm'>Complete Stripe Setup</p>
                  <p className='text-xs text-muted-foreground'>
                    Connect your Stripe account to receive payments
                  </p>
                  {!vendor.stripeOnboardingComplete && (
                    <Link href='/vendor/settings' className='text-xs text-primary mt-1 inline-block'>
                      Go to Settings →
                    </Link>
                  )}
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${stats.totalProducts > 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {stats.totalProducts > 0 ? '✓' : '3'}
                </div>
                <div>
                  <p className='font-medium text-sm'>Add Your First Product</p>
                  <p className='text-xs text-muted-foreground'>Create your first product listing</p>
                  {stats.totalProducts === 0 && (
                    <Link href='/vendor/products/new' className='text-xs text-primary mt-1 inline-block'>
                      Create Product →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
