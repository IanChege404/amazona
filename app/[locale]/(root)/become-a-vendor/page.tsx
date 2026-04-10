import { auth } from '@/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import VendorApplicationForm from './vendor-application-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Vendor',
  description: 'Join our marketplace as a vendor and start selling your products',
}

export default async function BecomeAVendorPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return redirect('/sign-in?callbackUrl=/become-a-vendor')
  }

  return (
    <div className='min-h-screen bg-background py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold mb-4'>Start Selling Today</h1>
          <p className='text-lg text-muted-foreground mb-2'>
            Join our growing community of vendors and reach millions of customers
          </p>
          <div className='flex justify-center gap-6 mt-8 text-sm'>
            <div className='flex flex-col items-center'>
              <div className='text-3xl font-bold text-primary mb-2'>10%</div>
              <p className='text-muted-foreground'>Platform Fee</p>
            </div>
            <div className='flex flex-col items-center'>
              <div className='text-3xl font-bold text-primary mb-2'>24/7</div>
              <p className='text-muted-foreground'>Support</p>
            </div>
            <div className='flex flex-col items-center'>
              <div className='text-3xl font-bold text-primary mb-2'>Global</div>
              <p className='text-muted-foreground'>Reach</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-12'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Easy Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Complete your vendor profile in just a few minutes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Powerful Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Manage products, orders, and analytics from one dashboard
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Competitive Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                Keep more of your earnings with industry-leading rates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card className='border-2'>
          <CardHeader>
            <CardTitle>Vendor Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply for a vendor account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VendorApplicationForm />
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className='mt-12 bg-muted p-8 rounded-lg'>
          <h2 className='text-2xl font-bold mb-6'>Frequently Asked Questions</h2>
          <div className='space-y-4'>
            <div>
              <h3 className='font-semibold mb-2'>How long does approval take?</h3>
              <p className='text-sm text-muted-foreground'>
                Most applications are reviewed and approved within 24-48 hours
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>When do I get paid?</h3>
              <p className='text-sm text-muted-foreground'>
                Payments are processed monthly via Stripe Connect after order fulfillment
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>What products can I sell?</h3>
              <p className='text-sm text-muted-foreground'>
                You can sell most products except restricted items (weapons, counterfeit goods, etc.)
              </p>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>Is there a setup fee?</h3>
              <p className='text-sm text-muted-foreground'>
                No! Starting is completely free. You only pay commission on sales
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
