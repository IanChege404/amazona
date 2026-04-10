# 🛍️ Multi-Vendor Marketplace — Full Production Roadmap
> Built on top of [nextjs-amazona](https://github.com/basir/nextjs-amazona) · Next.js 15 · MongoDB · Stripe · AI-powered

---

## 📋 Table of Contents

1. [Project Vision](#1-project-vision)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Phase 1 — Multi-Vendor Foundation (Weeks 1–4)](#5-phase-1--multi-vendor-foundation-weeks-14)
6. [Phase 2 — AI Features (Weeks 5–10)](#6-phase-2--ai-features-weeks-510)
7. [Phase 3 — Production Polish (Weeks 11–18)](#7-phase-3--production-polish-weeks-1118)
8. [Phase 4 — Wow Touches (Weeks 19–24)](#8-phase-4--wow-touches-weeks-1924)
9. [Database Schema Reference](#9-database-schema-reference)
10. [API Routes Reference](#10-api-routes-reference)
11. [Deployment Guide](#11-deployment-guide)
12. [Testing Strategy](#12-testing-strategy)
13. [Performance Checklist](#13-performance-checklist)
14. [Portfolio Presentation Tips](#14-portfolio-presentation-tips)

---

## 1. Project Vision

Transform the `nextjs-amazona` starter into a **production-grade, AI-powered multi-vendor marketplace** — think Etsy meets Jumia, built with a modern stack that impresses any senior engineer or startup CTO reviewing your portfolio.

### Core User Roles

| Role | What They Can Do |
|---|---|
| **Shopper** | Browse, search, cart, checkout, review, track orders |
| **Vendor** | Apply, get approved, manage products, view analytics, receive payouts |
| **Admin** | Approve vendors, manage the platform, view global analytics |

### The Differentiator Story (for interviews)
> *"I took an open-source e-commerce starter and scaled it into a multi-tenant marketplace with Stripe Connect split payments, AI-powered product listings, and semantic search — all shipped to production in 6 months solo."*

---

## 2. Tech Stack Overview

### Inherited from Base Project
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Database | MongoDB + Mongoose |
| Auth | Auth.js (Google, Magic Link, Credentials) |
| Payments | PayPal + Stripe |
| File Uploads | Uploadthing |
| Email | Resend |
| Validation | Zod + React Hook Form |

### New Additions (This Roadmap)
| Layer | Technology | Why |
|---|---|---|
| Split Payments | Stripe Connect | Multi-vendor payouts |
| Vector Search | MongoDB Atlas Vector Search | Semantic product search |
| AI Text | Anthropic Claude API | Product description generation |
| AI Image | remove.bg API or Replicate | Background removal for product photos |
| Real-time | Pusher or Ably | Order tracking, notifications |
| Monitoring | Sentry | Error tracking in production |
| Rate Limiting | Upstash Redis + Ratelimit | API abuse prevention |
| PWA | next-pwa | Mobile app-like experience |
| Testing | Vitest + Playwright | Unit and E2E tests |
| CI/CD | GitHub Actions | Automated deploy pipeline |

---

## 3. Repository Structure

After all phases are complete, your project structure should look like this:

```
nextjs-amazona/
├── app/
│   ├── (auth)/                    # Auth pages (sign-in, register)
│   ├── (root)/                    # Public-facing pages
│   │   ├── page.tsx               # Homepage
│   │   ├── search/                # Search page (enhanced with semantic)
│   │   ├── product/[slug]/        # Product detail
│   │   ├── store/[vendorSlug]/    # ⭐ NEW: Public vendor storefront
│   │   ├── cart/
│   │   └── checkout/
│   ├── vendor/                    # ⭐ NEW: Vendor dashboard (protected)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── [id]/edit/
│   │   ├── orders/
│   │   ├── analytics/
│   │   ├── payouts/
│   │   └── settings/
│   ├── admin/                     # Admin dashboard (protected)
│   │   ├── dashboard/
│   │   ├── vendors/               # ⭐ NEW: Vendor approval
│   │   ├── products/
│   │   ├── orders/
│   │   └── users/
│   └── api/
│       ├── auth/
│       ├── webhooks/
│       │   ├── stripe/            # Stripe events (payments, payouts)
│       │   └── uploadthing/
│       ├── ai/
│       │   ├── generate-description/  # ⭐ NEW
│       │   ├── remove-background/     # ⭐ NEW
│       │   └── embeddings/            # ⭐ NEW
│       └── vendors/               # ⭐ NEW: Vendor API routes
├── components/
│   ├── shared/
│   ├── vendor/                    # ⭐ NEW: Vendor-specific components
│   └── ui/                        # shadcn components
├── lib/
│   ├── db/
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── product.model.ts
│   │   │   ├── order.model.ts
│   │   │   ├── vendor.model.ts    # ⭐ NEW
│   │   │   └── payout.model.ts    # ⭐ NEW
│   │   └── connect.ts
│   ├── actions/                   # Server Actions
│   │   ├── product.actions.ts
│   │   ├── order.actions.ts
│   │   ├── vendor.actions.ts      # ⭐ NEW
│   │   └── ai.actions.ts          # ⭐ NEW
│   ├── stripe/
│   │   ├── connect.ts             # ⭐ NEW: Stripe Connect helpers
│   │   └── webhooks.ts
│   ├── ai/
│   │   ├── claude.ts              # ⭐ NEW: Claude API client
│   │   └── embeddings.ts          # ⭐ NEW: Vector embedding helpers
│   └── validations/
│       └── vendor.validation.ts   # ⭐ NEW
├── hooks/
├── types/
│   └── vendor.types.ts            # ⭐ NEW
├── emails/
│   ├── vendor-approved.tsx        # ⭐ NEW
│   └── order-notification.tsx
└── public/
```

---

## 4. Environment Variables Reference

Copy `.example-env` to `.env.local` and fill in all values below.

```bash
# ─── DATABASE ───────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/amazona

# ─── AUTH ───────────────────────────────────────────────
AUTH_SECRET=your_random_secret_min_32_chars
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret

# ─── STRIPE (standard) ──────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── STRIPE CONNECT (multi-vendor) ──────────────────────
STRIPE_CLIENT_ID=ca_...                        # From Stripe Connect settings
NEXT_PUBLIC_STRIPE_CONNECT_REDIRECT_URI=https://yourdomain.com/vendor/stripe/callback

# ─── PAYPAL ─────────────────────────────────────────────
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_APP_SECRET=your_paypal_secret

# ─── EMAIL (Resend) ─────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# ─── FILE UPLOADS (Uploadthing) ─────────────────────────
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your_app_id

# ─── AI (Anthropic Claude) ──────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...

# ─── AI (remove.bg for image processing) ────────────────
REMOVE_BG_API_KEY=your_removebg_key

# ─── REAL-TIME (Pusher) ─────────────────────────────────
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# ─── RATE LIMITING (Upstash Redis) ──────────────────────
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# ─── MONITORING (Sentry) ────────────────────────────────
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# ─── APP ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PLATFORM_FEE_PERCENTAGE=10        # % taken from each sale (your revenue)
```

---

## 5. Phase 1 — Multi-Vendor Foundation (Weeks 1–4)

> **Goal:** The app supports multiple vendors, each with their own dashboard and isolated products. Stripe Connect handles split payments.

---

### Week 1 — Vendor Data Model & Auth

#### Task 1.1 — Create the Vendor Mongoose Model

Create `lib/db/models/vendor.model.ts`:

```typescript
import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IVendor extends Document {
  userId: mongoose.Types.ObjectId      // Link to User
  businessName: string
  slug: string                         // e.g. "jua-kali-crafts" → /store/jua-kali-crafts
  description: string
  logo: string                         // Uploadthing URL
  banner: string                       // Uploadthing URL
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    country: string
  }
  status: 'pending' | 'approved' | 'suspended'
  stripeAccountId?: string             // Stripe Connect account ID
  stripeOnboardingComplete: boolean
  commissionRate: number               // Platform fee override (defaults to PLATFORM_FEE_PERCENTAGE)
  totalRevenue: number                 // Running total for analytics
  totalOrders: number
  rating: number
  numReviews: number
  createdAt: Date
  updatedAt: Date
}

const vendorSchema = new Schema<IVendor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    email: { type: String, required: true },
    phone: String,
    address: {
      street: String,
      city: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
    },
    stripeAccountId: String,
    stripeOnboardingComplete: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Auto-generate slug from businessName if not provided
vendorSchema.pre('validate', function (next) {
  if (this.businessName && !this.slug) {
    this.slug = this.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  next()
})

const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', vendorSchema)

export default Vendor
```

#### Task 1.2 — Update the Product Model

Add `vendorId` to the existing product model:

```typescript
// In lib/db/models/product.model.ts — add these fields:
vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
vendorName: { type: String, required: true },  // Denormalised for fast reads
```

#### Task 1.3 — Update User Model with Vendor Role

```typescript
// In lib/db/models/user.model.ts — update role enum:
role: {
  type: String,
  enum: ['user', 'vendor', 'admin'],
  default: 'user',
},
```

#### Task 1.4 — Vendor Middleware Protection

```typescript
// middleware.ts — add vendor route protection
export const config = {
  matcher: ['/vendor/:path*', '/admin/:path*'],
}

// In the middleware function, check role from session:
// - /vendor/* → requires role === 'vendor' AND vendor.status === 'approved'
// - /admin/*  → requires role === 'admin'
```

---

### Week 2 — Vendor Onboarding Flow

#### Task 2.1 — Vendor Application Page

Create `app/(root)/become-a-vendor/page.tsx` with a multi-step form:

**Step 1:** Business details (name, description, category, contact)  
**Step 2:** Upload logo and banner (use existing Uploadthing setup)  
**Step 3:** Review & submit  

On submit → create a `Vendor` document with `status: 'pending'` → send email to admin.

#### Task 2.2 — Admin Vendor Approval

Create `app/admin/vendors/page.tsx`:

- Table of vendors with status badges
- Action buttons: **Approve** / **Suspend** / **View Details**
- On approve → update vendor status → update user role to `'vendor'` → send approval email via Resend

```typescript
// lib/actions/vendor.actions.ts
'use server'

export async function approveVendor(vendorId: string) {
  await connectToDatabase()
  
  const vendor = await Vendor.findByIdAndUpdate(
    vendorId,
    { status: 'approved' },
    { new: true }
  )
  
  // Promote user role
  await User.findByIdAndUpdate(vendor.userId, { role: 'vendor' })
  
  // Send approval email
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: vendor.email,
    subject: 'Your vendor application has been approved! 🎉',
    react: VendorApprovedEmail({ vendorName: vendor.businessName }),
  })
  
  revalidatePath('/admin/vendors')
}
```

#### Task 2.3 — Vendor Dashboard Shell

Create `app/vendor/layout.tsx` with:
- Sidebar navigation (Dashboard, Products, Orders, Analytics, Payouts, Settings)
- Guard: redirect to `/` if vendor status is not `'approved'`
- Display vendor business name and logo in sidebar header

---

### Week 3 — Stripe Connect Integration

> This is the most technically complex part. Take your time here.

#### Task 3.1 — Create Stripe Connect Helper

```typescript
// lib/stripe/connect.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Create a Stripe Express account for a vendor
export async function createStripeConnectAccount(email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
  return account
}

// Generate the Stripe onboarding link
export async function createAccountLink(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/stripe/refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/stripe/success`,
    type: 'account_onboarding',
  })
  return accountLink.url
}

// Calculate the platform fee amount (in cents)
export function calculatePlatformFee(amount: number, commissionRate: number): number {
  return Math.round(amount * (commissionRate / 100))
}
```

#### Task 3.2 — Stripe Connect Onboarding Route

```typescript
// app/api/vendors/stripe/connect/route.ts
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const vendor = await Vendor.findOne({ userId: session.user.id })
  if (!vendor) return new Response('Vendor not found', { status: 404 })

  let accountId = vendor.stripeAccountId

  // Create account if first time
  if (!accountId) {
    const account = await createStripeConnectAccount(vendor.email)
    accountId = account.id
    await Vendor.findByIdAndUpdate(vendor._id, { stripeAccountId: accountId })
  }

  const onboardingUrl = await createAccountLink(accountId)
  return Response.json({ url: onboardingUrl })
}
```

#### Task 3.3 — Update Checkout to Use Stripe Connect

When creating a Stripe Payment Intent, include `transfer_data` to automatically split the payment:

```typescript
// In your checkout/payment server action:

const vendor = await Vendor.findById(product.vendorId)
const platformFee = calculatePlatformFee(orderTotal, vendor.commissionRate)

const paymentIntent = await stripe.paymentIntents.create({
  amount: orderTotal * 100, // in cents
  currency: 'usd',
  transfer_data: {
    destination: vendor.stripeAccountId!, // Vendor's connected account
  },
  application_fee_amount: platformFee * 100, // Platform takes this cut
})
```

#### Task 3.4 — Stripe Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
// Handle these events:
// - payment_intent.succeeded     → mark order as paid, notify vendor
// - account.updated              → update vendor stripeOnboardingComplete
// - transfer.created             → log payout to vendor
```

---

### Week 4 — Vendor Product Management

#### Task 4.1 — Vendor Products Page

`app/vendor/products/page.tsx` — shows only the logged-in vendor's products. Reuse the admin products table but scoped by `vendorId`.

#### Task 4.2 — Create/Edit Product Page

`app/vendor/products/[id]/edit/page.tsx` — reuse the admin product form but:
- Auto-populate `vendorId` from the session
- Validate that the product belongs to this vendor before allowing edits
- Do NOT show the vendor selection dropdown (a vendor can only create for themselves)

#### Task 4.3 — Vendor Order Management

`app/vendor/orders/page.tsx` — show only orders containing products from this vendor's inventory.

```typescript
// Filter orders in the server action:
const orders = await Order.find({
  'items.vendorId': vendor._id
}).sort({ createdAt: -1 })
```

---

## 6. Phase 2 — AI Features (Weeks 5–10)

> **Goal:** Add AI superpowers that make the platform genuinely smart and differentiate it in any portfolio review.

---

### Week 5–6 — AI Product Description Generator

#### Task 5.1 — Claude API Client Setup

```typescript
// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generateProductDescription(params: {
  productName: string
  category: string
  keyFeatures: string[]
  targetAudience?: string
  tone?: 'professional' | 'casual' | 'luxury' | 'playful'
}): Promise<string> {
  const { productName, category, keyFeatures, targetAudience, tone = 'professional' } = params

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert e-commerce copywriter. Write a compelling product description.

Product Name: ${productName}
Category: ${category}
Key Features: ${keyFeatures.join(', ')}
Target Audience: ${targetAudience || 'general consumers'}
Tone: ${tone}

Requirements:
- 2-3 short paragraphs
- Start with a hook that grabs attention
- Highlight benefits, not just features
- End with a subtle call to action
- Do NOT use bullet points
- Do NOT include a title — just the description body`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
```

#### Task 5.2 — API Route with Rate Limiting

```typescript
// app/api/ai/generate-description/route.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 generations per hour per vendor
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  // Rate limit by user ID
  const { success, remaining } = await ratelimit.limit(session.user.id!)
  if (!success) {
    return new Response('Rate limit exceeded. Try again later.', { status: 429 })
  }

  const body = await req.json()
  const description = await generateProductDescription(body)

  return Response.json({ description, remaining })
}
```

#### Task 5.3 — AI Button in Product Form

In the vendor product create/edit form, add an **"✨ Generate with AI"** button next to the description field:

```tsx
// components/vendor/ai-description-button.tsx
'use client'

export function AIDescriptionButton({ onGenerate }: { onGenerate: (text: string) => void }) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    // Collect form values from react-hook-form context
    const res = await fetch('/api/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify({ productName, category, keyFeatures }),
    })
    const { description } = await res.json()
    onGenerate(description)  // Injects text into the form field
    setLoading(false)
  }

  return (
    <Button variant="outline" onClick={handleGenerate} disabled={loading}>
      {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : '✨'}
      Generate with AI
    </Button>
  )
}
```

---

### Week 7–8 — Semantic Search

#### Task 6.1 — Enable MongoDB Atlas Vector Search

1. In MongoDB Atlas → your cluster → **Search** tab → **Create Search Index**
2. Create a **Vector Search** index on the `products` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "status"
    },
    {
      "type": "filter", 
      "path": "category"
    }
  ]
}
```

#### Task 6.2 — Embedding Generation

```typescript
// lib/ai/embeddings.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Generate text embedding for a product
export async function generateEmbedding(text: string): Promise<number[]> {
  // Use a text embedding model
  // Option A: OpenAI text-embedding-3-small (1536 dims, very affordable)
  // Option B: Voyage AI (Anthropic's recommended partner)
  
  // Example with OpenAI embeddings (add openai package):
  const { OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  
  return response.data[0].embedding
}

// Build the text to embed from a product
export function productToEmbeddingText(product: {
  name: string
  description: string
  category: string
  tags?: string[]
}): string {
  return [
    product.name,
    product.category,
    product.description,
    ...(product.tags || []),
  ].join(' ')
}
```

#### Task 6.3 — Embed Products on Create/Update

In your product create/update server action, generate and store the embedding:

```typescript
// lib/actions/product.actions.ts
import { generateEmbedding, productToEmbeddingText } from '@/lib/ai/embeddings'

export async function createProduct(data: CreateProductInput) {
  // ... existing validation

  const embeddingText = productToEmbeddingText(data)
  const embedding = await generateEmbedding(embeddingText)

  const product = await Product.create({
    ...data,
    embedding, // Store the vector
  })

  return product
}
```

#### Task 6.4 — Semantic Search Function

```typescript
// lib/actions/search.actions.ts
export async function semanticSearch(query: string, filters?: { category?: string }) {
  const queryEmbedding = await generateEmbedding(query)

  const pipeline: object[] = [
    {
      $vectorSearch: {
        index: 'product_vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 150,
        limit: 20,
        filter: {
          status: 'published',
          ...(filters?.category && { category: filters.category }),
        },
      },
    },
    {
      $project: {
        embedding: 0, // Don't return the raw vector to the client
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]

  const results = await Product.aggregate(pipeline)
  return results
}
```

#### Task 6.5 — Enhanced Search Page

Update `app/(root)/search/page.tsx`:
- Add a toggle: **"Keyword Search"** vs **"AI Semantic Search"**
- When semantic mode is active, call `semanticSearch()` instead of the regular MongoDB text search
- Show relevance score as a subtle badge on results (helps demonstrate the feature in demos)

---

### Week 9 — AI Background Removal for Product Images

#### Task 7.1 — Background Removal API Route

```typescript
// app/api/ai/remove-background/route.ts
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { imageUrl } = await req.json()

  // Call remove.bg API
  const formData = new FormData()
  formData.append('image_url', imageUrl)
  formData.append('size', 'auto')

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY! },
    body: formData,
  })

  if (!response.ok) {
    return new Response('Background removal failed', { status: 500 })
  }

  // Convert to base64 and return
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  return Response.json({
    image: `data:image/png;base64,${base64}`,
  })
}
```

#### Task 7.2 — Image Upload UI Enhancement

In the vendor product image uploader, after an image is uploaded, show a **"🪄 Remove Background"** button that:
1. Calls the API route
2. Previews the result with a checkerboard background (transparent PNG)
3. Lets the vendor confirm and replace the original image

---

### Week 10 — Smart Recommendations

#### Task 8.1 — "Customers Also Viewed" (Embedding Similarity)

```typescript
// lib/actions/product.actions.ts
export async function getSimilarProducts(productId: string, limit = 6) {
  const product = await Product.findById(productId).select('embedding category')
  if (!product?.embedding) return []

  const results = await Product.aggregate([
    {
      $vectorSearch: {
        index: 'product_vector_index',
        path: 'embedding',
        queryVector: product.embedding,
        numCandidates: 50,
        limit: limit + 1, // +1 to exclude self
        filter: { status: 'published' },
      },
    },
    {
      $match: { _id: { $ne: product._id } }, // Exclude the product itself
    },
    { $limit: limit },
    { $project: { embedding: 0 } },
  ])

  return results
}
```

Display these on the product detail page below the main product info.

---

## 7. Phase 3 — Production Polish (Weeks 11–18)

> **Goal:** Make it reliable, fast, and professional. This is what separates portfolio projects from real products.

---

### Week 11–12 — Real-Time Order Tracking

#### Task 9.1 — Pusher Setup

```bash
npm install pusher pusher-js
```

```typescript
// lib/pusher.ts
import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Client-side
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
})
```

#### Task 9.2 — Trigger Order Status Events

When an admin or vendor updates an order status:

```typescript
// In your order update server action:
await pusherServer.trigger(
  `order-${orderId}`,      // Channel name (private to this order)
  'status-updated',         // Event name
  {
    status: newStatus,
    updatedAt: new Date().toISOString(),
    message: getStatusMessage(newStatus),
  }
)
```

#### Task 9.3 — Order Tracking Component (Client)

```tsx
// components/shared/order-tracker.tsx
'use client'

export function OrderTracker({ orderId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  
  useEffect(() => {
    const channel = pusherClient.subscribe(`order-${orderId}`)
    channel.bind('status-updated', (data: { status: string }) => {
      setStatus(data.status)
    })
    return () => pusherClient.unsubscribe(`order-${orderId}`)
  }, [orderId])

  // Render a stepper UI: Placed → Paid → Processing → Shipped → Delivered
  return <OrderStatusStepper currentStatus={status} />
}
```

---

### Week 13–14 — Vendor Analytics Dashboard

#### Task 10.1 — Analytics Data Aggregation

```typescript
// lib/actions/vendor.actions.ts
export async function getVendorAnalytics(vendorId: string) {
  const [revenueByMonth, topProducts, ordersByStatus, recentActivity] =
    await Promise.all([
      // Revenue per month (last 12 months)
      Order.aggregate([
        { $match: { 'items.vendorId': vendorId, status: 'delivered' } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      // Top 5 products by revenue
      Order.aggregate([/* ... */]),
      // Orders by status breakdown
      Order.aggregate([/* ... */]),
      // Last 5 orders
      Order.find({ 'items.vendorId': vendorId }).sort({ createdAt: -1 }).limit(5),
    ])

  return { revenueByMonth, topProducts, ordersByStatus, recentActivity }
}
```

#### Task 10.2 — Analytics UI (Recharts — already in stack!)

Build `app/vendor/analytics/page.tsx` with:
- **Line chart:** Revenue over time (last 12 months)
- **Bar chart:** Orders per month
- **Pie chart:** Order status breakdown
- **Table:** Top 5 products by revenue
- **KPI cards:** Total revenue, total orders, avg order value, conversion rate

---

### Week 15 — Email Notifications

Using Resend (already in the stack), create email templates for:

| Trigger | Recipient | Template |
|---|---|---|
| New order placed | Vendor | `emails/vendor-new-order.tsx` |
| Order status update | Customer | `emails/order-status-update.tsx` |
| Vendor approved | Vendor | `emails/vendor-approved.tsx` |
| Payout processed | Vendor | `emails/payout-processed.tsx` |
| Low stock (< 5 units) | Vendor | `emails/low-stock-alert.tsx` |

---

### Week 16 — Error Monitoring & Rate Limiting

#### Task 12.1 — Sentry Setup

```bash
npx @sentry/wizard@latest -i nextjs
```

This auto-configures Sentry for Next.js. Add to your `next.config.ts`:

```typescript
import { withSentryConfig } from '@sentry/nextjs'
export default withSentryConfig(nextConfig, { silent: true })
```

#### Task 12.2 — Rate Limiting on All AI Routes

Apply rate limiting (see Task 5.2 pattern) to:
- `/api/ai/generate-description` — 10/hour per vendor
- `/api/ai/remove-background` — 20/hour per vendor
- `/api/vendors/stripe/connect` — 5/hour per vendor
- Any auth routes — 20/15min per IP

---

### Week 17–18 — PWA Support

```bash
npm install next-pwa
```

```typescript
// next.config.ts
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

Create `public/manifest.json`:
```json
{
  "name": "Your Marketplace Name",
  "short_name": "Marketplace",
  "description": "Shop unique products from independent vendors",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#your-brand-color",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 8. Phase 4 — Wow Touches (Weeks 19–24)

> **Goal:** Polish that makes hiring managers stop scrolling.

---

### Week 19–20 — Public Vendor Storefronts

Each approved vendor gets a public branded page at `/store/[vendorSlug]`.

`app/(root)/store/[vendorSlug]/page.tsx`:

```tsx
export default async function VendorStorePage({ params }: { params: { vendorSlug: string } }) {
  const vendor = await Vendor.findOne({ slug: params.vendorSlug, status: 'approved' })
  if (!vendor) notFound()

  const products = await Product.find({ vendorId: vendor._id, status: 'published' })

  return (
    <div>
      {/* Hero section with vendor banner image */}
      <VendorHero vendor={vendor} />
      
      {/* Vendor info card */}
      <VendorInfo vendor={vendor} />
      
      {/* Product grid */}
      <ProductGrid products={products} />
      
      {/* Vendor reviews */}
      <VendorReviews vendorId={vendor._id} />
    </div>
  )
}
```

Add metadata for SEO:
```typescript
export async function generateMetadata({ params }) {
  const vendor = await Vendor.findOne({ slug: params.vendorSlug })
  return {
    title: `${vendor.businessName} | Your Marketplace`,
    description: vendor.description,
    openGraph: { images: [vendor.banner] },
  }
}
```

---

### Week 21–22 — Vendor Subscription Tiers (Stripe Billing)

| Tier | Price | Product Limit | AI Generations | Featured Listing |
|---|---|---|---|---|
| **Free** | $0/mo | 10 products | 5/month | ✗ |
| **Starter** | $9/mo | 50 products | 50/month | ✗ |
| **Pro** | $29/mo | Unlimited | Unlimited | ✓ |

#### Task 14.1 — Create Stripe Products and Prices

Do this via Stripe Dashboard or CLI. Store the Price IDs in your env:

```bash
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

#### Task 14.2 — Subscription Management

```typescript
// lib/stripe/subscriptions.ts
export async function createSubscription(vendorStripeAccountId: string, priceId: string) {
  // Create a Stripe Customer for the vendor (if not already created)
  // Create a subscription to the selected plan
  // Return the client secret for confirmation
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId)
}
```

#### Task 14.3 — Enforce Limits by Tier

In your product creation server action:

```typescript
const vendor = await Vendor.findById(vendorId).populate('subscription')
const productCount = await Product.countDocuments({ vendorId })
const limit = TIER_LIMITS[vendor.subscriptionTier].products

if (productCount >= limit) {
  throw new Error(`Upgrade to Pro to add more than ${limit} products.`)
}
```

---

### Week 23–24 — Marketing Landing Page

Create `app/(root)/landing/page.tsx` (or make it the root `/` if you want):

Sections to include:
1. **Hero** — Bold headline, CTA to shop or become a vendor, hero image/video
2. **Featured Vendors** — Carousel of top vendor storefronts
3. **How It Works** — 3-step explainer (Browse → Buy → Delivered)
4. **AI Features Showcase** — Animated demo of the AI description generator
5. **Vendor CTA** — "Start selling today" section with pricing tiers
6. **Testimonials** — Use placeholder data, or seed with realistic fake data
7. **Footer** — Links, newsletter signup (connect to Resend audience)

---

## 9. Database Schema Reference

### Collections Overview

```
users          → Auth.js users + role field
vendors        → Vendor profiles + Stripe Connect info
products       → Products with vendorId + embedding vector
orders         → Orders with items array (each item has vendorId)
reviews        → Product reviews
payouts        → Payout history per vendor
webpages       → CMS pages (from base project)
```

### Key Relationships

```
User (1) ──────── (1) Vendor
Vendor (1) ─────── (N) Products
Product (N) ────── (M) Orders (via items array)
Order (1) ─────── (N) Payouts (one per vendor in the order)
```

### Indexing Strategy

```typescript
// Add these indexes for performance:
Product.index({ vendorId: 1, status: 1 })        // Vendor product queries
Product.index({ category: 1, status: 1 })         // Category browsing
Product.index({ '$**': 'text' })                  // Full-text search (existing)
Order.index({ 'items.vendorId': 1, createdAt: -1 }) // Vendor order queries
Order.index({ userId: 1, createdAt: -1 })          // Customer order history
Vendor.index({ slug: 1 }, { unique: true })        // Storefront lookup
```

---

## 10. API Routes Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/vendors/apply` | User | Submit vendor application |
| `POST` | `/api/vendors/stripe/connect` | Vendor | Start Stripe Connect onboarding |
| `GET` | `/api/vendors/stripe/success` | Vendor | Handle Stripe onboarding return |
| `POST` | `/api/ai/generate-description` | Vendor | AI product description |
| `POST` | `/api/ai/remove-background` | Vendor | Remove image background |
| `POST` | `/api/webhooks/stripe` | Public | Stripe webhook handler |
| `POST` | `/api/webhooks/uploadthing` | Public | Uploadthing webhook |
| `GET` | `/api/search?q=...&semantic=true` | Public | Enhanced search |

---

## 11. Deployment Guide

### Pre-Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] MongoDB Atlas IP Whitelist set to `0.0.0.0/0` (allow all — for Vercel serverless)
- [ ] MongoDB Atlas Vector Search index created and active
- [ ] Stripe webhooks registered for production URL
- [ ] Uploadthing app configured for production domain
- [ ] Pusher app created and credentials set
- [ ] Sentry project created and DSN set
- [ ] `NEXTAUTH_URL` set to production URL

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Custom Domain Setup

1. In Vercel dashboard → your project → **Domains**
2. Add your custom domain
3. Update DNS records at your registrar
4. Update `NEXT_PUBLIC_APP_URL` and `STRIPE_CONNECT_REDIRECT_URI` env vars

### Post-Deployment

```bash
# Seed initial data (run once)
npm run seed

# Create admin user manually in MongoDB:
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 12. Testing Strategy

### Unit Tests (Vitest)

```bash
npm install -D vitest @vitejs/plugin-react
```

Test these critical functions:
- `calculatePlatformFee()` — payment math must be exact
- `generateSlug()` — vendor slug generation
- `productToEmbeddingText()` — embedding input formatting
- Server action validation (Zod schemas)

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

Key flows to test:
- Shopper: Search → Product page → Add to cart → Checkout → Order confirmation
- Vendor: Apply → (skip approval) → Create product → AI generate description
- Admin: Approve vendor → View analytics

---

## 13. Performance Checklist

- [ ] Images use `next/image` with proper `sizes` prop and WebP format
- [ ] Product listings use `loading="lazy"` for below-fold images
- [ ] Heavy components (charts, maps) use `dynamic(() => import(...), { ssr: false })`
- [ ] MongoDB aggregation queries use proper indexes (verify with `.explain()`)
- [ ] AI API calls have loading states and error boundaries
- [ ] Pusher channels are unsubscribed on component unmount
- [ ] Stripe.js is loaded lazily (only on checkout pages)
- [ ] ISR (`revalidate`) set on vendor storefront pages (e.g., every 60 seconds)
- [ ] Lighthouse score ≥ 90 on Performance, Accessibility, Best Practices

---

## 14. Portfolio Presentation Tips

### What to Showcase in Interviews

**1. The Architecture Decision:** Explain why you chose Server Actions over REST APIs for mutations — it reduces network round-trips and simplifies auth.

**2. The Stripe Connect Flow:** Walk through how money moves: customer pays → Stripe holds → platform fee extracted → remainder transferred to vendor. This shows you understand financial systems.

**3. The AI Integration:** Explain embeddings to non-technical interviewers as *"I converted product text into numbers that capture meaning, so when you search 'cozy gift for mum', it finds 'cashmere throw blanket' even if those exact words don't appear."*

**4. The Real-Time Feature:** Show the order tracker updating live. This is visually impressive and easy to demo.

### GitHub README Must-Haves

- Animated GIF of the AI description generator in action
- Screenshot of the vendor dashboard analytics
- Screenshot of the semantic search in action
- Live demo link (keep it seeded with realistic data)
- Clear architecture diagram
- "Built with" badges

### The One-Liner for Your CV

> *Full-stack multi-vendor marketplace with AI-powered listings, semantic search, and Stripe Connect split payments — built with Next.js 15, MongoDB Atlas Vector Search, and Anthropic Claude.*

---

*Roadmap version 1.0 — Happy building! 🚀*