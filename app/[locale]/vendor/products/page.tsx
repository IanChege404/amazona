import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { connectToDatabase } from '@/lib/db'
import Vendor from '@/lib/db/models/vendor.model'
import { getVendorProducts } from '@/lib/actions/product.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = {
  title: 'Vendor Products',
}

export default async function VendorProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  await connectToDatabase()

  const vendor = await Vendor.findOne({ userId: session.user.id })

  if (!vendor || vendor.status !== 'approved') {
    redirect('/vendor/dashboard')
  }

  const params = await searchParams
  const page = Number(params.page) || 1

  const { products, pagination } = await getVendorProducts(page, 10)

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Products</h1>
          <p className='text-muted-foreground'>Manage your product listings</p>
        </div>
        <Link href='/vendor/products/new'>
          <Button>Add Product</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>
            {pagination.total} product{pagination.total !== 1 ? 's' : ''} in your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>Create your first product to start selling</p>
              <Link href='/vendor/products/new'>
                <Button>Create First Product</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
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
                        <TableCell className='font-medium max-w-[200px] truncate'>
                          {product.name}
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>${product.price?.toFixed(2)}</TableCell>
                        <TableCell>{product.countInStock}</TableCell>
                        <TableCell>
                          <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                            {product.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/products/${product._id}`}>
                            <Button variant='outline' size='sm'>
                              Edit
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination.pages > 1 && (
                <div className='flex justify-between items-center mt-4 pt-4 border-t'>
                  <p className='text-sm text-muted-foreground'>
                    Page {page} of {pagination.pages}
                  </p>
                  <div className='flex gap-2'>
                    {page > 1 && (
                      <Link href={`/vendor/products?page=${page - 1}`}>
                        <Button variant='outline' size='sm'>Previous</Button>
                      </Link>
                    )}
                    {page < pagination.pages && (
                      <Link href={`/vendor/products?page=${page + 1}`}>
                        <Button variant='outline' size='sm'>Next</Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
