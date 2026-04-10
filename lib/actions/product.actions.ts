'use server'

import { connectToDatabase } from '@/lib/db'
import Product, { IProduct } from '@/lib/db/models/product.model'
import { revalidatePath } from 'next/cache'
import { formatError } from '../utils'
import { ProductInputSchema, ProductUpdateSchema } from '../validator'
import { IProductInput } from '@/types'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import { generateEmbedding, productToEmbeddingText } from '@/lib/ai/embeddings'

// CREATE
export async function createProduct(data: IProductInput) {
  try {
    const product = ProductInputSchema.parse(data)
    await connectToDatabase()

    // Generate embedding asynchronously (don't block on it)
    let embedding: number[] = []
    try {
      const embeddingText = productToEmbeddingText({
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
      })
      embedding = await generateEmbedding(embeddingText)
    } catch (error) {
      console.warn('Failed to generate embedding for product:', error)
    }

    await Product.create({
      ...product,
      embedding: embedding.length > 0 ? embedding : undefined,
    })
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateProduct(data: z.infer<typeof ProductUpdateSchema>) {
  try {
    const product = ProductUpdateSchema.parse(data)
    await connectToDatabase()

    // Generate updated embedding
    let embedding: number[] | undefined
    try {
      const embeddingText = productToEmbeddingText({
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
      })
      const generated = await generateEmbedding(embeddingText)
      embedding = generated.length > 0 ? generated : undefined
    } catch (error) {
      console.warn('Failed to generate embedding for product:', error)
    }

    await Product.findByIdAndUpdate(product._id, {
      ...product,
      ...(embedding ? { embedding } : {}),
    })
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
// DELETE
export async function deleteProduct(id: string) {
  try {
    await connectToDatabase()
    const res = await Product.findByIdAndDelete(id)
    if (!res) throw new Error('Product not found')
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
// GET ONE PRODUCT BY ID
export async function getProductById(productId: string) {
  await connectToDatabase()
  const product = await Product.findById(productId)
  return JSON.parse(JSON.stringify(product)) as IProduct
}

// GET ALL PRODUCTS FOR ADMIN
export async function getAllProductsForAdmin({
  query,
  page = 1,
  sort = 'latest',
  limit,
}: {
  query: string
  page?: number
  sort?: string
  limit?: number
}) {
  await connectToDatabase()

  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}

  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }
  const products = await Product.find({
    ...queryFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / pageSize),
    totalProducts: countProducts,
    from: pageSize * (Number(page) - 1) + 1,
    to: pageSize * (Number(page) - 1) + products.length,
  }
}

export async function getAllCategories() {
  await connectToDatabase()
  const categories = await Product.find({ isPublished: true }).distinct(
    'category'
  )
  return categories
}
export async function getProductsForCard({
  tag,
  limit = 4,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()
  const products = await Product.find(
    { tags: { $in: [tag] }, isPublished: true },
    {
      name: 1,
      href: { $concat: ['/product/', '$slug'] },
      image: { $arrayElemAt: ['$images', 0] },
    }
  )
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as {
    name: string
    href: string
    image: string
  }[]
}
// GET PRODUCTS BY TAG
export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  await connectToDatabase()
  const products = await Product.find({
    tags: { $in: [tag] },
    isPublished: true,
  })
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

// GET ONE PRODUCT BY SLUG
export async function getProductBySlug(slug: string) {
  await connectToDatabase()
  const product = await Product.findOne({ slug, isPublished: true })
  if (!product) throw new Error('Product not found')
  return JSON.parse(JSON.stringify(product)) as IProduct
}
// GET RELATED PRODUCTS: PRODUCTS WITH SAME CATEGORY
export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const conditions = {
    isPublished: true,
    category,
    _id: { $ne: productId },
  }
  const products = await Product.find(conditions)
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const productsCount = await Product.countDocuments(conditions)
  return {
    data: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(productsCount / limit),
  }
}

// GET ALL PRODUCTS
export async function getAllProducts({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
}: {
  query: string
  category: string
  tag: string
  limit?: number
  page: number
  price?: string
  rating?: string
  sort?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}
  const categoryFilter = category && category !== 'all' ? { category } : {}
  const tagFilter = tag && tag !== 'all' ? { tags: tag } : {}

  const ratingFilter =
    rating && rating !== 'all'
      ? {
          avgRating: {
            $gte: Number(rating),
          },
        }
      : {}
  // 10-50
  const priceFilter =
    price && price !== 'all'
      ? {
          price: {
            $gte: Number(price.split('-')[0]),
            $lte: Number(price.split('-')[1]),
          },
        }
      : {}
  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }
  const isPublished = { isPublished: true }
  const products = await Product.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + products.length,
  }
}

export async function getAllTags() {
  const tags = await Product.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: null, uniqueTags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, uniqueTags: 1 } },
  ])
  return (
    (tags[0]?.uniqueTags
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((x: string) =>
        x
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      ) as string[]) || []
  )
}

// ==================== VENDOR PRODUCT MANAGEMENT ====================

