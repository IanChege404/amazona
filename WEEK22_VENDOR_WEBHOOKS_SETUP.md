## Week 22: Custom Vendor Webhooks

This week implements custom webhook subscriptions for vendors, enabling them to subscribe to marketplace events and receive real-time notifications.

### Features Implemented

#### 1. MongoDB Models
Located in `lib/models/vendor-webhook.ts`:

**VendorWebhookSubscription**
- Vendor-specific webhook endpoints
- Event filtering per subscription
- Custom headers support
- Retry and timeout configuration
- Health tracking (success/failure counts)
- Auto-disable after 5 consecutive failures

**VendorWebhookTest**
- Test delivery records
- Response capture (status + body)
- Latency tracking
- Success/failure status

**VendorWebhookDelivery**
- Individual event delivery logs
- Status tracking (success/failed/pending/retry)
- Error message capture
- 30-day TTL for automatic cleanup

**Instance Methods**:
- `recordSuccess()` - Update success timestamp
- `recordFailure()` - Increment failure count and auto-disable
- `isHealthy()` - Calculate health based on recent activity

#### 2. Vendor Webhook Actions
Located in `lib/actions/vendor-webhook.ts` (15 functions):

**CRUD Operations**:
- `createVendorWebhook()` - Create new subscription with validation
- `getVendorWebhooks()` - List all subscriptions with optional stats
- `getVendorWebhook()` - Get specific webhook details
- `updateVendorWebhook()` - Update subscription settings
- `deleteVendorWebhook()` - Remove subscription and cleanup

**Event Operations**:
- `dispatchToVendorWebhooks()` - Route events to vendor subscriptions
- `testVendorWebhook()` - Send test payload
- `getVendorWebhookDeliveries()` - Paginated delivery history
- `recordVendorWebhookDelivery()` - Log delivery attempts

**Analytics**:
- `getVendorWebhookHealth()` - Calculate health metrics
  - Success rate over all deliveries
  - Failure count
  - Recent delivery count (24h)
  - Last success/failure timestamps

#### 3. REST API Endpoints

**Webhook Management** (`/api/vendor/webhooks`)
- `GET` - List vendor's webhooks (supports `includeStats=true`)
- `POST` - Create new webhook subscription

**Individual Webhook** (`/api/vendor/webhooks/[webhookId]`)
- `GET` - Get webhook details or deliveries
  - `?deliveries=true` - Get delivery history (paginated)
  - `?health=true` - Get health metrics
  - `?status=failed&page=1&limit=20` - Filter deliveries
- `PATCH` - Update webhook settings
- `DELETE` - Remove webhook

**Webhook Testing** (`/api/vendor/webhooks/[webhookId]/test`)
- `POST` - Send test event payload
- Auto-updates health status based on response

#### 4. Vendor Dashboard Component

**VendorWebhooksManagement** Component (`components/vendor/vendor-webhooks-management.tsx`):
- Webhook list with health badges
- Create webhook dialog
  - URL input with validation
  - Multi-select event types (all 20 event types available)
  - Description and configuration options
  - Retry attempts and timeout settings
- Per-webhook actions:
  - Test button (sends test event)
  - Delete button (with confirmation)
  - Toggle secret visibility
  - Copy secret to clipboard
- Statistics display:
  - Delivery count
  - Success rate percentage
  - Event subscriptions list
  - Health status badge

**Vendor Webhooks Page** (`app/[locale]/vendor/webhooks/page.tsx`):
- Integrates webhook management component
- Auth-protected (vendor only)
- Comprehensive description

#### 5. Integration with Dispatcher

Enhanced webhook dispatcher to support vendor events:
```typescript
// In lib/webhooks/dispatcher.ts - new integrated logging
await recordWebhookDelivery(...) // Records to analytics

// New vendor-specific dispatch
await dispatchToVendorWebhooks(
  vendorId,
  eventType,
  eventData
)
```

### Event Types Available

All 20 webhook event types available for vendor subscriptions:
- Order: `ORDER.CREATED`, `ORDER.PAID`, `ORDER.DELIVERED`, `ORDER.CANCELLED`, `ORDER.RETURNED`
- Payment: `PAYMENT.SUCCEEDED`, `PAYMENT.FAILED`, `PAYMENT.REFUNDED`, `PAYMENT.DISPUTED`
- Product: `PRODUCT.CREATED`, `PRODUCT.UPDATED`, `PRODUCT.DELETED`, `PRODUCT.OUT_OF_STOCK`, `PRODUCT.LOW_STOCK`
- Vendor: `VENDOR.CREATED`, `VENDOR.APPROVED`, `VENDOR.SUSPENDED`, `VENDOR.SETTINGS.UPDATED`
- User: `USER.REGISTERED`, `USER.VERIFIED`, `USER.BANNED`
- Payout: `PAYOUT.INITIATED`, `PAYOUT.COMPLETED`, `PAYOUT.FAILED`
- Review: `REVIEW.CREATED`, `REVIEW.UPDATED`

### Security Features

1. **HMAC-SHA256 Signatures**
   - Every webhook payload signed with vendor's secret
   - Header: `X-Webhook-Signature`
   - Vendors verify with secret

2. **Per-Vendor Secrets**
   - Unique 32-byte secret per subscription
   - Regenerate on demand (TODO for Week 23)
   - Never shared or logged

