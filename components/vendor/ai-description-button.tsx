'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Loader2, Sparkles } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AIDescriptionButtonProps {
  productName: string
  category: string
  keyFeatures: string[]
  onGenerate: (description: string) => void
}

export function AIDescriptionButton({
  productName,
  category,
  keyFeatures,
  onGenerate,
}: AIDescriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [generatedText, setGeneratedText] = useState<string | null>(null)

  const isReady = productName && category && keyFeatures.length > 0

  const handleGenerate = async () => {
    if (!isReady) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in product name, category, and at least one feature.',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category,
          keyFeatures: keyFeatures.filter((f) => f.trim()),
          tone: 'professional',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate description')
      }

      const { description, remaining } = await response.json()
      setGeneratedText(description)
      setShowConfirm(true)

      if (remaining !== undefined) {
        toast({
          description: `Generated! (${remaining} uses left today)`,
        })
      }
    } catch (error) {
      console.error('Error generating description:', error)
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description:
          error instanceof Error ? error.message : 'Could not generate description',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (generatedText) {
      onGenerate(generatedText)
      setShowConfirm(false)
      setGeneratedText(null)
      toast({
        title: 'Done!',
        description: 'Description inserted into the form.',
      })
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={loading || !isReady}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? 'Generating...' : 'Generate with AI'}
      </Button>

      {/* Preview & Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <AlertDialogTitle>AI Generated Description</AlertDialogTitle>
          <AlertDialogDescription>
            Preview the generated description. You can edit it in the form after accepting.
          </AlertDialogDescription>

          <div className="bg-muted p-4 rounded-lg my-4 text-sm leading-relaxed max-h-96 overflow-y-auto">
            {generatedText}
          </div>

          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Discard</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept}>
              Use This Description
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
