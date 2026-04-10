# Week 16: Sentry & Rate Limiting Configuration

## Required Packages
```bash
npm install @sentry/nextjs @sentry/tracing
npm install @upstash/ratelimit @upstash/redis
```

## Environment Variables

Add to `.env.local`:

```env
# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
NEXT_PUBLIC_APP_VERSION=1.0.0

# Upstash Redis Rate Limiting
UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Getting Started

### 1. Sentry Setup
1. Create account at https://sentry.io
2. Create a new Next.js project
3. Copy your DSN from project settings
4. Generate auth token in organization settings
5. Add to `.env.local`

### 2. Upstash Setup
1. Create account at https://upstash.com
2. Create a new Redis database (Select "Global" for lower latency)
3. Copy REST URL and token
4. Add to `.env.local`

### 3. Initialize Monitoring

In your `app/layout.tsx`, add:

```typescript
import { initializeMonitoring } from '@/lib/monitoring'

// For server-side initialization
void initializeMonitoring()
```

### 4. Use Rate Limiting in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const POST = withApiHandler(
  async (request: NextRequest) => {
    // Your handler code
    return NextResponse.json({ success: true })
  },
  { rateLimit: 'api.default' }
)
```

### 5. Use Error Boundaries

The `ErrorBoundary` component in `components/shared/error-boundary.tsx` is already configured to:
- Catch unhandled errors from parts of your app
- Log errors to Sentry automatically
- Display user-friendly error messages
- Show debug info in development

## Rate Limit Configurations

Available rate limit keys:
- `api.default` - 100 req/min
- `api.auth` - 10 req/min (auth endpoints)
- `api.search` - 30 req/min
- `api.review` - 5 req/min
- `api.order` - 20 req/min
- `api.upload` - 5 req/5 min
- `user.login` - 5 attempts per 5 min
- `user.register` - 3 per hour
- `user.password-reset` - 3 per hour
- `user.review` - 10 per day
- `vendor.product-update` - 50 per hour
- `vendor.bulk-upload` - 3 per hour

## Monitoring Dashboard

Access system health at:
- `/api/system/health` - Current uptime and error rates
- `/api/system/errors?limit=10` - Recent errors
- `/api/system/performance` - Response time percentiles
- `/api/system/rate-limit-status` - Current rate limit usage

## Features Implemented

✅ **Sentry Integration**
- Error tracking with automatic capture
- Performance monitoring with transaction tracing
- Session replay for debugging
- User context tracking
- Breadcrumb logging for user actions

✅ **Rate Limiting**
- Sliding window algorithm via Upstash Redis
- Multiple rate limit configurations
- Per-IP and per-user limiting
- Graceful fallback if Redis unavailable
- Rate limit headers in API responses

✅ **Error Boundaries**
- Client-side error UI component
- User-friendly error messages
- Development debug info
- Not found page handling
- Loading state component

✅ **API Handler Wrapper**
- Automatic rate limiting
- Error capturing and logging
- Request/response monitoring
- Pagination helper functions
- Client IP extraction

✅ **Monitoring System**
- Health check endpoint
- Error tracking API
- Performance metrics API
- Real-time monitoring dashboard components
