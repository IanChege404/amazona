import { auth } from '@/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default async function StripeSuccessPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='max-w-md w-full'>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground mb-4'>Please sign in to continue</p>
            <Link href='/sign-in'>
              <Button className='w-full'>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='bg-green-100 text-green-600 rounded-full p-3'>
              <CheckCircle2 className='w-8 h-8' />
            </div>
          </div>
          <CardTitle>Stripe Setup Complete</CardTitle>
          <CardDescription>
            Your Stripe Connect account has been configured successfully
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            You&rsquo;re now ready to accept payments from customers. Your earnings will be transferred
            to your Stripe account monthly.
          </p>
          <div className='space-y-2'>
            <Link href='/vendor/settings' className='block'>
              <Button variant='outline' className='w-full'>
                Back to Settings
              </Button>
            </Link>
            <Link href='/vendor/dashboard' className='block'>
              <Button className='w-full'>Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
