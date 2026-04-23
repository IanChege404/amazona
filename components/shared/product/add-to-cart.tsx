/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import { OrderItem } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { debugLog, debugError } from '@/lib/debug'

export default function AddToCart({
  item,
  minimal = false,
}: {
  item: OrderItem
  minimal?: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()

  const { addItem } = useCartStore()

  //PROMPT: add quantity state
  const [quantity, setQuantity] = useState(1)

  const t = useTranslations()

  return minimal ? (
    <Button
      className='rounded-full w-auto'
      onClick={() => {
        debugLog('AddToCart', 'Minimal add button clicked', {
          productId: item.product,
          productName: item.name,
          quantity: 1,
        })

        try {
          debugLog('AddToCart', 'Calling addItem from store', {
            productId: item.product,
            quantity: 1,
          })

          addItem(item, 1)

          debugLog('AddToCart', 'Item added successfully, showing toast', {
            productId: item.product,
          })

          toast({
            description: t('Product.Added to Cart'),
            action: (
              <Button
                onClick={() => {
                  debugLog('AddToCart', 'User navigating to cart from toast', {
                    productId: item.product,
                  })
                  router.push('/cart')
                }}
              >
                {t('Product.Go to Cart')}
              </Button>
            ),
          })
        } catch (error: any) {
          debugError(
            'AddToCart',
            'Error adding item to cart (minimal)',
            error,
            {
              productId: item.product,
              productName: item.name,
            }
          )
          toast({
            variant: 'destructive',
            description: error.message,
          })
        }
      }}
    >
      {t('Product.Add to Cart')}
    </Button>
  ) : (
    <div className='w-full space-y-2'>
      <Select
        value={quantity.toString()}
        onValueChange={(i) => {
          const newQty = Number(i)
          debugLog('AddToCart', 'Quantity changed', {
            productId: item.product,
            oldQuantity: quantity,
            newQuantity: newQty,
          })
          setQuantity(newQty)
        }}
      >
        <SelectTrigger className=''>
          <SelectValue>
            {t('Product.Quantity')}: {quantity}
          </SelectValue>
        </SelectTrigger>
        <SelectContent position='popper'>
          {Array.from({ length: item.countInStock }).map((_, i) => (
            <SelectItem key={i + 1} value={`${i + 1}`}>
              {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        className='rounded-full w-full'
        type='button'
        onClick={async () => {
          debugLog('AddToCart', 'Add to cart button clicked', {
            productId: item.product,
            productName: item.name,
            quantity,
            color: item.color,
            size: item.size,
          })

          try {
            debugLog('AddToCart', 'Calling addItem from store', {
              productId: item.product,
              quantity,
            })

            const itemId = await addItem(item, quantity)

            debugLog('AddToCart', 'Item added successfully', {
              productId: item.product,
              clientId: itemId,
              quantity,
            })

            debugLog('AddToCart', 'Navigating to cart item page', {
              clientId: itemId,
            })

            router.push(`/cart/${itemId}`)
          } catch (error: any) {
            debugError('AddToCart', 'Error adding item to cart', error, {
              productId: item.product,
              quantity,
              color: item.color,
              size: item.size,
            })

            toast({
              variant: 'destructive',
              description: error.message,
            })
          }
        }}
      >
        {t('Product.Add to Cart')}
      </Button>
      <Button
        variant='secondary'
        onClick={() => {
          debugLog('AddToCart', 'Buy now button clicked', {
            productId: item.product,
            productName: item.name,
            quantity,
          })

          try {
            debugLog('AddToCart', 'Calling addItem from store (Buy Now)', {
              productId: item.product,
              quantity,
            })

            addItem(item, quantity)

            debugLog('AddToCart', 'Item added for Buy Now, navigating to checkout', {
              productId: item.product,
              quantity,
            })

            router.push(`/checkout`)
          } catch (error: any) {
            debugError(
              'AddToCart',
              'Error in Buy Now flow',
              error,
              {
                productId: item.product,
                quantity,
              }
            )

            toast({
              variant: 'destructive',
              description: error.message,
            })
          }
        }}
        className='w-full rounded-full '
      >
        {t('Product.Buy Now')}
      </Button>
    </div>
  )
}
