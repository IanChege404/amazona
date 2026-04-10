'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Wand2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface BackgroundRemoverProps {
  imageUrl: string
  onApply?: (base64Image: string) => void
}

export function BackgroundRemover({ imageUrl, onApply }: BackgroundRemoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const { toast } = useToast()

  const handleRemoveBackground = async () => {
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

      const data = await response.json()
      setResult(data.image)
      setRemaining(data.remaining)

      toast({
        title: 'Success',
        description: 'Background removed successfully!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to remove background',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const link = document.createElement('a')
    link.href = result
    link.download = `product-no-bg-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleApply = () => {
    if (result && onApply) {
      onApply(result)
      setIsOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Wand2 className="w-4 h-4" />
        Remove Background
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Remove Image Background</DialogTitle>
            <DialogDescription>
              Use AI to automatically remove the background from your product
              image
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 my-6">
            {/* Original */}
            <div>
              <p className="text-sm font-medium mb-2">Original</p>
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                <Image
                  src={imageUrl}
                  alt="Original"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Result */}
            <div>
              <p className="text-sm font-medium mb-2">
                {result ? 'Result' : 'Processing...'}
              </p>
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                ) : result ? (
                  <Image
                    src={result}
                    alt="Result"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Wand2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">
                      Click "Remove" to process
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {remaining !== null && (
            <p className="text-xs text-gray-600">
              Remaining uses today: {remaining}
            </p>
          )}

          <DialogFooter>
            {!result ? (
              <Button
                onClick={handleRemoveBackground}
                disabled={loading}
                className="gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Remove Background
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button onClick={handleApply} className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  Apply to Image
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
