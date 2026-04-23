'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createProduct } from '@/lib/actions/product.actions'
import { UploadButton } from '@/lib/uploadthing'
import { ProductInputSchema } from '@/lib/validator'
import { Checkbox } from '@/components/ui/checkbox'
import { toSlug } from '@/lib/utils'
import { IProductInput } from '@/types'
import { AIDescriptionButton } from '@/components/vendor/ai-description-button'
import { BackgroundRemoveButton } from '@/components/vendor/background-remove-button'
import ProductImageUploader from '@/components/shared/product-image-uploader'
import { useState } from 'react'

const productDefaultValues: IProductInput =
  {
    name: '',
    slug: '',
    category: '',
    images: [],
    brand: '',
    description: '',
    price: 0,
    listPrice: 0,
    countInStock: 0,
    numReviews: 0,
    avgRating: 0,
    numSales: 0,
    isPublished: false,
    tags: [],
    sizes: [],
    colors: [],
    ratingDistribution: [],
    reviews: [],
    vendorId: '',
    vendorName: '',
  }

interface VendorProductFormProps {
  vendorId: string
  vendorName: string
}

const VendorProductForm = ({ vendorId, vendorName }: VendorProductFormProps) => {
  const router = useRouter()

  const form = useForm<IProductInput>({
    resolver: zodResolver(ProductInputSchema),
    defaultValues: {
      ...productDefaultValues,
      vendorId,
      vendorName,
    },
  })

  const { toast } = useToast()
  const [imageUrl, setImageUrl] = useState('')

  async function onSubmit(values: IProductInput) {
    // Ensure vendorId and vendorName are set
    const productData = {
      ...values,
      vendorId,
      vendorName,
    }

    const res = await createProduct(productData)
    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      })
    } else {
      toast({
        description: res.message,
      })
      router.push(`/vendor/products`)
    }
  }

  const images = form.watch('images')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter product slug"
                      className="pl-8"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue('slug', toSlug(form.getValues('name')))
                      }}
                      className="absolute right-2 top-2.5 text-sm text-primary hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Electronics, Clothing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="listPrice"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>List Price (Original)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Selling Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countInStock"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem className="w-full">
                <FormLabel>Product Images</FormLabel>
                <FormControl>
                  <div className='space-y-3'>
                    <ProductImageUploader
                      images={images}
                      onChange={(nextImages) => form.setValue('images', nextImages)}
                      endpoint='productImage'
                      renderExtraActions={(image) => (
                        <BackgroundRemoveButton
                          imageUrl={image}
                          onResult={(base64: string) => {
                            form.setValue(
                              'images',
                              images.map((img: string) => (img === image ? base64 : img))
                            )
                          }}
                        />
                      )}
                    />
                    <div className='flex gap-2'>
                      <Input
                        placeholder='Or paste image URL (e.g. /images/p11-1.jpg)'
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          const trimmedUrl = imageUrl.trim()
                          if (!trimmedUrl) return
                          form.setValue('images', [...images, trimmedUrl], {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          setImageUrl('')
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <FormLabel>Description</FormLabel>
                  <AIDescriptionButton
                    productName={form.watch('name') || ''}
                    category={form.watch('category') || ''}
                    keyFeatures={form.watch('brand') ? [form.watch('brand')] : []}
                    onGenerate={(text) => form.setValue('description', text)}
                  />
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Describe your product in detail..."
                    className="resize-none min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide a clear and detailed description to help customers understand your product
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="space-x-3 flex items-center">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="cursor-pointer">Publish this product</FormLabel>
                  <FormDescription>
                    Published products are visible to customers
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting}
            className="w-full md:w-auto"
          >
            {form.formState.isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push('/vendor/products')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default VendorProductForm
