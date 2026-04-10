# Subscription Tier Enforcement Implementation Guide

## Overview

Subscription tier enforcement is now fully wired into the system using a centralized enforcement module. This guide explains how it works and how to add enforcement to new features.

---

## Architecture

### Enforcement Module (`lib/subscription-enforcement.ts`)

Provides centralized access control functions:

```typescript
// Core enforcement functions
enforceProductLimit()           // Limit products by tier
enforceAIGenerationLimit()       // Daily AI generation quota
enforceAnalyticsAccess()         // Restrict analytics to paid tiers
enforceWebhookAccess()           // Webhooks only for paid tiers
enforceCustomDomainAccess()      // Custom domains for Pro tier only
enforcePrioritySupport()         // Support tiers

// Utility functions
getVendorSubscriptionTier()      // Get current tier & limits
getVendorFeatureAccess()         // Get all feature flags for frontend
```

### Configuration (`lib/config/subscription-tiers.ts`)

Defines features per tier:

```typescript
export const VENDOR_SUBSCRIPTION_TIERS = {
  free: {
    features: {
      productLimit: 10,
      aiGenerations: 5,
      analyticsAccess: false,
      webhooks: false,
      // ...
    }
  },
  starter: { /* ... */ },
  pro: { /* ... */ }
}
```

### Usage Logging (`lib/models/ai-usage-log.ts`)

Tracks AI feature usage:
- Feature type (generate-description, remove-background, etc.)
- Usage date/time
- Success/failure status
- Token counts

---

## Implementation Patterns

### Pattern 1: Server Action Enforcement

```typescript
// lib/actions/product.actions.ts
export async function createVendorProduct(data: IProductInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    const product = ProductInputSchema.parse(data)
    await connectToDatabase()

    // Get vendor info
    const vendor = await Vendor.findOne({ userId: session.user.id })
    if (!vendor || vendor.status !== 'approved') {
      throw new Error('Your vendor account is not approved')
    }

    // Enforce product limit
    const tierLimits = getTierLimits(vendor.subscriptionTier)
    if (!isUnlimited(tierLimits.productLimit)) {
      const productCount = await Product.countDocuments({
        vendorId: vendor._id,
        isPublished: true,
      })

      if (hasExceededLimit(productCount, tierLimits.productLimit)) {
        throw new Error(
          `Product limit (${tierLimits.productLimit}) reached for ${vendor.subscriptionTier} tier.`
        )
      }
    }

    // Proceed with creation...
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
```

### Pattern 2: API Route Enforcement

```typescript
// app/api/ai/generate-description/route.ts
import { enforceAIGenerationLimit, SubscriptionError } from '@/lib/subscription-enforcement'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check vendor status
  const vendor = await Vendor.findOne({ userId: session.user.id })
  if (!vendor || vendor.status !== 'approved') {
    return NextResponse.json({ error: 'Vendor not approved' }, { status: 403 })
  }

  // Enforce subscription limit
  try {
    await enforceAIGenerationLimit()
  } catch (error) {
    if (error instanceof SubscriptionError) {
      return NextResponse.json(
        {
          error: 'Subscription limit exceeded',
          message: error.message,
          tier: error.tier,
        },
        { status: 403 }
      )
    }
    throw error
  }

  // Proceed with operation...
  // ... then log usage
  const AIUsageLog = (await import('@/lib/models/ai-usage-log')).default
  await AIUsageLog.create({
    vendorId: vendor._id.toString(),
    featureType: 'generate-description',
    status: 'success',
  })

  return NextResponse.json({ success: true, /* ... */ })
}
```

### Pattern 3: Frontend Feature Flags

```typescript
// components/vendor/feature-gate.tsx
'use client'

import { useEffect, useState } from 'react'
import { getVendorFeatureAccess } from '@/lib/actions/vendor.actions'

export function FeatureGate({ feature, children, fallback }: Props) {
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      const access = await getVendorFeatureAccess()
      const canAccess =
        feature === 'analytics'
          ? access.features.analyticsAccess
          : feature === 'webhooks'
            ? access.features.webhooks
            : true

      setHasAccess(canAccess)
    }

    checkAccess()
  }, [feature])

  if (!hasAccess) {
    return fallback || <UpgradePrompt feature={feature} />
  }

  return children
}
```

---

## Current Enforcement Status

### ✅ Implemented

