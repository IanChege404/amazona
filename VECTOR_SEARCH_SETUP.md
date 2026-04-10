# MongoDB Vector Search Setup Guide

> **Important:** MongoDB Atlas Vector Search is **only available in MongoDB Atlas** (cloud). Local MongoDB does not support vector search. This guide covers setup for production Atlas deployments.

---

## Environment-Specific Setup

### Development (Local MongoDB)
- **Vector Search:** ❌ Not available
- **Workaround:** Use semantic search fallback to text-based search
- **No action needed** — local dev will use keyword search

### Production (MongoDB Atlas)
- **Vector Search:** ✅ Available
- **Required:** Manual index creation in Atlas dashboard

---

## Prerequisites

1. **MongoDB Atlas Account** — [Create free cluster](https://www.mongodb.com/cloud/atlas)
2. **M0 Free Tier Does NOT Support Vector Search** — Minimum: **M10 tier** (paid)
3. **Atlas cluster deployed** — Note your cluster name & connection string

---

## Step 1: Create Vector Search Index in MongoDB Atlas

### Via Atlas UI (Recommended)

1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com)
2. Select your project → **Clusters** → Click your cluster name
3. Navigate to **Search Indexes** tab
4. Click **Create Search Index**
5. Choose **JSON Editor** (not Visual Editor)

### Step 2: Paste Vector Search Index Definition

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
      "path": "vendorId"
    },
    {
      "type": "filter",
      "path": "category"
    },
    {
      "type": "filter",
      "path": "isPublished"
    }
  ]
}
```

### Step 3: Name and Create Index

- **Index Name:** `product_vector_index` (must match in code)
- Click **Create Search Index**
- Wait for status to show **ACTIVE** (⏱️ ~5–10 minutes)

---

## Step 4: Verify Index in Code

Your production code uses this function (already implemented):

```typescript
// lib/ai/search.ts
export async function semanticSearch(query: string, filters?: { category?: string }) {
  const queryEmbedding = await generateEmbedding(query)

  const pipeline: object[] = [
    {
      $vectorSearch: {
        index: 'product_vector_index',  // Must match Atlas index name
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 150,
        limit: 20,
        filter: {
          isPublished: true,
          ...(filters?.category && { category: filters.category }),
        },
      },
    },
    {
      $project: {
        embedding: 0,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]

  const results = await Product.aggregate(pipeline)
  return results
}
```

---

## Step 5: Deploy to Production

When deploying to Vercel/production:

1. Ensure `MONGODB_URI` points to **MongoDB Atlas** cluster
2. Vector Search index **must be ACTIVE** before going live
3. All products with embeddings will automatically use vector search

### Check in MongoDB Atlas Console:

```
Database: amazona
Collection: products
Field: embedding (array of 1536 numbers)
```

---

## Handling Dev vs Prod Differences

### Environment Detection (Already Implemented)

Your code automatically detects the environment:

```typescript
// In production with Atlas
if (process.env.MONGODB_URI.includes('mongodb+srv://')) {
  // Vector search available
  useSemanticSearch = true
} else {
  // Local MongoDB — fallback to text search
  useSemanticSearch = false
}
```

### Embedding Generation Still Happens Locally

Even in dev, embeddings are generated and stored:
- Embeddings are computed via **OpenAI API** (requires `OPENAI_API_KEY`)
- Stored in `embedding` field in MongoDB
- In local dev: just stored, not used for $vectorSearch (no error, just skipped)
- In production Atlas: used for semantic search queries

---

## Testing Vector Search Locally (Optional)

To test vector search features in dev without Atlas:

### Option 1: Spin Up Temporary Atlas M0 Cluster
- Create free cluster, enable vector search, run tests
- Delete after testing

### Option 2: Mock Vector Search in Tests
```typescript
// __tests__/lib/ai/search.test.ts
describe('semanticSearch', () => {
  it('falls back to text search on local DB', async () => {
    if (!process.env.MONGODB_URI.includes('mongodb+srv')) {
      // Local DB — expect .find() not $vectorSearch
      expect(mockFind).toHaveBeenCalled()
    }
  })
})
```

---

## Troubleshooting

### "Error: $vectorSearch not found"
- **Cause:** Vector Search index not created or not ACTIVE yet
- **Fix:** Check Atlas **Search Indexes** tab — wait for ACTIVE status
- **Dev only?** It's normal — local MongoDB doesn't support it

### "Error: numCandidates must be > limit"
- **Cause:** Code sets `numCandidates < limit`
- **Fix:** Ensure `numCandidates: 150` and `limit: 20` (higher is correct)

### "Error: This operation is not supported in this tier"
- **Cause:** Using M0 free tier on Atlas
- **Fix:** Upgrade to **M10 or higher**

### Embeddings Not Generating
- **Check:** `OPENAI_API_KEY` is set in `.env.local`
- **Check:** Product creation logs for embedding errors
- **Note:** Safe to fail — products still created without embeddings

---

## Deployment Checklist for Production

- [ ] MongoDB Atlas cluster created (M10+ tier)
- [ ] **Vector Search index created** with name `product_vector_index`
- [ ] Index status is **ACTIVE** (verify in Atlas console)
- [ ] `OPENAI_API_KEY` set in production environment
- [ ] `MONGODB_URI` points to Atlas (includes `mongodb+srv://`)
- [ ] Deploy code to Vercel
- [ ] Test semantic search in production: `/search?semantic=true`

---

## FAQ

**Q: Can I use Vector Search with M0 free tier?**  
A: No. You need **M10 or higher**. Vector Search is a premium feature.

**Q: Does local MongoDB automatically get embeddings?**  
A: Yes. When products are created, embeddings are generated and stored in the `embedding` field. They just won't be used for search queries until deployed to Atlas.

**Q: What if I don't have Vector Search enabled?**  
A: Semantic search will fail gracefully and fallback to keyword search. The system still works.

**Q: Can I enable Vector Search later?**  
A: Yes. Create the index anytime. Existing products already have embeddings stored — they'll be immediately searchable.

**Q: Do I need to regenerate all embeddings after enabling Vector Search?**  
A: No. If embeddings already exist in the database from dev, they're ready to search immediately after index creation.

---

## Next: Enable on Production Database

1. **This weekend** — Create/verify Atlas cluster is M10+
2. **Create Vector Search index** using JSON above
3. **Verify ACTIVE status** — take screenshot for progress tracking
4. **Deploy code** — embeddings + vector search will activate automatically

Once this is done, semantic search is production-ready! 🚀
