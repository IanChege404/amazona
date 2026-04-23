import crypto from 'crypto'
import path from 'path'
import { cwd } from 'process'
import { promises as fs } from 'fs'
import { loadEnvConfig } from '@next/env'

import { connectToDatabase } from '.'
import Product from './models/product.model'
import { ProductInputSchema } from '@/lib/validator'
import { toSlug } from '@/lib/utils'
import { z } from 'zod'

loadEnvConfig(cwd())

type CsvImportOptions = {
  filePath: string
  limit?: number
  dryRun: boolean
}

type CsvStats = {
  processed: number
  skippedInvalid: number
  inserted: number
  updated: number
}

const isTruthy = (value: string) => /^(true|1|yes)$/i.test(value.trim())

const normalizeCell = (value: string) => {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return ''
  return trimmed
}

const parseNumber = (value: string, fallback = 0): number => {
  const normalized = normalizeCell(value)
  if (!normalized) return fallback
  const numeric = Number(normalized.replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : fallback
}

const parseJsonArray = (value: string): string[] => {
  const normalized = normalizeCell(value)
  if (!normalized) return []
  try {
    const parsed = JSON.parse(normalized)
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => String(entry).trim())
        .filter((entry) => entry.length > 0)
    }
  } catch {
    return []
  }
  return []
}

const parseImageObjects = (value: string): string[] => {
  const normalized = normalizeCell(value)
  if (!normalized) return []
  try {
    const parsed = JSON.parse(normalized)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => {
        if (typeof entry === 'string') return entry
        return ''
      })
      .map((entry) => entry.trim())
      .filter((entry) => /^https?:\/\//i.test(entry))
  } catch {
    return []
  }
}

const parseCategories = (value: string): string[] => {
  const parsed = parseJsonArray(value)
  if (parsed.length > 0) return parsed
  const normalized = normalizeCell(value)
  if (!normalized) return []
  return normalized
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean)
}

const normalizeAvailability = (availability: string, isAvailableValue: string) => {
  const text = normalizeCell(availability).toLowerCase()
  const explicitUnavailable = normalizeCell(isAvailableValue).toLowerCase() === 'false'
  if (explicitUnavailable || text.includes('out of stock') || text.includes('unavailable')) {
    return { countInStock: 0, isPublished: false }
  }

  const countMatch = text.match(/(\d+)\s+left\s+in\s+stock/)
  if (countMatch) {
    const count = Number(countMatch[1])
    return { countInStock: Math.max(0, count), isPublished: count > 0 }
  }

  if (text.includes('in stock') || text.includes('ships')) {
    return { countInStock: 20, isPublished: true }
  }

  return { countInStock: 0, isPublished: false }
}

const buildVendorId = (vendorName: string) =>
  crypto.createHash('md5').update(vendorName).digest('hex').slice(0, 24)

const buildRatingDistribution = (avgRating: number, numReviews: number) => {
  const ratingBucket = Math.min(5, Math.max(1, Math.round(avgRating)))
  return [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: numReviews > 0 && rating === ratingBucket ? numReviews : 0,
  }))
}

const dedupe = <T,>(items: T[]) => Array.from(new Set(items))

const parseCsvRows = (content: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]

    if (ch === '"') {
      const nextChar = content[i + 1]
      if (inQuotes && nextChar === '"') {
        value += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (ch === ',' && !inQuotes) {
      row.push(value)
      value = ''
      continue
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i + 1] === '\n') i++
      row.push(value)
      value = ''
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row)
      }
      row = []
      continue
    }

    value += ch
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    rows.push(row)
  }

  return rows
}

const parseArgs = (): CsvImportOptions => {
  const args = process.argv.slice(2)
  const fileArg = args.find((arg) => arg.startsWith('--file='))
  const limitArg = args.find((arg) => arg.startsWith('--limit='))

  return {
    filePath: fileArg
      ? path.resolve(cwd(), fileArg.replace('--file=', ''))
      : path.join(cwd(), 'amazon-products.csv'),
    limit: limitArg ? Number(limitArg.replace('--limit=', '')) : undefined,
    dryRun: args.includes('--dry-run'),
  }
}

