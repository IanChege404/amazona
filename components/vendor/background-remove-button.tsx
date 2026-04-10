'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Loader2, Wand2 } from 'lucide-react'

interface BackgroundRemoveButtonProps {
  imageUrl: string
  onResult: (processedImageBase64: string) => void
}

export function BackgroundRemoveButton({ imageUrl, onResult }: BackgroundRemoveButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRemoveBackground = async () => {
    if (!imageUrl) {
      toast({
        variant: 'destructive',
        title: 'No Image',
        description: 'Please upload an image first.',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove background')
      }

      const { image } = await response.json()
      onResult(image)
      toast({
        title: 'Background Removed',
        description: 'Background successfully removed from image.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to remove background',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={handleRemoveBackground}
      disabled={loading || !imageUrl}
      className='gap-2'
      title='Remove background from image'
    >
      {loading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <Wand2 className='h-4 w-4' />
      )}
      {loading ? 'Removing...' : 'Remove BG'}
    </Button>
  )
}
