# Week 19-20: Webhooks & Event System

## Overview

Complete webhook infrastructure for handling payment events, order updates, and third-party integrations. Supports Stripe Connect, internal events, and extensible for other providers.

## Implementation

### Core Components

#### 1. **Webhook Types & Models** (`lib/webhooks/types.ts`)
- 20+ event types (orders, payments, products, vendors, users, payouts, reviews)
- Webhook payload structure with retry tracking
- Webhook subscription model
- Delivery log tracking
- Type-safe data builders for each event

#### 2. **Webhook Dispatcher** (`lib/webhooks/dispatcher.ts`)
- Event creation and serialization
- HMAC-SHA256 signature generation for security
- Webhook delivery with retry mechanism
- Configurable retry intervals (1min → 24hrs)
- Delivery statistics calculation
- Graceful error handling

#### 3. **Stripe Handler** (`lib/webhooks/stripe-handler.ts`)
Handles all Stripe events:
- `payment_intent.succeeded` - Order paid
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Customer refund
- `charge.dispute.created` - Chargeback/dispute
- `payout.paid` - Vendor payout completed
- `payout.failed` - Payout failure
- `account.updated` - Vendor account changes

#### 4. **Event Triggers** (`lib/webhooks/triggers.ts`)
Internal event dispatchers:
- `triggerOrderCreated()` - New order
- `triggerOrderPaid()` - Payment received
- `triggerOrderDelivered()` - Delivery confirmed
- `triggerProductCreated()` - New product from vendor
- `triggerLowStockAlert()` - Inventory warning
- `triggerVendorApproved()` - Account approved
- `triggerUserRegistered()` - New user
- `triggerReviewCreated()` - Product review

#### 5. **API Endpoint** (`app/api/webhooks/stripe/route.ts`)
- Signature verification for security
- Event type routing
- Error handling and logging
- Sentry integration for monitoring

#### 6. **Webhook Tester Component** (`components/admin/webhook-tester.tsx`)
- UI for testing webhook delivery
- Event type selector
- URL input
- Response visualization
- Webhook logs viewer

## Setup Instructions

### Step 1: Environment Variables

Add to `.env.local`:

```env
# Stripe Webhooks
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_live_... (production)

# Optional: Other providers
RAZORPAY_WEBHOOK_SECRET=...
SHIPMENT_API_KEY=...
```

### Step 2: Stripe Dashboard Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → Webhooks
3. Add Endpoint with URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to receive:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `payout.paid`
   - `payout.failed`
   - `account.updated`
5. Copy the webhook signing secret
6. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 3: Integrate into Order Actions

Update `lib/actions/order.actions.ts`:

```typescript
import { triggerOrderCreated, triggerOrderPaid } from '@/lib/webhooks/triggers'

export async function createOrder(data: CreateOrderInput) {
  // ... existing code ...
  
  const order = await Order.create(orderData)
  
  // Trigger webhook
  await triggerOrderCreated(order)
  
  return order
}

export async function updateOrderToPaid(orderId: string) {
  // ... existing code ...
  
  const order = await Order.findByIdAndUpdate(orderId, { paid: true })
  const payment = { ...paymentData }
  
  // Trigger webhook
  await triggerOrderPaid(order, payment)
  
  return order
}
```

### Step 4: Test Webhook Delivery

#### Using Stripe CLI (Recommended)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward Stripe events to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Get webhook signing secret from CLI output
# Add to .env.local as STRIPE_WEBHOOK_SECRET

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded
```

#### Using Admin Dashboard

1. Go to admin panel → Webhooks
2. Use "Webhook Tester" component
3. Select event type
4. Enter webhook URL (use ngrok for local testing)
5. Click "Send Test Webhook"

#### Using ngrok for Local Testing

```bash
# Install ngrok: https://ngrok.com/
# Start ngrok tunnel
ngrok http 3000