const main = async () => {
  const options = parseArgs()

  const csvContent = await fs.readFile(options.filePath, 'utf-8')
  const rows = parseCsvRows(csvContent)
  if (rows.length < 2) {
    throw new Error('CSV has no data rows')
  }

  const [headerRow, ...dataRows] = rows
  const headers = headerRow.map((header) => header.trim())

  const stats: CsvStats = {
    processed: 0,
    skippedInvalid: 0,
    inserted: 0,
    updated: 0,
  }

  const productsToUpsert: z.infer<typeof ProductInputSchema>[] = []

  for (const [index, row] of dataRows.entries()) {
    if (options.limit && stats.processed >= options.limit) break

    const record = Object.fromEntries(headers.map((header, i) => [header, row[i] ?? '']))
    stats.processed++

    const asin = normalizeCell(record.asin)
    const name = normalizeCell(record.title)
    if (!name) {
      stats.skippedInvalid++
      continue
    }

    const categoryPath = parseCategories(record.categories)
    const category =
      categoryPath[categoryPath.length - 1] ||
      normalizeCell(record.bs_category) ||
      normalizeCell(record.root_bs_category) ||
      'General'

    const imageCandidates = dedupe(
      [
        normalizeCell(record.image_url),
        ...parseImageObjects(record.images),
      ].filter((url) => /^https?:\/\//i.test(url))
    )

    const vendorName =
      normalizeCell(record.buybox_seller) ||
      normalizeCell(record.seller_name) ||
      normalizeCell(record.brand) ||
      'Marketplace Vendor'

    const vendorId = buildVendorId(vendorName)
    const finalPrice = parseNumber(record.final_price)
    const initialPrice = parseNumber(record.initial_price)

    const priceRaw = finalPrice > 0 ? finalPrice : initialPrice
    const price = priceRaw > 0 ? Number(priceRaw.toFixed(2)) : 0

    if (price <= 0 || imageCandidates.length === 0) {
      stats.skippedInvalid++
      continue
    }

    const listPriceRaw = initialPrice >= price ? initialPrice : price
    const listPrice = Number(listPriceRaw.toFixed(2))

    const { countInStock, isPublished } = normalizeAvailability(
      record.availability,
      record.is_available
    )

    const avgRating = Math.min(5, Math.max(0, parseNumber(record.rating, 0)))
    const numReviews = Math.max(0, Math.floor(parseNumber(record.reviews_count, 0)))
    const baseSlug = toSlug(name)
    const slugSuffix = toSlug(asin) || `row-${index + 1}`

    const productCandidate = {
      name,
      slug: `${baseSlug}-${slugSuffix}`.slice(0, 180),
      category,
      images: imageCandidates,
      brand: normalizeCell(record.brand) || 'Unknown',
      description:
        normalizeCell(record.description) ||
        parseJsonArray(record.features).slice(0, 3).join(' ') ||
        `${name} on ${normalizeCell(record.domain) || 'marketplace'}`,
      isPublished,
      vendorId,
      vendorName,
      price,
      listPrice,
      countInStock,
      tags: normalizeCell(record.discount) ? ['todays-deal'] : ['new-arrival'],
      sizes: [],
      colors: [],
      avgRating,
      numReviews,
      ratingDistribution: buildRatingDistribution(avgRating, numReviews),
      reviews: [],
      numSales: Math.max(0, Math.floor(parseNumber(record.bought_past_month, 0))),
    }

    const parsed = ProductInputSchema.safeParse(productCandidate)
    if (!parsed.success) {
      stats.skippedInvalid++
      continue
    }

    productsToUpsert.push(parsed.data)
  }

  if (options.dryRun) {
    console.log({
      mode: 'dry-run',
      filePath: options.filePath,
      stats,
      readyToImport: productsToUpsert.length,
    })
    return
  }

  await connectToDatabase(process.env.MONGODB_URI)

  for (const product of productsToUpsert) {
    const result = await Product.updateOne(
      { slug: product.slug },
      { $set: product },
      { upsert: true }
    )

    if (result.upsertedCount > 0) {
      stats.inserted++
    } else if (result.modifiedCount > 0 || result.matchedCount > 0) {
      stats.updated++
    }
  }

  console.log({
    mode: 'import',
    filePath: options.filePath,
    imported: productsToUpsert.length,
    stats,
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
