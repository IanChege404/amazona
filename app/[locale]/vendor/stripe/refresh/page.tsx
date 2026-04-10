import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Vendor from '@/lib/db/models/vendor.model'
import { redirect } from 'next/navigation'

export default async function StripeRefreshPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return redirect('/sign-in?callbackUrl=/vendor/stripe/refresh')
  }

  await connectToDatabase()

  const vendor = await Vendor.findOne({ userId: session.user.id })

  if (!vendor?.stripeAccountId) {
    return redirect('/vendor/settings')
  }

  // In a real app, you'd call the Stripe API here to check status
  // and update the database if needed
  // For now, we just redirect back to settings

  return redirect('/vendor/settings')
}