| Feature | Enforced | Logging | Location |
|---------|----------|---------|----------|
| Product Limit | ✅ | ✅ | `createVendorProduct()` |
| AI Generations | ✅ | ✅ | `/api/ai/generate-description/` |
| AI Background Removal | ⏳ | ⏳ | `/api/ai/remove-background/` |

### ⏳ In Progress

| Feature | Status | Notes |
|---------|--------|-------|
| Analytics Access | Framework Complete | Needs UI gate |
| Webhook Access | Framework Complete | Needs enforcement in webhook create |
| Custom Domain | Framework Complete | Needs implementation |
| Priority Support | Framework Complete | Contact form gate needed |

---

## Adding Enforcement to a New Feature

### 1. Define the Feature in Config

```typescript
// lib/config/subscription-tiers.ts
export const VENDOR_SUBSCRIPTION_TIERS = {
  free: {
    features: {
      myNewFeature: false,  // Add here
    }
  },
  starter: {
    features: {
      myNewFeature: true,
    }
  },
  pro: {
    features: {
      myNewFeature: true,
    }
  }
}
```

### 2. Create Enforcement Function

```typescript
// lib/subscription-enforcement.ts
export async function enforceMyNewFeature() {
  const { tier, limits } = await getVendorSubscriptionTier()

  if (!limits.myNewFeature) {
    throw new SubscriptionError(
      `My new feature is only available in Starter and Pro tiers.`,
      tier,
      'my_new_feature'
    )
  }

  return { allowed: true }
}
```

### 3. Call in Server Action or API Route

```typescript
export async function useMyNewFeature() {
  try {
    await enforceMyNewFeature()
    // Proceed with feature...
  } catch (error) {
    if (error instanceof SubscriptionError) {
      throw new Error(`${error.message} Upgrade now to unlock this feature.`)
    }
    throw error
  }
}
```

### 4. Optional: Add Frontend Feature Flag

```tsx
<FeatureGate feature="myNewFeature" fallback={<UpgradeCard tier="starter" />}>
  {/* Feature UI */}
</FeatureGate>
```

---

## Testing Enforcement

### Test Vector: Product Limit

```bash
# Login as free tier vendor
# Try creating 11th product
# Expected: Error message about limit

# Upgrade to Pro
# Try creating unlimited products
# Expected: Success
```

### Test Vector: AI Generation Limit

```bash
# Call /api/ai/generate-description 6 times in one day
# Expected: 6th call returns 403 Subscription limit exceeded

# Next day, can call again
# Expected: Success
```

---

## Monitoring & Metrics

### View AI Usage Per Vendor

```typescript
const AIUsageLog = (await import('@/lib/models/ai-usage-log')).default

// Daily usage for vendor
const todayUsage = await AIUsageLog.countDocuments({
  vendorId: vendorId,
  createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
})

// This month
const monthUsage = await AIUsageLog.countDocuments({
  vendorId: vendorId,
  createdAt: { $gte: new Date(new Date().setDate(1)) }
})
```

### Admin Dashboard Query

```typescript
// Top AI users this month
const topUsers = await AIUsageLog.aggregate([
  { $match: { createdAt: { $gte: monthStart } } },
  { $group: { _id: '$vendorId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```

---

## Rollout Checklist for Production

- [ ] All enforcement functions added to `subscription-enforcement.ts`
- [ ] All tier features defined in `subscription-tiers.ts`
- [ ] Usage logging integrated into high-usage routes
- [ ] Error messages tested and customer-friendly
- [ ] Upgrade prompts added to frontend
- [ ] Admin dashboard displays vendor tier & usage
- [ ] Monitoring alerts set for high-tier limits
- [ ] Documentation updated for each new feature

---

## Support & Debugging

### Common Issues

**Q: User can still access feature after tier limit?**
- Check: Is enforcement being called before feature execution?
- Check: Is the tier value correct in database?
- Check: Is subscription config updated?

**Q: AI usage not logging?**
- Check: Is `AIUsageLog.create()` wrapped in try/catch?
- Check: Is MongoDB connected when logging?
- Note: Logging failures are safe to ignore (logged as warnings)

**Q: Limit calculation wrong?**
- Check: Is `hasExceededLimit()` using correct values?
- Check: Query filtering for published/active items only?
- Check: Date ranges correct for monthly/daily quotas?

---

For detailed implementation of a specific feature, see:
- Vendor subscription flow: `WEEK21_ANALYTICS_SETUP.md` (analytics)
- Webhook management: `WEEK23_WEBHOOK_REPLAY_UI.md`
- Payment tracking: `WEEK24_AUTOMATED_RECONCILIATION.md`
