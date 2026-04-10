import { auth } from '@/auth'
import { connectToDatabase } from '@/lib/db'
import Vendor from '@/lib/db/models/vendor.model'
import {
  createStripeConnectAccount,
  createAccountLink,
  getAccountDetails,
} from '@/lib/stripe/connect'

/**
 * POST /api/vendors/stripe/connect
 * Generate Stripe Connect onboarding URL for vendor
 */
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get vendor for this user
    const vendor = await Vendor.findOne({ userId: session.user.id })

    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 })
    }

    if (vendor.status !== 'approved') {
      return Response.json(
        { error: 'Your vendor account has not been approved yet' },
        { status: 403 }
      )
    }

    let stripeAccountId = vendor.stripeAccountId

    // Create new Stripe Connect account if not exists
    if (!stripeAccountId) {
      stripeAccountId = await createStripeConnectAccount(vendor.email)

      // Save to database
      vendor.stripeAccountId = stripeAccountId
      await vendor.save()
    }

    // Generate onboarding link
    const onboardingUrl = await createAccountLink(stripeAccountId)

    return Response.json({
      success: true,
      url: onboardingUrl,
      accountId: stripeAccountId,
    })
  } catch (error) {
    console.error('Stripe Connect error:', error)
    return Response.json(
      { error: 'Failed to initialize Stripe onboarding' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/vendors/stripe/connect/status
 * Check Stripe account status
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const vendor = await Vendor.findOne({ userId: session.user.id })

    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 })
    }

    if (!vendor.stripeAccountId) {
      return Response.json({
        success: true,
        status: 'not_started',
        isVerified: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      })
    }

    // Get account details
    const accountDetails = await getAccountDetails(vendor.stripeAccountId)

    return Response.json({
      success: true,
      status: accountDetails.is_verified ? 'verified' : 'pending',
      isVerified: accountDetails.is_verified,
      chargesEnabled: accountDetails.charges_enabled,
      payoutsEnabled: accountDetails.payouts_enabled,
      pastDueRequirements: accountDetails.requirements_past_due,
      currentlyDueRequirements: accountDetails.requirements_currently_due,
    })
  } catch (error) {
    console.error('Failed to check Stripe status:', error)
    return Response.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    )
  }
}
