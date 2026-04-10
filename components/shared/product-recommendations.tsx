'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Star } from 'lucide-react'

interface Product {
  _id: string
  name: string
  slug: string
  images: string[]
  price: number
  avgRating: number
  numReviews: number
  category: string
  brand?: string
}

interface ProductRecommendationsProps {
  productId?: string
  userId?: string
  category?: string
  type?: 'similar' | 'personalized' | 'trending' | 'toprated' | 'seasonal'
  title?: string
  limit?: number
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`} className='group block'>
      <Card className='h-full hover:shadow-md transition-shadow overflow-hidden'>
        <div className='relative aspect-square'>
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className='object-cover group-hover:scale-105 transition-transform duration-300'
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            />
          ) : (
            <div className='w-full h-full bg-muted flex items-center justify-center'>
              <span className='text-xs text-muted-foreground'>No image</span>
            </div>
          )}
        </div>
        <CardContent className='p-3'>
          <Badge variant='secondary' className='text-xs mb-1'>
            {product.category}
          </Badge>
          <p className='font-medium text-sm line-clamp-2 mb-1'>{product.name}</p>
          <div className='flex items-center justify-between'>
            <span className='font-bold text-sm'>${product.price?.toFixed(2)}</span>
            {product.numReviews > 0 && (
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Star className='w-3 h-3 fill-yellow-400 text-yellow-400' />
                <span>{product.avgRating?.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ProductCardSkeleton() {
  return (
    <Card className='overflow-hidden'>
      <Skeleton className='aspect-square' />
      <CardContent className='p-3 space-y-2'>
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
        <div className='flex justify-between'>
          <Skeleton className='h-4 w-12' />
          <Skeleton className='h-4 w-10' />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductRecommendations({
  productId,
  userId,
  category,
  type = 'trending',
  title,
  limit = 8,
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({ type, limit: String(limit) })
        if (productId) params.set('productId', productId)
        if (userId) params.set('userId', userId)
        if (category) params.set('category', category)

        const response = await fetch(`/api/recommendations?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch recommendations')

        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [productId, userId, category, type, limit])

  const defaultTitle =
    type === 'similar'
      ? 'Similar Products'
      : type === 'personalized'
        ? 'Recommended for You'
        : type === 'toprated'
          ? 'Top Rated'
          : type === 'seasonal'
            ? 'Seasonal Picks'
            : 'Trending Products'

  if (error) return null

  if (loading) {
    return (
      <div className='space-y-4'>
        <CardHeader className='px-0 pt-0'>
          <CardTitle>{title || defaultTitle}</CardTitle>
        </CardHeader>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {Array.from({ length: Math.min(limit, 4) }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className='space-y-4'>
      <CardHeader className='px-0 pt-0'>
        <CardTitle>{title || defaultTitle}</CardTitle>
      </CardHeader>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  )
}
