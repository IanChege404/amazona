'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'
import { useToast } from '@/hooks/use-toast'
import { UploadButton } from '@/lib/uploadthing'
import { Card, CardContent } from '@/components/ui/card'

type UploadEndpoint = keyof OurFileRouter

interface ProductImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  endpoint?: UploadEndpoint
  renderExtraActions?: (image: string, remove: () => void) => ReactNode
}

export default function ProductImageUploader({
  images,
  onChange,
  endpoint = 'productImage',
  renderExtraActions,
}: ProductImageUploaderProps) {
  const { toast } = useToast()

  return (
    <Card>
      <CardContent className='space-y-2 mt-2 min-h-48'>
        <div className='flex justify-start items-center space-x-2 flex-wrap'>
          {images.map((image) => (
            <div key={image} className='relative group'>
              <Image
                src={image}
                alt='product image'
                className='w-20 h-20 object-cover object-center rounded-sm'
                width={100}
                height={100}
              />
              <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm flex items-center justify-center'>
                <div className='flex flex-col items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => onChange(images.filter((img) => img !== image))}
                    className='text-white text-xs font-medium bg-red-600 px-2 py-0.5 rounded'
                  >
                    Remove
                  </button>
                  {renderExtraActions?.(image, () =>
                    onChange(images.filter((img) => img !== image))
                  )}
                </div>
              </div>
            </div>
          ))}
          <UploadButton
            endpoint={endpoint}
            onClientUploadComplete={(res: { url: string }[]) => {
              if (res?.[0]?.url) {
                onChange([...images, res[0].url])
                toast({ description: 'Image uploaded successfully' })
              }
            }}
            onUploadError={(error: Error) => {
              toast({
                variant: 'destructive',
                description: `Upload error: ${error.message}`,
              })
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
