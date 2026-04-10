import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import VendorProductForm from '../vendor-product-form'
import { connectToDatabase } from '@/lib/db'
import Vendor from '@/lib/db/models/vendor.model'

export const metadata: Metadata = {
  title: 'Create Product | Vendor Dashboard',
}

export default async function CreateProductPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  await connectToDatabase()

  // Get vendor info to ensure they're approved
  const vendor = await Vendor.findOne({ userId: session.user.id })

  if (!vendor || vendor.status !== 'approved') {
    redirect('/vendor/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
          <p className="text-muted-foreground mt-2">Add a new product to your store</p>
        </div>
        <Link href="/vendor/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Fill in the product information below to create a new listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorProductForm vendorId={vendor._id.toString()} vendorName={vendor.businessName} />
        </CardContent>
      </Card>
    </div>
  )
}
