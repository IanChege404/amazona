import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vendor Products',
}

export default async function VendorProductsPage() {
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
          <CardDescription>You don&rsquo;t have any products yet</CardDescription>
        </CardHeader>
        <CardContent className='text-center py-12'>
          <p className='text-muted-foreground mb-4'>Create your first product to start selling</p>
          <Link href='/vendor/products/new'>
            <Button>Create First Product</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
