'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { updateUserEmail } from '@/lib/actions/user.actions'
import { UserUpdateEmailSchema } from '@/lib/validator'

export function EmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, update } = useSession()

  const form = useForm<z.infer<typeof UserUpdateEmailSchema>>({
    resolver: zodResolver(UserUpdateEmailSchema),
    defaultValues: {
      email: initialEmail,
      currentPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof UserUpdateEmailSchema>) {
    const res = await updateUserEmail(values)
    if (!res.success) {
      toast({ variant: 'destructive', description: res.message })
      return
    }

    await update({
      user: {
        ...session?.user,
        email: values.email,
      },
    })

    toast({ description: res.message })
    router.push('/account/manage')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email</FormLabel>
              <FormControl>
                <Input placeholder='Enter new email' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='currentPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type='password' placeholder='Enter current password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  )
}
