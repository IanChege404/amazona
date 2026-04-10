'use server'

import { Resend } from 'resend'
import { OrderConfirmationCustomerEmail } from '@/emails/order-confirmation-customer'
import { OrderConfirmationVendorEmail } from '@/emails/order-confirmation-vendor'
import { PaymentReceivedEmail } from '@/emails/payment-received'
import { OrderDeliveryEmail } from '@/emails/order-delivery'
import { LowStockAlertEmail } from '@/emails/low-stock-alert'
import { PayoutProcessedEmail } from '@/emails/payout-processed'

if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('RESEND_API_KEY not configured. Email sending will not be available.')
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build_time')
const fromEmail = process.env.EMAIL_FROM || 'noreply@amazona.com'

export async function sendOrderConfirmationToCustomer({
  email,
  orderNumber,
  customerName,
  totalPrice,
  itemCount,
  estimatedDelivery,
  orderUrl,
}: {
  email: string
  orderNumber: string
  customerName: string
  totalPrice: number
  itemCount: number
  estimatedDelivery: string
  orderUrl: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(
        '[EMAIL] Resend not configured, skipping customer confirmation email'
      )
      return { success: true, message: 'Email service not configured' }
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Order Confirmed! Your Order #${orderNumber}`,
      react: (
        <OrderConfirmationCustomerEmail
          orderNumber={orderNumber}
          customerName={customerName}
          totalPrice={totalPrice}
          itemCount={itemCount}
          estimatedDelivery={estimatedDelivery}
          orderUrl={orderUrl}
        />
      ),
    })

    if (result.error) {
      console.error('Failed to send customer confirmation email:', result.error)
      return { success: false, message: result.error.message }
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Error sending customer confirmation email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export async function sendOrderConfirmationToVendor({
  email,
  vendorName,
  orderNumber,
  customerName,
  itemCount,
  totalAmount,
  vendorRevenue,
  orderUrl,
}: {
  email: string
  vendorName: string
  orderNumber: string
  customerName: string
  itemCount: number
  totalAmount: number
  vendorRevenue: number
  orderUrl: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(
        '[EMAIL] Resend not configured, skipping vendor confirmation email'
      )
      return { success: true, message: 'Email service not configured' }
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `New Order Received! #${orderNumber} from ${customerName}`,
      react: (
        <OrderConfirmationVendorEmail
          vendorName={vendorName}
          orderNumber={orderNumber}
          customerName={customerName}
          itemCount={itemCount}
          totalAmount={totalAmount}
          vendorRevenue={vendorRevenue}
          orderUrl={orderUrl}
        />
      ),
    })

    if (result.error) {
      console.error('Failed to send vendor confirmation email:', result.error)
      return { success: false, message: result.error.message }
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Error sending vendor confirmation email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export async function sendPaymentReceivedEmail({
  email,
  customerName,
  orderNumber,
  amount,
  paymentMethod,
  transactionId,
  orderUrl,
}: {
  email: string
  customerName: string
  orderNumber: string
  amount: number
  paymentMethod: string
  transactionId: string
  orderUrl: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Resend not configured, skipping payment email')
      return { success: true, message: 'Email service not configured' }
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Payment Confirmed for Order #${orderNumber}`,
      react: (
        <PaymentReceivedEmail
          customerName={customerName}
          orderNumber={orderNumber}
          amount={amount}
          paymentMethod={paymentMethod}
          transactionId={transactionId}
          orderUrl={orderUrl}
        />
      ),
    })

    if (result.error) {
      console.error('Failed to send payment email:', result.error)
      return { success: false, message: result.error.message }
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Error sending payment email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export async function sendOrderDeliveryEmail({
  email,
  customerName,
  orderNumber,
  itemCount,
  orderUrl,
  reviewUrl,
}: {
  email: string
  customerName: string
  orderNumber: string
  itemCount: number
  orderUrl: string
  reviewUrl: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Resend not configured, skipping delivery email')
      return { success: true, message: 'Email service not configured' }
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your Order #${orderNumber} Has Been Delivered! 📦`,
      react: (
        <OrderDeliveryEmail
          customerName={customerName}
          orderNumber={orderNumber}
          itemCount={itemCount}
          orderUrl={orderUrl}
          reviewUrl={reviewUrl}
        />
      ),
    })

    if (result.error) {
      console.error('Failed to send delivery email:', result.error)
      return { success: false, message: result.error.message }
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Error sending delivery email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export async function sendLowStockAlertEmail({
  email,
  vendorName,
  productName,
  currentStock,
  lowStockThreshold,
  productId,
  dashboardUrl,
}: {
  email: string
  vendorName: string
  productName: string
  currentStock: number
  lowStockThreshold: number
  productId: string
  dashboardUrl: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Resend not configured, skipping low stock alert')
      return { success: true, message: 'Email service not configured' }
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `⚠ Low Stock Alert: ${productName}`,
      react: (
        <LowStockAlertEmail
          vendorName={vendorName}
          productName={productName}
          currentStock={currentStock}
          lowStockThreshold={lowStockThreshold}
          productId={productId}
          dashboardUrl={dashboardUrl}
        />
      ),
    })

    if (result.error) {
      console.error('Failed to send low stock alert:', result.error)
      return { success: false, message: result.error.message }
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Error sending low stock alert:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export async function sendPayoutProcessedEmail({
  email,
  vendorName,
  payoutAmount,
  payoutDate,
  bankAccount,
  transferId,
  dashboardUrl,
}: {
  email: string
  vendorName: string
  payoutAmount: number
  payoutDate: string
  bankAccount: string
  transferId: string
  dashboardUrl: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Resend not configured, skipping payout email')
      return { success: true, message: 'Email service not configured' }
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Payout Processed - ${vendorName}`,
      react: (
        <PayoutProcessedEmail
          vendorName={vendorName}
          payoutAmount={payoutAmount}
          payoutDate={payoutDate}
          bankAccount={bankAccount}
          transferId={transferId}
          dashboardUrl={dashboardUrl}
        />
      ),
    })

    if (result.error) {
      console.error('Failed to send payout email:', result.error)
      return { success: false, message: result.error.message }
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Error sending payout email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}
