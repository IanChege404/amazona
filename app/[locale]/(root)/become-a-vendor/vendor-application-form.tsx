'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IVendorApplication } from '@/types'
import { VendorApplicationSchema } from '@/lib/validator'
import { createVendorApplication } from '@/lib/actions/vendor.actions'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { UploadButton } from '@/lib/uploadthing'

const defaultValues: IVendorApplication = {
  businessName: '',
  description: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    country: '',
  },
  logo: '',
  banner: '',
}

export default function VendorApplicationForm() {
  const [step, setStep] = useState(1)
  const [logo, setLogo] = useState('')
  const [banner, setBanner] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<IVendorApplication>({
    resolver: zodResolver(VendorApplicationSchema),
    defaultValues,
  })

  const onSubmit = async (data: IVendorApplication) => {
    try {
      setIsLoading(true)
      const result = await createVendorApplication({
        ...data,
        logo,
        banner,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Your vendor application has been submitted. Our team will review it shortly.',
        })
        router.push('/')
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='w-full max-w-2xl mx-auto'>
      {/* Step Indicator */}
      <div className='mb-8'>
        <div className='flex justify-between items-center mb-4'>
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className='flex items-center'>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`h-1 w-20 mx-2 ${
                    step > stepNum ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className='flex justify-between text-sm'>
          <span>Business Details</span>
          <span>Media</span>
          <span>Review</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Step 1: Business Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Tell us about your business</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='businessName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g., Artisan Crafts Co.' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Describe your business, products, and values (10-500 characters)'
                          className='min-h-24'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='business@example.com' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder='+1 (555) 000-0000' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='space-y-4 pt-4 border-t'>
                  <h3 className='font-semibold'>Business Address</h3>

                  <FormField
                    control={form.control}
                    name='address.street'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder='123 Main St' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='address.city'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder='New York' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='address.country'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder='United States' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Media */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Business Media</CardTitle>
                <CardDescription>Upload your logo and banner (optional)</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <FormLabel className='mb-4 block'>Logo</FormLabel>
                  <div className='space-y-4'>
                    {logo && (
                      <div className='relative w-32 h-32 border rounded'>
                        <Image src={logo} alt='Logo preview' fill className='object-contain' />
                      </div>
                    )}
                    <UploadButton
                      endpoint='vendorLogo'
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) {
                          setLogo(res[0].url)
                          toast({
                            title: 'Success',
                            description: 'Logo uploaded',
                          })
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast({
                          title: 'Error',
                          description: `Upload failed: ${error.message}`,
                          variant: 'destructive',
                        })
                      }}
                    />
                  </div>
                </div>

                <div>
                  <FormLabel className='mb-4 block'>Banner</FormLabel>
                  <div className='space-y-4'>
                    {banner && (
                      <div className='relative w-full h-32 border rounded'>
                        <Image src={banner} alt='Banner preview' fill className='object-cover' />
                      </div>
                    )}
                    <UploadButton
                      endpoint='bannerImage'
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) {
                          setBanner(res[0].url)
                          toast({
                            title: 'Success',
                            description: 'Banner uploaded',
                          })
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast({
                          title: 'Error',
                          description: `Upload failed: ${error.message}`,
                          variant: 'destructive',
                        })
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Application</CardTitle>
                <CardDescription>Please verify all information before submitting</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3 bg-muted p-4 rounded-lg'>
                  <div>
                    <p className='text-sm font-semibold text-muted-foreground'>Business Name</p>
                    <p>{form.getValues('businessName')}</p>
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-muted-foreground'>Email</p>
                    <p>{form.getValues('email')}</p>
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-muted-foreground'>Phone</p>
                    <p>{form.getValues('phone')}</p>
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-muted-foreground'>Address</p>
                    <p>{form.getValues('address.street')}</p>
                    <p>
                      {form.getValues('address.city')}, {form.getValues('address.country')}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-muted-foreground'>Description</p>
                    <p className='text-sm'>{form.getValues('description')}</p>
                  </div>
                  {logo && (
                    <div>
                      <p className='text-sm font-semibold text-muted-foreground'>Logo</p>
                      <div className='relative w-16 h-16'>
                        <Image src={logo} alt='Logo' fill className='object-contain' />
                      </div>
                    </div>
                  )}
                  {banner && (
                    <div>
                      <p className='text-sm font-semibold text-muted-foreground'>Banner</p>
                      <div className='relative w-full h-20'>
                        <Image src={banner} alt='Banner' fill className='object-cover' />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className='flex justify-between'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Previous
            </Button>

            {step < 3 ? (
              <Button
                type='button'
                onClick={() => {
                  if (step === 1) {
                    form.trigger(['businessName', 'description', 'email', 'phone', 'address.street', 'address.city', 'address.country']).then((valid) => {
                      if (valid) setStep(step + 1)
                    })
                  } else {
                    setStep(step + 1)
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
