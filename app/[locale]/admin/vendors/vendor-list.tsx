'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IVendor } from '@/lib/db/models/vendor.model'
import { getAllVendors, approveVendor, suspendVendor } from '@/lib/actions/vendor.actions'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, XCircle, Eye } from 'lucide-react'

interface VendorListDataProps {
  vendors: (IVendor & { userId?: { name: string; email: string } })[]
}

export default function VendorList() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'suspended' | 'all'>('pending')
  const [data, setData] = useState<VendorListDataProps | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadVendors = (filterStatus?: 'pending' | 'approved' | 'suspended' | undefined) => {
    startTransition(async () => {
      const result = await getAllVendors({
        status: filterStatus,
      })
      if (result.success) {
        setData({ vendors: (result.data || []) as unknown as (IVendor & { userId?: { name: string; email: string } })[] })
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  useEffect(() => {
    const filterStatus = status === 'all' ? undefined : status
    loadVendors(filterStatus)
  }, [status])

  const handleApprove = (vendorId: string, vendorName: string) => {
    startTransition(async () => {
      const result = await approveVendor(vendorId)
      if (result.success) {
        toast({
          title: 'Success',
          description: `${vendorName} has been approved`,
        })
        const filterStatus = status === 'all' ? undefined : status
        loadVendors(filterStatus)
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const handleSuspend = (vendorId: string, vendorName: string) => {
    startTransition(async () => {
      const result = await suspendVendor(vendorId)
      if (result.success) {
        toast({
          title: 'Success',
          description: `${vendorName} has been suspended`,
        })
        const filterStatus = status === 'all' ? undefined : status
        loadVendors(filterStatus)
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className='bg-green-100 text-green-800'>
            <CheckCircle2 className='w-3 h-3 mr-1' />
            Approved
          </Badge>
        )
      case 'pending':
        return <Badge variant='secondary'>Pending Review</Badge>
      case 'suspended':
        return (
          <Badge variant='destructive'>
            <XCircle className='w-3 h-3 mr-1' />
            Suspended
          </Badge>
        )
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Vendor Management</h1>
      </div>

      {/* Status Tabs */}
      <Tabs value={status} onValueChange={(value: string) => setStatus(value as 'pending' | 'approved' | 'suspended' | 'all')}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='pending'>
            Pending
            {(data?.vendors?.filter((v) => v.status === 'pending')?.length ?? 0) > 0 && (
              <span className='ml-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                {data?.vendors?.filter((v) => v.status === 'pending')?.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value='approved'>Approved</TabsTrigger>
          <TabsTrigger value='suspended'>Suspended</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className='space-y-4'>
          {isPending ? (
            <div className='text-center py-8'>Loading vendors...</div>
          ) : data?.vendors && data.vendors.length > 0 ? (
            <div className='rounded-lg border overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vendors.map((vendor) => (
                    <TableRow key={String(vendor._id)}>
                      <TableCell>
                        {vendor.logo ? (
                          <div className='relative w-10 h-10'>
                            <Image
                              src={vendor.logo}
                              alt={vendor.businessName}
                              fill
                              className='object-contain'
                            />
                          </div>
                        ) : (
                          <div className='w-10 h-10 bg-muted rounded flex items-center justify-center text-xs'>
                            No Logo
                          </div>
                        )}
                      </TableCell>
                      <TableCell className='font-semibold'>{vendor.businessName}</TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          <div>{vendor.userId?.name || 'N/A'}</div>
                          <div className='text-xs text-muted-foreground'>
                            {vendor.userId?.email || vendor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell>${vendor.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell>{vendor.totalOrders}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {formatDateTime(new Date(vendor.createdAt)).dateTime}
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Link href={`/admin/vendors/${vendor._id}`}>
                            <Button size='sm' variant='outline'>
                              <Eye className='w-4 h-4' />
                            </Button>
                          </Link>

                          {vendor.status === 'pending' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size='sm' className='bg-green-600 hover:bg-green-700'>
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Approve Vendor</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve {vendor.businessName}? They will be
                                  able to start selling immediately.
                                </AlertDialogDescription>
                                <div className='flex justify-end gap-2'>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleApprove(String(vendor._id), vendor.businessName)
                                    }
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {vendor.status !== 'suspended' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size='sm' variant='destructive'>
                                  Suspend
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Suspend Vendor</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to suspend {vendor.businessName}? They will not
                                  be able to sell or access their dashboard.
                                </AlertDialogDescription>
                                <div className='flex justify-end gap-2'>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleSuspend(String(vendor._id), vendor.businessName)
                                    }
                                    className='bg-destructive'
                                  >
                                    Suspend
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='text-center py-12 text-muted-foreground'>
              No vendors found with status {status}.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
