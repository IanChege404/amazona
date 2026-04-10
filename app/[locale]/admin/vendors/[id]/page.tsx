import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { connectToDatabase } from '@/lib/db'
import Vendor, { IVendor } from '@/lib/db/models/vendor.model'
import Product from '@/lib/db/models/product.model'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2, XCircle, ArrowLeft, Package, DollarSign, ShoppingCart, Star } from 'lucide-react'
import VendorApprovalActions from './vendor-approval-actions'

export const metadata: Metadata = {
  title: 'Admin - Vendor Detail',
}

interface PopulatedUser {
  name: string
  email: string
}

type PopulatedVendor = Omit<IVendor, 'userId'> & { userId: PopulatedUser }

function isPopulatedVendor(vendor: unknown): vendor is PopulatedVendor {
  if (!vendor || typeof vendor !== 'object') return false
  const v = vendor as Record<string, unknown>
  return (
    typeof v.userId === 'object' &&
    v.userId !== null &&
    typeof (v.userId as Record<string, unknown>).name === 'string'
  )
}

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await connectToDatabase()

  const rawVendor = await Vendor.findById(id).populate('userId', 'name email').lean()

  if (!rawVendor || !isPopulatedVendor(rawVendor)) {
    notFound()
  }

  const vendor = rawVendor

  const products = await Product.find({ vendorId: id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  const totalProducts = await Product.countDocuments({ vendorId: id })
  const publishedProducts = await Product.countDocuments({ vendorId: id, isPublished: true })

  const vendorUser = vendor.userId

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Link href='/admin/vendors'>
          <Button variant='outline' size='sm'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Vendors
          </Button>
        </Link>
        <div>
          <h1 className='text-3xl font-bold'>{vendor.businessName}</h1>
          <p className='text-muted-foreground'>Vendor ID: {id}</p>
        </div>
      </div>

      {/* Status & Actions */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Vendor Status</CardTitle>
            <div className='flex items-center gap-3'>
              {vendor.status === 'approved' ? (
                <Badge className='bg-green-100 text-green-800'>
                  <CheckCircle2 className='w-3 h-3 mr-1' />
                  Approved
                </Badge>
              ) : vendor.status === 'pending' ? (
                <Badge variant='secondary'>Pending Review</Badge>
              ) : (
                <Badge variant='destructive'>
                  <XCircle className='w-3 h-3 mr-1' />
                  Suspended
                </Badge>
              )}
              <VendorApprovalActions
                vendorId={id}
                vendorName={vendor.businessName}
                currentStatus={vendor.status}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Revenue</p>
                <p className='text-2xl font-bold'>${vendor.totalRevenue?.toFixed(2) ?? '0.00'}</p>
              </div>
              <DollarSign className='w-8 h-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Orders</p>
                <p className='text-2xl font-bold'>{vendor.totalOrders ?? 0}</p>
              </div>
              <ShoppingCart className='w-8 h-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Products</p>
                <p className='text-2xl font-bold'>{totalProducts}</p>
                <p className='text-xs text-muted-foreground'>{publishedProducts} published</p>
              </div>
              <Package className='w-8 h-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Rating</p>
                <p className='text-2xl font-bold'>{vendor.rating?.toFixed(1) ?? '0.0'}</p>
                <p className='text-xs text-muted-foreground'>{vendor.numReviews ?? 0} reviews</p>
              </div>
              <Star className='w-8 h-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Details */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {vendor.logo && (
              <div className='flex items-center gap-4'>
                <div className='relative w-16 h-16 border rounded'>
                  <Image src={vendor.logo} alt={vendor.businessName} fill className='object-contain' />
                </div>
                <span className='text-sm text-muted-foreground'>Business Logo</span>
              </div>
            )}
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='font-semibold text-muted-foreground'>Business Name</p>
                <p>{vendor.businessName}</p>
              </div>
              <div>
                <p className='font-semibold text-muted-foreground'>Email</p>
                <p>{vendor.email}</p>
              </div>
              <div>
                <p className='font-semibold text-muted-foreground'>Phone</p>
                <p>{vendor.phone || 'N/A'}</p>
              </div>
              <div>
                <p className='font-semibold text-muted-foreground'>Applied</p>
                <p>{formatDateTime(new Date(vendor.createdAt)).dateTime}</p>
              </div>
              {vendor.address && (
                <div className='col-span-2'>
                  <p className='font-semibold text-muted-foreground'>Address</p>
                  <p>
                    {[vendor.address.street, vendor.address.city, vendor.address.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
              <div className='col-span-2'>
                <p className='font-semibold text-muted-foreground'>Description</p>
                <p className='text-sm'>{vendor.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Owner</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='font-semibold text-muted-foreground'>Name</p>
                <p>{vendorUser?.name || 'N/A'}</p>
              </div>
              <div>
                <p className='font-semibold text-muted-foreground'>Email</p>
                <p>{vendorUser?.email || 'N/A'}</p>
              </div>
            </div>

            <div className='pt-4 border-t space-y-3'>
              <div className='text-sm'>
                <p className='font-semibold text-muted-foreground'>Stripe Account</p>
                <p>{vendor.stripeAccountId || 'Not connected'}</p>
              </div>
              <div className='text-sm'>
                <p className='font-semibold text-muted-foreground'>Stripe Onboarding</p>
                <Badge variant={vendor.stripeOnboardingComplete ? 'default' : 'secondary'}>
                  {vendor.stripeOnboardingComplete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
              <div className='text-sm'>
                <p className='font-semibold text-muted-foreground'>Commission Rate</p>
                <p>{vendor.commissionRate ?? 10}%</p>
              </div>
              <div className='text-sm'>
                <p className='font-semibold text-muted-foreground'>Subscription</p>
                <Badge variant='outline'>{vendor.subscriptionTier ?? 'free'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                {totalProducts} total product{totalProducts !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className='text-center py-8 text-muted-foreground'>No products yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={String(product._id)}>
                    <TableCell>
                      {product.images?.[0] ? (
                        <div className='relative w-10 h-10'>
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className='object-cover rounded'
                          />
                        </div>
                      ) : (
                        <div className='w-10 h-10 bg-muted rounded flex items-center justify-center text-xs'>
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price?.toFixed(2)}</TableCell>
                    <TableCell>{product.countInStock}</TableCell>
                    <TableCell>
                      <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
