import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import { Card, CardContent } from '@/components/ui/card'
import { getUserById } from '@/lib/actions/user.actions'
import { AddressForm } from './address-form'

const PAGE_TITLE = 'Your Addresses'

export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function AddressesPage() {
  const session = await auth()
  const user = session?.user?.id ? await getUserById(session.user.id) : null

  const hasAddress = Boolean(user?.address)

  return (
    <div className='mb-24'>
      <div className='flex gap-2'>
        <Link href='/account'>Your Account</Link>
        <span>›</span>
        <span>{PAGE_TITLE}</span>
      </div>

      <h1 className='h1-bold py-4'>{PAGE_TITLE}</h1>

      <Card className='max-w-3xl'>
        <CardContent className='p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Default Address</h2>
          {!hasAddress && (
            <p className='text-muted-foreground'>
              You have not saved an address yet. Add one below.
            </p>
          )}
          <AddressForm initialAddress={user?.address} />
        </CardContent>
      </Card>
    </div>
  )
}