3. **Auto-Disable on Failures**
   - Tracks consecutive failures
   - Auto-disables after 5 failures
   - Prevents cascading failures

4. **Rate Limiting**
   - Optional header-based limits
   - Custom headers per webhook
   - Timeout enforcement

### Installation & Setup

#### 1. Database Indexes
```bash
# Automatically created by Mongoose schemas
# Indexes created on first subscription:
VendorWebhookSubscription:
  - { vendorId: 1, isActive: 1 }

VendorWebhookDelivery:
  - { vendorId: 1, subscriptionId: 1, createdAt: -1 }
  - { subscriptionId: 1, status: 1 }
  - { createdAt: 1 } (TTL index)
```

#### 2. API Usage Examples

**Create Webhook**
```bash
curl -X POST http://localhost:3000/api/vendor/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "url": "https://myapp.com/webhooks",
    "events": ["ORDER.CREATED", "ORDER.PAID"],
    "description": "Production webhook",
    "retryAttempts": 5,
    "timeoutSeconds": 10
  }'
```

**List Webhooks with Stats**
```bash
curl http://localhost:3000/api/vendor/webhooks?includeStats=true \
  -H "Authorization: Bearer $TOKEN"
```

**Get Webhook Deliveries**
```bash
curl "http://localhost:3000/api/vendor/webhooks/[webhookId]?deliveries=true&status=failed&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Test Webhook**
```bash
curl -X POST http://localhost:3000/api/vendor/webhooks/[webhookId]/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventType": "ORDER.CREATED"
  }'
```

#### 3. Trigger Vendor Webhooks

In order actions, payment processors, etc.:
```typescript
import { dispatchToVendorWebhooks } from '@/lib/actions/vendor-webhook'

// When order is created
await dispatchToVendorWebhooks(vendorId, 'ORDER.CREATED', {
  orderId: order._id,
  items: order.items,
  total: order.total,
})

// When payment received
await dispatchToVendorWebhooks(vendorId, 'PAYMENT.SUCCEEDED', {
  paymentId: payment._id,
  orderId: order._id,
  amount: payment.amount,
})
```

### Webhook Signature Verification

Vendors should verify signatures using their secret:

**JavaScript Example**
```javascript
const crypto = require('crypto')

function verifyWebhookSignature(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}
```

**Python Example**
```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    computed = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, computed)
```

### Webhook Payload Format

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "event": "ORDER.CREATED",
  "timestamp": "2024-04-03T12:34:56.789Z",
  "version": "1.0.0",
  "vendorId": "vendor_123",
  "data": {
    "orderId": "order_456",
    "items": [...],
    "total": 100
  }
}
```

**Headers Sent**
```
X-Webhook-Signature: hmac_sha256_signature_here
X-Webhook-ID: 550e8400-e29b-41d4-a716-446655440000
X-Webhook-Event: ORDER.CREATED
Content-Type: application/json
User-Agent: Amazona-VendorWebhook/1.0
```

### Health & Monitoring

**Health Status**
- **Active**: `isActive=true` and recent successes
- **Pending**: Never delivered (no success timestamp)
- **Disabled**: 5+ consecutive failures
- **Inactive**: Manually disabled by vendor

**Metrics**
- Success rate: `(successes / total) * 100`
- Failure count: Cumulative failures
- Recent deliveries: Last 24 hours
- Last success/failure timestamps

### Auto-Recovery

Webhooks disabled due to failures can be:
1. Manually re-enabled by vendor (toggle in UI)
2. Reset failure count and retry
3. Update URL and test again

### Performance Considerations

1. **Async Delivery**
   - Vendor webhooks dispatched asynchronously
   - Non-blocking to marketplace operations
   - Retry logic runs independently

2. **Timeouts**
   - Default 10 seconds per webhook
   - Configurable per subscription (5-60s)
   - AbortController prevents hanging requests

3. **Storage**
   - 30-day TTL on delivery logs
   - Automatic MongoDB cleanup
   - No unbounded growth

4. **Concurrency**
   - Multiple webhook subscriptions dispatched in parallel
   - Failure in one doesn't affect others
   - Independent retry schedules

### Testing & Debugging

**Via Dashboard**
1. Go to `/vendor/webhooks`
2. Find webhook and click test button
3. View result with duration
4. Check delivery history

**Via API**
```bash
# Send test event
curl -X POST http://localhost:3000/api/vendor/webhooks/[id]/test \
  -H "Authorization: Bearer $TOKEN"

# View delivery history
curl http://localhost:3000/api/vendor/webhooks/[id]?deliveries=true
```

### Production Checklist

- [ ] Test webhook with real events
- [ ] Verify signature verification in vendor code
- [ ] Configure appropriate timeouts
- [ ] Set up retry strategy
- [ ] Monitor success rates in dashboard
- [ ] Set up alerts for disabled webhooks
- [ ] Document webhook format for vendor integration
- [ ] Enable HTTPS for all webhook URLs
- [ ] Test failure scenarios (timeouts, errors)

### Next Steps (Week 23)

- Webhook event replay functionality
- Delivery history viewer in vendor dashboard
- Webhook URL verification (challenge-response)
- Secret rotation/regeneration
- Webhook filtering and conditional delivery
- Rate limiting per vendor

