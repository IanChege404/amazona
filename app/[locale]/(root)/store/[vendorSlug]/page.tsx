import { notFound } from 'next/navigation'
import { getVendorBySlug, getVendorStats } from '@/lib/actions/vendor.actions'
import { getProductsByVendor } from '@/lib/actions/product.actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProductSlider from '@/components/shared/product/product-slider'
import { Star, MapPin, Package } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: {
  params: Promise<{ vendorSlug: string }>
}) {
  const t = await getTranslations()
  const params = await props.params
  const { data: vendor } = await getVendorBySlug(params.vendorSlug)

  if (!vendor) {
    return { title: t('Store.Vendor not found') }
  }

  return {
    title: `${vendor.businessName} Store`,
    description: vendor.description,
    openGraph: {
      title: `${vendor.businessName} Store`,
      description: vendor.description,
      images: vendor.banner ? [vendor.banner] : [],
    },
  }
}

export default async function VendorStorePage(props: {
  params: Promise<{ vendorSlug: string }>,
  searchParams: Promise<{ page: string; sort: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const t = await getTranslations()

  const { data: vendor, success: vendorSuccess } = await getVendorBySlug(
    params.vendorSlug
  )

  if (!vendorSuccess || !vendor) {
    notFound()
  }

  // Get vendor products
  const { data: products, pagination } = await getProductsByVendor({
    vendorId: vendor._id.toString(),
    page: Number(searchParams.page) || 1,
    sort: searchParams.sort || 'latest',
  })

  // Get vendor statistics
  const statsResult = await getVendorStats(vendor._id.toString())
  const stats = statsResult.success ? statsResult.data : null

  return (
    <div className="w-full">
      {/* Vendor Banner Hero */}
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-slate-200 to-slate-300 overflow-hidden">
        {vendor.banner && (
          <img
            src={vendor.banner}
            alt={vendor.businessName}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Vendor Logo and Name */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 p-6 bg-gradient-to-t from-black/60 to-transparent">
          {vendor.logo && (
            <img
              src={vendor.logo}
              alt={vendor.businessName}
              className="w-24 h-24 rounded-lg border-4 border-white shadow-lg object-cover"
            />
          )}
          <div className="flex-1 text-white pb-2">
            <h1 className="text-3xl font-bold">{vendor.businessName}</h1>
            <p className="text-sm opacity-90">{vendor.description}</p>
          </div>
        </div>
      </div>

      {/* Vendor Info Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Rating */}
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">
                {vendor.rating ? vendor.rating.toFixed(1) : '0'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {vendor.numReviews} {t('Store.reviews')}
            </p>
          </Card>

          {/* Products */}
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats?.totalProducts || 0}</span>
            </div>
            <p className="text-xs text-gray-600">{t('Store.products')}</p>
          </Card>

          {/* Total Orders */}
          <Card className="p-4 text-center">
            <div className="mb-2 text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-600">{t('Store.orders_completed')}</p>
          </Card>

          {/* Location */}
          {vendor.address && (
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xs text-gray-600">
                {vendor.address.city}, {vendor.address.country}
              </p>
            </Card>
          )}
        </div>

        {/* Vendor Contact and Details */}
        <div className="bg-slate-50 rounded-lg p-6 mb-8 border">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-semibold mb-3">{t('Store.about_store')}</h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                {vendor.description}
              </p>
            </div>
            <div>
              <h2 className="font-semibold mb-3">{t('Store.contact_info')}</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">{t('Store.email')}:</span>{' '}
                  <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                    {vendor.email}
                  </a>
                </p>
                {vendor.phone && (
                  <p>
                    <span className="text-gray-600">{t('Store.phone')}:</span> {vendor.phone}
                  </p>
                )}
                {vendor.address && (
                  <p>
                    <span className="text-gray-600">{t('Store.address')}:</span>{' '}
                    {vendor.address.street}, {vendor.address.city}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{t('Store.featured_products')}</h2>

          {products && products.length > 0 ? (
            <>
              <ProductSlider
                products={products}
                title=""
                hideDetails={true}
              />

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <Link
                      key={i + 1}
                      href={`/store/${params.vendorSlug}?page=${i + 1}`}
                    >
                      <Button
                        variant={
                          pagination.page === i + 1 ? 'default' : 'outline'
                        }
                        size="sm"
                      >
                        {i + 1}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">{t('Store.no_products')}</p>
            </Card>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center border border-blue-200">
          <h3 className="text-xl font-bold mb-2">{t('Store.interested_in_products')}</h3>
          <p className="text-gray-600 mb-4">{t('Store.explore_more_products')}</p>
          <Link href={`/search?vendor=${vendor._id}`}>
            <Button>{t('Store.view_all_products')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
