'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { approveVendor, suspendVendor } from '@/lib/actions/vendor.actions'
import { useRouter } from 'next/navigation'

interface VendorApprovalActionsProps {
  vendorId: string
  vendorName: string
  currentStatus: string
}

export default function VendorApprovalActions({
  vendorId,
  vendorName,
  currentStatus,
}: VendorApprovalActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveVendor(vendorId)
      if (result.success) {
        toast({ title: 'Success', description: `${vendorName} has been approved` })
        router.refresh()
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
    })
  }

  const handleSuspend = () => {
    startTransition(async () => {
      const result = await suspendVendor(vendorId)
      if (result.success) {
        toast({ title: 'Success', description: `${vendorName} has been suspended` })
        router.refresh()
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' })
      }
    })
  }

  return (
    <div className='flex gap-2'>
      {currentStatus === 'pending' && (
        <Button
          size='sm'
          className='bg-green-600 hover:bg-green-700'
          onClick={handleApprove}
          disabled={isPending}
        >
          {isPending ? 'Approving...' : 'Approve'}
        </Button>
      )}
      {currentStatus !== 'suspended' && (
        <Button
          size='sm'
          variant='destructive'
          onClick={handleSuspend}
          disabled={isPending}
        >
          {isPending ? 'Suspending...' : 'Suspend'}
        </Button>
      )}
      {currentStatus === 'suspended' && (
        <Button
          size='sm'
          className='bg-green-600 hover:bg-green-700'
          onClick={handleApprove}
          disabled={isPending}
        >
          {isPending ? 'Reinstating...' : 'Reinstate'}
        </Button>
      )}
    </div>
  )
}
