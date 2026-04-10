import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Vendor Payouts',
}

export default async function VendorPayoutsPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Payouts</h1>
        <p className='text-muted-foreground'>Manage your payment history and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Earnings</CardTitle>
          <CardDescription>Lifetime and current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Lifetime Earnings</p>
              <p className='text-3xl font-bold'>$0.00</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>This Month</p>
              <p className='text-3xl font-bold'>$0.00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>No payouts yet</CardDescription>
        </CardHeader>
        <CardContent className='text-center py-12'>
          <p className='text-muted-foreground'>
            Once you make sales, payouts will be processed monthly
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
