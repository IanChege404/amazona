## Week 21: Advanced Webhook Analytics Dashboard

This week implements comprehensive webhook event tracking and analytics visualization for the admin dashboard.

### Features Implemented

#### 1. MongoDB Analytics Models
- **WebhookMetric**: Aggregated delivery statistics per event type
  - Track total events, success/failure counts, latency percentiles
  - TTL indexes for automatic cleanup (30 days)
  - Real-time metric updates

- **WebhookEventLog**: Detailed delivery attempt logs
  - Individual event delivery tracking
  - Status progression (pending → success/failed/retry)
  - Error messages and status codes
  - Retry attempt tracking
  - Signature verification records

- **WebhookTrend**: Daily trend data
  - Success rates by event type
  - Average latency trends
  - Event counts and failure rates
  - Useful for pattern analysis

#### 2. Analytics Collection System
Integrated into webhook dispatcher for automatic tracking:
- `recordWebhookDelivery()`: Log each delivery attempt
- `updateWebhookMetrics()`: Aggregate statistics
- `getWebhookSuccessRate()`: Calculate success percentage
- `getFailedWebhooks()`: Identify problematic deliveries
- `consolidateDailyTrends()`: Generate daily analytics

#### 3. REST API Endpoints
All secured with admin role verification:

**GET /api/analytics/webhooks/metrics**
- Query parameters: `startDate`, `endDate`
- Returns: Array of aggregated metrics by event type
- Calculated: latency percentiles (p95, p99), success rates

**GET /api/analytics/webhooks/logs**
- Query parameters: `eventType`, `status`, `subscriptionId`, `startDate`, `endDate`, `page`, `limit`
- Returns: Paginated event logs with filtering
- Total count for pagination

**GET /api/analytics/webhooks/stats**
- Query parameters: `hours` (default: 24)
- Returns: High-level statistics
  - Total events, successful/failed/pending counts
  - Average latency
  - Success rate percentage
  - List of recent failed webhooks

**GET /api/analytics/webhooks/trends**
- Query parameters: `eventType` (optional), `days` (default: 30)
- Returns: Daily trend data
- Useful for charting success rates and latency over time

#### 4. Admin Dashboard Components

**WebhookAnalyticsDashboard** (`webhook-analytics-dashboard.tsx`)
- 4-card overview grid:
  - Total Events (24h)
  - Success Rate (%)
  - Failed Events
  - Average Latency (ms)
- Pie chart: Delivery status distribution
- Failed webhooks alert (recent 5)
- Loading skeleton states
- Error handling with inline alerts

**WebhookTrendsChart** (`webhook-trends-chart.tsx`)
- Composed chart showing trends over time
- Dual Y-axis:
  - Left: Event count (bar chart)
  - Right: Success rate % and average latency (line charts)
- Filters:
  - Date range: 7d, 30d, 90d
  - Event type selection
- Real-time updates

**WebhookEventLogsViewer** (`webhook-event-logs-viewer.tsx`)
- Paginated table of webhook events
- Columns: Event Type, URL, Status, Status Code, Latency, Timestamp, Error
- Status badges: Success (green), Failed (red), Pending (gray), Retry (outline)
- Filters: Event type, Status, URL search
- Pagination controls
- Shows total count and current page

#### 5. Admin Dashboard Page
Located at: `/admin/webhook-analytics`
- Aggregates all components
- Responsive grid layout
- Full-page analytics overview

### Integration Points

#### Webhook Dispatcher Updates
```typescript
// exports enhanced deliverWebhook() with analytics logging
await recordWebhookDelivery(
  payload.id,          // Event ID
  payload.event,       // Event type
  subscriptionId,      // Subscription reference
  url,                 // Webhook URL
  status,              // 'success' | 'failed'
  duration,            // Delivery time in ms
  statusCode,          // HTTP status
  errorMessage,        // Error details
  retryAttempt,        // Current attempt number
  signature            // HMAC signature
)
```

#### Database Indexes
Optimized queries with compound indexes:
- WebhookEventLog: `{ eventType: 1, timestamp: -1 }`
- WebhookEventLog: `{ status: 1, timestamp: -1 }`
- WebhookTrend: `{ date: -1, eventType: 1 }`

#### TTL Cleanup
Both event logs and metrics have 30-day TTL:
- Automatic MongoDB cleanup
- Preserves storage efficiency
- Trend data retained for historical analysis

### Usage Examples

#### View Analytics Dashboard
```bash
# Navigate to admin panel
http://localhost:3000/admin/webhook-analytics
```

#### Query API Endpoints
```bash
# Get metrics for last 7 days
curl "http://localhost:3000/api/analytics/webhooks/metrics?startDate=$(date -d '7 days ago' +%Y-%m-%d)"

# Get failed webhooks
curl "http://localhost:3000/api/analytics/webhooks/stats?hours=24"

# Get trends by event type
curl "http://localhost:3000/api/analytics/webhooks/trends?eventType=ORDER.CREATED&days=30"

# Get paginated logs
curl "http://localhost:3000/api/analytics/webhooks/logs?status=failed&page=1&limit=20"
```

#### Schedule Daily Consolidation
Add to your cron job or background task:
```typescript
import { consolidateDailyTrends } from '@/lib/actions/webhook-analytics'

// Run daily at midnight
await consolidateDailyTrends()
```

### Key Features

1. **Real-Time Tracking**
   - Every webhook delivery recorded instantly
   - Latency tracking per attempt
   - Retry attempt counting

2. **Analytics Aggregation**
   - Automatic metric updates
   - Latency percentile calculation
   - Success rate computation

3. **Trend Analysis**
   - Daily consolidation for pattern detection
   - Event type breakdown
   - Failure rate tracking

4. **Performance Optimized**
   - Compound indexes for query speed
   - TTL for storage cleanup
   - Pagination for large datasets

5. **Admin Visibility**
   - 4-metric overview card
   - Visual charts (pie, line, bar)
   - Detailed log table with filtering
   - Failed webhook alerting

### Testing

1. **Manual Test**
   - Trigger webhook events
   - View metrics in admin dashboard
   - Check trends over 24+ hour period

2. **API Test**
   - Test each endpoint with curl/Postman
   - Verify pagination works
   - Check date range filtering

3. **Performance Test**
   - Monitor query times with large dataset
   - Test index efficiency
   - Verify TTL cleanup works

### Production Considerations

1. **MongoDB Indexing**
   - Verify indexes created: `db.webhookeventlogs.getIndexes()`
   - Monitor slow query logs
   - Adjust TTL if needed

2. **Data Volume**
   - High-traffic sites may generate 1000+ events/hour
   - TTL cleanup prevents unbounded storage growth
   - Consider archiving critical events separately

3. **Dashboard Caching**
   - Consider cache layer for metrics (Redis)
   - Reduce dashboard load times
   - Real-time updates via Pusher

4. **Alerting**
   - Monitor webhook success rate drops
   - Alert on repeated failures
   - Set thresholds for intervention

### Next Steps (Week 22)

- Custom vendor webhook subscriptions
- Webhook retry management UI
- Event filtering and search UI
- Webhook replay functionality

