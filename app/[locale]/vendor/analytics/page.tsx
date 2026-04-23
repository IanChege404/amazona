'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSettingStore from '@/hooks/use-setting-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import {
  getVendorAnalytics,
  getVendorRevenueTrend,
  getVendorTopProducts,
  getVendorCategoryBreakdown,
  getVendorOrderStats,
} from '@/lib/actions/vendor-analytics.actions'
import { getVendorByUserId } from '@/lib/actions/vendor.actions'
import {
  RevenueTrendChart,
  TopProductsChart,
  CategoryBreakdownChart,
  OrderStatusDistribution,
} from '@/components/vendor/analytics-charts'
import { Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative'
}

interface Metrics {
  totalRevenue: number
  totalOrders: number
  totalItemsSold: number
  avgOrderValue: number
  conversionMetric: number
}

interface RevenueTrend {
  date: string
  revenue: number
  orders: number
}

interface TopProduct {
  name: string
  revenue: number
  quantity: number
  image?: string
}

interface CategoryBreakdown {
  category: string
  revenue: number
  quantity: number
  percentage: number
}

interface OrderStats {
  total: number
  paid: number
  delivered: number
  pending: number
  paidRate: number
  deliveryRate: number
}

function MetricCard({ icon, label, value, change, changeType }: MetricCardProps) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>{label}</p>
            <p className='text-2xl font-bold mt-2'>{value}</p>
            {change && (
              <p
                className={`text-sm mt-2 ${
                  changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {changeType === 'positive' ? '↑' : '↓'} {change}
              </p>
            )}
          </div>
          <div className='p-3 bg-blue-50 rounded-lg text-blue-600'>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple date range picker component
function SimpleDateRangePicker({
  onChange,
}: {
  onChange: (range: { from: Date; to: Date }) => void
}) {
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        onClick={() =>
          onChange({
            from: subDays(new Date(), 7),
            to: new Date(),
          })
        }
      >
        Last 7 days
      </Button>
      <Button
        variant='outline'
        onClick={() =>
          onChange({
            from: subDays(new Date(), 30),
            to: new Date(),
          })
        }
      >
        Last 30 days
      </Button>
      <Button
        variant='outline'
        onClick={() =>
          onChange({
            from: subDays(new Date(), 90),
            to: new Date(),
          })
        }
      >
        Last 90 days
      </Button>
    </div>
  )
}

export default function VendorAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    setting: { currency, defaultCurrency },
  } = useSettingStore()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)

  // Load vendor and analytics data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      const loadData = async () => {
        try {
          // Get vendor ID
          const userId = session.user?.id ?? ''
          if (!userId) return
          const vendorResult = await getVendorByUserId(userId)
          if (!vendorResult.success || !vendorResult.data) {
            toast({
              title: 'Error',
              description: 'Vendor not found',
              variant: 'destructive',
            })
            return
          }

          const vId = vendorResult.data._id as string

          // Fetch all analytics data in parallel
          const [metricsRes, trendRes, productsRes, categoryRes, statsRes] =
            await Promise.all([
              getVendorAnalytics(vId, dateRange),
              getVendorRevenueTrend(vId, dateRange),
              getVendorTopProducts(vId, dateRange),
              getVendorCategoryBreakdown(vId, dateRange),
              getVendorOrderStats(vId, dateRange),
            ])

          if (metricsRes.success && metricsRes.data) setMetrics(metricsRes.data as Metrics)
          if (trendRes.success && trendRes.data) setRevenueTrend(trendRes.data as RevenueTrend[])
          if (productsRes.success && productsRes.data) setTopProducts(productsRes.data as TopProduct[])
          if (categoryRes.success && categoryRes.data) setCategoryBreakdown(categoryRes.data as CategoryBreakdown[])
          if (statsRes.success && statsRes.data) setOrderStats(statsRes.data as OrderStats)

          setIsLoading(false)
        } catch {
          toast({
            title: 'Error',
            description: 'Failed to load analytics',
            variant: 'destructive',
          })
          setIsLoading(false)
        }
      }

      loadData()
    }
  }, [status, session, dateRange, router])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  const orderStatusData = orderStats
    ? [
        { status: 'Pending', count: orderStats.pending },
        { status: 'Paid', count: orderStats.paid },
        { status: 'Delivered', count: orderStats.delivered },
      ]
    : []
  const activeCurrency = currency || defaultCurrency

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Analytics Dashboard</h1>
          <p className='text-gray-600 mt-2'>Track your sales and performance metrics</p>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center gap-4'>
            <Calendar className='h-5 w-5 text-gray-400' />
            <SimpleDateRangePicker
              onChange={(range) => setDateRange(range)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <MetricCard
          icon={<DollarSign className='w-6 h-6' />}
          label='Total Revenue'
          value={
            metrics
              ? formatCurrency(metrics.totalRevenue, activeCurrency)
              : formatCurrency(0, activeCurrency)
          }
          changeType='positive'
          change={`${metrics?.conversionMetric || 0}% conversion`}
        />
        <MetricCard
          icon={<ShoppingCart className='w-6 h-6' />}
          label='Total Orders'
          value={metrics?.totalOrders || 0}
          changeType='positive'
          change={`${metrics?.totalItemsSold || 0} items sold`}
        />
        <MetricCard
          icon={<TrendingUp className='w-6 h-6' />}
          label='Average Order Value'
          value={
            metrics
              ? formatCurrency(metrics.avgOrderValue, activeCurrency)
              : formatCurrency(0, activeCurrency)
          }
        />
        <MetricCard
          icon={<DollarSign className='w-6 h-6' />}
          label='Delivery Rate'
          value={orderStats ? `${orderStats.deliveryRate}%` : '0%'}
          changeType='positive'
          change={`${orderStats?.delivered || 0} delivered`}
        />
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <RevenueTrendChart data={revenueTrend} isLoading={false} />
        <OrderStatusDistribution data={orderStatusData} isLoading={false} />
      </div>

      <div className='grid grid-cols-1 gap-6'>
        <TopProductsChart data={topProducts} isLoading={false} />
        <CategoryBreakdownChart data={categoryBreakdown} isLoading={false} />
      </div>

      {/* Order Stats Summary */}
      {orderStats && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-blue-600'>
                  {orderStats.total}
                </p>
                <p className='text-sm text-gray-600 mt-1'>Total Orders</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-green-600'>
                  {orderStats.paid}
                </p>
                <p className='text-sm text-gray-600 mt-1'>Paid ({orderStats.paidRate}%)</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-purple-600'>
                  {orderStats.pending}
                </p>
                <p className='text-sm text-gray-600 mt-1'>Pending</p>
              </div>
              <div className='text-center'>
                <p className='text-2xl font-bold text-orange-600'>
                  {orderStats.delivered}
                </p>
                <p className='text-sm text-gray-600 mt-1'>
                  Delivered ({orderStats.deliveryRate}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
