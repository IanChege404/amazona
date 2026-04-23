import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import { Card, CardContent } from '@/components/ui/card'
import { EmailForm } from './email-form'

const PAGE_TITLE = 'Change Your Email'

export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function ManageEmailPage() {
  const session = await auth()

  return (
    <div className='mb-24'>
      <div className='flex gap-2'>
        <Link href='/account'>Your Account</Link>
        <span>›</span>
        <Link href='/account/manage'>Login & Security</Link>
        <span>›</span>
        <span>{PAGE_TITLE}</span>
      </div>

      <h1 className='h1-bold py-4'>{PAGE_TITLE}</h1>

      <Card className='max-w-2xl'>
        <CardContent className='p-4 space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Update your account email. You must confirm your current password.
          </p>
          <EmailForm initialEmail={session?.user.email ?? ''} />
        </CardContent>
      </Card>
    </div>
  )
}