# Use ngrok URL for Stripe webhook endpoint
# https://xxxx-xx-xxx-xxx-xx.ngrok.io/api/webhooks/stripe
```

## Event Types

### Order Events
- `order.created` - New order placed
- `order.paid` - Payment received
- `order.delivered` - Order shipped/delivered
- `order.cancelled` - Order cancelled
- `order.returned` - Return requested

### Payment Events
- `payment.succeeded` - Payment successful
- `payment.failed` - Payment declined
- `payment.refunded` - Refund processed
- `payment.disputed` - Chargeback filed

### Product Events
- `product.created` - Vendor created product
- `product.updated` - Product details changed
- `product.deleted` - Product removed
- `product.out_of_stock` - No inventory
- `product.low_stock` - Below threshold

### Vendor Events
- `vendor.created` - Vendor account created
- `vendor.approved` - Vendor approved
- `vendor.suspended` - Account suspended
- `vendor.settings_updated` - Info changed

### User Events
- `user.registered` - New account
- `user.verified` - Email verified
- `user.banned` - Account banned

### Payout Events
- `payout.initiated` - Payout requested
- `payout.completed` - Transfer successful
- `payout.failed` - Transfer failed

## Webhook Payload Examples

### Order Created
```json
{
  "id": "evt_123abc",
  "event": "order.created",
  "timestamp": "2024-04-03T10:30:00Z",
  "data": {
    "orderId": "ord_xyz",
    "customerId": "cust_456",
    "vendorId": "vend_789",
    "totalAmount": 9999,
    "status": "pending"
  }
}
```

### Payment Succeeded
```json
{
  "id": "evt_456def",
  "event": "payment.succeeded",
  "timestamp": "2024-04-03T10:31:00Z",
  "data": {
    "paymentIntentId": "pi_1234567890",
    "orderId": "ord_xyz",
    "vendorId": "vend_789",
    "amount": 9999,
    "currency": "usd",
    "chargeId": "ch_1234567890"
  }
}
```

### Product Low Stock
```json
{
  "id": "evt_789ghi",
  "event": "product.low_stock",
  "timestamp": "2024-04-03T14:00:00Z",
  "data": {
    "productId": "prod_123",
    "vendorId": "vend_789",
    "name": "Premium Widget",
    "currentStock": 5,
    "lowStockThreshold": 10
  }
}
```

## Webhook Signature Verification

All webhooks include HMAC-SHA256 signature for security:

```typescript
// Sender generates signature
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex')

// Receiver verifies
import { verifyWebhookSignature } from '@/lib/webhooks/dispatcher'

const isValid = verifyWebhookSignature(payloadString, signature, secret)
```

## Retry Logic

Automatic retries with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 1 minute later
- Attempt 3: 5 minutes later
- Attempt 4: 15 minutes later
- Attempt 5: 1 hour later
- Attempt 6: 24 hours later

After 6 attempts, webhook is marked as failed.

## Monitoring & Logging

### View Webhook Status

```typescript
// Get delivery logs
const logs = await WebhookDeliveryLog.find({ webhookSubscriptionId })

// Calculate statistics
import { calculateWebhookStats } from '@/lib/webhooks/dispatcher'
const stats = calculateWebhookStats(logs)

// {
//   total: 100,
//   succeeded: 95,
//   failed: 5,
//   successRate: 95,
//   averageDeliveryTime: 245  // ms
// }
```

### Admin Dashboard

View in admin panel:
- Webhook Tester (send test events)
- Webhook Logs (delivery history)
- Event Statistics (success/failure rates)
- Provider Status (Stripe, Razorpay, etc.)

## Error Handling

Webhook delivery failures are handled gracefully:

1. **Network Timeout**: Retry automatically
2. **HTTP 5xx**: Retry automatically
3. **HTTP 4xx**: Log error, don't retry
4. **Invalid Signature**: Log and reject
5. **Malformed Payload**: Log and acknowledge

## Best Practices

✅ **DO:**
- Verify webhook signatures
- Process webhooks idempotently
- Acknowledge receipt quickly (< 5s)
- Implement exponential backoff
- Log all events for debugging
- Monitor delivery rates
- Use webhook testing tools

❌ **DON'T:**
- Trust unverified signatures
- Block on external APIs in webhook handler
- Assume event order
- Process same event twice
- Hardcode webhook URLs
- Expose webhook secrets

## Testing Checklist

- [ ] Stripe CLI webhook forwarding working
- [ ] Local webhook endpoint responding
- [ ] Signature verification passing
- [ ] Event handlers executing correctly
- [ ] Database updates reflected
- [ ] Emails being sent
- [ ] Sentry errors logging
- [ ] Admin dashboard showing logs
- [ ] Retry logic working (simulate failures)
- [ ] Production webhook secret configured

## Production Deployment

1. **Register Webhook Endpoints**
   - Stripe: https://yourdomain.com/api/webhooks/stripe
   - Other providers as needed

2. **Enable Webhook Events**
   - Configure which events to receive
   - Use production webhook secrets

3. **Monitor Delivery**
   - Check webhook logs regularly
   - Alert on high failure rates
   - Review Sentry errors

4. **Scale as Needed**
   - Use message queue (Bull, RabbitMQ) for high volume
   - Process webhooks in background jobs
   - Implement webhook batch processing

## Troubleshooting

### Webhooks not being received

1. Check webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Ensure endpoint returns 2xx status
4. Check firewall/security groups
5. Verify provider webhook configuration

### Signature verification failing

1. Confirm webhook secret matches provider
2. Ensure raw request body is used (not parsed)
3. Check secret isn't accidentally truncated
4. Verify signature algorithm (SHA256)

### Events not being processed

1. Check event handlers are registered
2. Verify event type matches handler
3. Check database connections
4. Review Sentry error logs
5. Test with webhook tester component

## Next Steps (Week 21)

- Advanced analytics dashboard with webhook data
- Custom webhook subscriptions for vendors
- Webhook replay functionality
- Rate limiting per webhook
- Batch webhook processing
