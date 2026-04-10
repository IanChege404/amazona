import { Resend } from 'resend'
import PurchaseReceiptEmail from './purchase-receipt'
import { IOrder } from '@/lib/db/models/order.model'
import AskReviewOrderItemsEmail from './ask-review-order-items'
import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'
import VendorApprovedEmail from './vendor-approved'
import VendorApplicationReceivedEmail from './vendor-application-received'
import { IVendor } from '@/lib/db/models/vendor.model'

if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('RESEND_API_KEY not configured. Email sending will not be available.')
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build_time')

export const sendPurchaseReceipt = async ({ order }: { order: IOrder }) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: 'Order Confirmation',
    react: <PurchaseReceiptEmail order={order} />,
  })
}

export const sendAskReviewOrderItems = async ({ order }: { order: IOrder }) => {
  const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: 'Review your order items',
    react: <AskReviewOrderItemsEmail order={order} />,
    scheduledAt: oneDayFromNow,
  })
}

export const sendVendorApprovedEmail = async ({
  vendor,
  vendorName,
}: {
  vendor: IVendor
  vendorName: string
}) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: vendor.email,
    subject: 'Welcome to the Marketplace - Your Vendor Account is Approved! 🎉',
    react: (
      <VendorApprovedEmail
        vendorName={vendorName}
        businessName={vendor.businessName}
        loginUrl={`${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard`}
      />
    ),
  })
}

export const sendVendorApplicationReceivedEmail = async ({
  vendor,
  vendorName,
  adminEmail,
}: {
  vendor: IVendor
  vendorName: string
  adminEmail: string
}) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: adminEmail,
    subject: `New Vendor Application: ${vendor.businessName}`,
    react: (
      <VendorApplicationReceivedEmail
        vendorName={vendorName}
        businessName={vendor.businessName}
        email={vendor.email}
        adminUrl={`${process.env.NEXT_PUBLIC_APP_URL}/admin/vendors`}
      />
    ),
  })
}
