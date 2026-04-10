import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { connectToDatabase } from '@/lib/db'
import Vendor from '@/lib/db/models/vendor.model'
import { getVendorOrders } from '@/lib/actions/order.actions'
import Link from 'next/link'

interface OrderUser {
  name: string
  email: string
}

interface OrderItem {
  price: number
  quantity: number
}

interface VendorOrder {
  _id: string
  user: OrderUser
  items: OrderItem[]
  isPaid: boolean
  isDelivered: boolean
  createdAt: Date
}

export const metadata: Metadata = {
  title: 'Orders | Vendor Dashboard',
}

export default async function VendorOrdersPage({
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
  const { data: orders, totalPages } = await getVendorOrders({
    vendorId: vendor._id.toString(),
    page,
  })

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-2">Track and manage your orders</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Your orders will appear here</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Once customers purchase your products, they will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage orders for your products
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            Showing page {page} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: VendorOrder) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-sm">
                      {String(order._id).slice(-8)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{order.user?.name || 'Customer'}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.user?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${(
                        order.items?.reduce(
                          (sum: number, item: OrderItem) =>
                            sum + item.price * item.quantity,
                          0
                        ) || 0
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge
                          variant={order.isPaid ? 'default' : 'secondary'}
                          className={
                            order.isPaid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {order.isPaid ? 'Paid' : 'Pending'}
                        </Badge>
                        <Badge
                          variant={order.isDelivered ? 'default' : 'secondary'}
                          className={
                            order.isDelivered
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {order.isDelivered ? 'Delivered' : 'Pending'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders/${order._id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/vendor/orders?page=${page - 1}`}>
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/vendor/orders?page=${page + 1}`}>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