import { auth } from '@/auth'
import Vendor from '@/lib/db/models/vendor.model'
import { getTierLimits, hasExceededLimit, isUnlimited } from '@/lib/config/subscription-tiers'

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
    if (!vendor) {
      throw new Error('Vendor account not found')
    }

    if (vendor.status !== 'approved') {
      throw new Error('Your vendor account is not approved')
    }

    // Check product limit for tier
    const tierLimits = getTierLimits(vendor.subscriptionTier as keyof typeof getTierLimits)
    if (!isUnlimited(tierLimits.productLimit)) {
      const productCount = await Product.countDocuments({
        vendorId: vendor._id,
        status: 'published',
      })

      if (hasExceededLimit(productCount, tierLimits.productLimit)) {
        throw new Error(
          `Product limit (${tierLimits.productLimit}) reached for ${vendor.subscriptionTier} tier. Please upgrade your subscription.`
        )
      }
    }

    // Generate embedding
    let embedding: number[] = []
    try {
      const embeddingText = productToEmbeddingText({
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
      })
      embedding = await generateEmbedding(embeddingText)
    } catch (error) {
      console.warn('Failed to generate embedding for vendor product:', error)
    }

    // Create product with vendor ID
    const newProduct = await Product.create({
      ...product,
      vendorId: vendor._id,
      vendorName: vendor.businessName,
      embedding: embedding.length > 0 ? embedding : undefined,
    })

    revalidatePath('/vendor/products')
    return {
      success: true,
      message: 'Product created successfully',
      productId: newProduct._id,
    }
  } catch (error) {
    console.error('Create vendor product error:', error)
    return { success: false, message: formatError(error) }
  }
}

export async function getVendorProducts(page = 1, pageSize = 10) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    await connectToDatabase()

    const vendor = await Vendor.findOne({ userId: session.user.id })
    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const skip = (page - 1) * pageSize
    const products = await Product.find({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()

    const total = await Product.countDocuments({ vendorId: vendor._id })

    return {
      success: true,
      products,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('Get vendor products error:', error)
    return {
      success: false,
      message: formatError(error),
      products: [],
      pagination: { page: 1, pageSize: 10, total: 0, pages: 0 },
    }
  }
}

// GET VENDOR PRODUCTS FOR PUBLIC STOREFRONT
export async function getProductsByVendor({
  vendorId,
  page = 1,
  pageSize = 12,
  sort = 'latest',
}: {
  vendorId: string
  page?: number
  pageSize?: number
  sort?: string
}) {
  try {
    await connectToDatabase()

    const order: Record<string, 1 | -1> =
      sort === 'best-selling'
        ? { numSales: -1 }
        : sort === 'price-low-to-high'
          ? { price: 1 }
          : sort === 'price-high-to-low'
            ? { price: -1 }
            : sort === 'avg-customer-review'
              ? { avgRating: -1 }
              : { createdAt: -1 }

    const skip = (page - 1) * pageSize

    const products = await Product.find({
      vendorId,
      isPublished: true,
    })
      .sort(order)
      .skip(skip)
      .limit(pageSize)
      .lean()

    const total = await Product.countDocuments({
      vendorId,
      isPublished: true,
    })

    return {
      success: true,
      data: JSON.parse(JSON.stringify(products)) as IProduct[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error('Get vendor storefront products error:', error)
    return {
      success: false,
      message: formatError(error),
      data: [],
      pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
    }
  }
}

export async function updateVendorProduct(
  productId: string,
  data: z.infer<typeof ProductUpdateSchema>
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    const product = ProductUpdateSchema.parse(data)
    await connectToDatabase()

    // Verify ownership
    const existingProduct = await Product.findById(productId)
    if (!existingProduct) {
      throw new Error('Product not found')
    }

    const vendor = await Vendor.findOne({ userId: session.user.id })
    if (!vendor || existingProduct.vendorId.toString() !== vendor._id.toString()) {
      throw new Error('Unauthorized - product does not belong to your vendor account')
    }

    // Regenerate embedding if description or name changed
    let embedding = existingProduct.embedding
    if (
      product.name !== existingProduct.name ||
      product.description !== existingProduct.description
    ) {
      try {
        const embeddingText = productToEmbeddingText({
          name: product.name,
          description: product.description,
          category: product.category,
          brand: product.brand,
        })
        embedding = await generateEmbedding(embeddingText)
      } catch (error) {
        console.warn('Failed to regenerate embedding:', error)
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        ...product,
        ...(embedding && embedding.length > 0 ? { embedding } : {}),
      },
      { new: true }
    )

    revalidatePath('/vendor/products')
    return {
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    }
  } catch (error) {
    console.error('Update vendor product error:', error)
    return { success: false, message: formatError(error) }
  }
}

export async function deleteVendorProduct(productId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    await connectToDatabase()

    // Verify ownership
    const product = await Product.findById(productId)
    if (!product) {
      throw new Error('Product not found')
    }

    const vendor = await Vendor.findOne({ userId: session.user.id })
    if (!vendor || product.vendorId.toString() !== vendor._id.toString()) {
      throw new Error('Unauthorized')
    }

    await Product.findByIdAndDelete(productId)
    revalidatePath('/vendor/products')

    return {
      success: true,
      message: 'Product deleted successfully',
    }
  } catch (error) {
    console.error('Delete vendor product error:', error)
    return { success: false, message: formatError(error) }
  }
}
