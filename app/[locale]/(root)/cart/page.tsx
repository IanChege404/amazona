'use client'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { debugLog, debugError } from '@/lib/debug'

export default function CartPage() {
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
  } = useCartStore()
  const router = useRouter()
  const {
    setting: {
      site,
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  const t = useTranslations()

  // Log cart page mount and state
  useEffect(() => {
    debugLog('CartPage', 'Component mounted', {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
      itemsPrice,
    })

    return () => {
      debugLog('CartPage', 'Component unmounted', {
        itemCount: items.length,
      })
    }
  }, [])
  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-4  md:gap-4'>
        {items.length === 0 ? (
          <Card className='col-span-4 rounded-none'>
            <CardHeader className='text-3xl  '>
              {t('Cart.Your Shopping Cart is empty')}
            </CardHeader>
            <CardContent>
              {t.rich('Cart.Continue shopping on', {
                name: site.name,
                home: (chunks) => <Link href='/'>{chunks}</Link>,
              })}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='col-span-3'>
              <Card className='rounded-none'>
                <CardHeader className='text-3xl pb-0'>
                  {t('Cart.Shopping Cart')}
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='flex justify-end border-b mb-4'>
                    {t('Cart.Price')}
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.clientId}
                      className='flex flex-col md:flex-row justify-between py-4 border-b gap-4'
                    >
                      <Link href={`/product/${item.slug}`}>
                        <div className='relative w-40 h-40'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes='20vw'
                            style={{
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      </Link>

                      <div className='flex-1 space-y-4'>
                        <Link
                          href={`/product/${item.slug}`}
                          className='text-lg hover:no-underline  '
                        >
                          {item.name}
                        </Link>
                        <div>
                          <p className='text-sm'>
                            <span className='font-bold'>
                              {' '}
                              {t('Cart.Color')}:{' '}
                            </span>{' '}
                            {item.color}
                          </p>
                          <p className='text-sm'>
                            <span className='font-bold'>
                              {' '}
                              {t('Cart.Size')}:{' '}
                            </span>{' '}
                            {item.size}
                          </p>
                        </div>
                        <div className='flex gap-2 items-center'>
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(value) => {
                              const newQty = Number(value)
                              debugLog('CartPage', 'Item quantity changed', {
                                productId: item.product,
                                productName: item.name,
                                oldQuantity: item.quantity,
                                newQuantity: newQty,
                              })

                              try {
                                updateItem(item, newQty)
                                debugLog('CartPage', 'Item quantity updated successfully', {
                                  productId: item.product,
                                  newQuantity: newQty,
                                })
                              } catch (error) {
                                debugError(
                                  'CartPage',
                                  'Error updating item quantity',
                                  error,
                                  {
                                    productId: item.product,
                                    newQuantity: newQty,
                                  }
                                )
                              }
                            }}
                          >
                            <SelectTrigger className='w-auto'>
                              <SelectValue>
                                {t('Cart.Quantity')}: {item.quantity}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent position='popper'>
                              {Array.from({
                                length: item.countInStock,
                              }).map((_, i) => (
                                <SelectItem key={i + 1} value={`${i + 1}`}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant={'outline'}
                            onClick={() => {
                              debugLog('CartPage', 'Delete button clicked', {
                                productId: item.product,
                                productName: item.name,
                                quantity: item.quantity,
                              })

                              try {
                                removeItem(item)
                                debugLog('CartPage', 'Item removed successfully', {
                                  productId: item.product,
                                })
                              } catch (error) {
                                debugError(
                                  'CartPage',
                                  'Error removing item',
                                  error,
                                  {
                                    productId: item.product,
                                  }
                                )
                              }
                            }}
                          >
                            {t('Cart.Delete')}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className='text-right'>
                          {item.quantity > 1 && (
                            <>
                              {item.quantity} x
                              <ProductPrice price={item.price} plain />
                              <br />
                            </>
                          )}

                          <span className='font-bold text-lg'>
                            <ProductPrice
                              price={item.price * item.quantity}
                              plain
                            />
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className='flex justify-end text-lg my-2'>
                    {t('Cart.Subtotal')} (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    {t('Cart.Items')}):{' '}
                    <span className='font-bold ml-1'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className='rounded-none'>
                <CardContent className='py-4 space-y-4'>
                  {itemsPrice < freeShippingMinPrice ? (
                    <div className='flex-1'>
                      {t('Cart.Add')}{' '}
                      <span className='text-green-700'>
                        <ProductPrice
                          price={freeShippingMinPrice - itemsPrice}
                          plain
                        />
                      </span>{' '}
                      {t(
                        'Cart.of eligible items to your order to qualify for FREE Shipping'
                      )}
                    </div>
                  ) : (
                    <div className='flex-1'>
                      <span className='text-green-700'>
                        {t('Cart.Your order qualifies for FREE Shipping')}
                      </span>{' '}
                      {t('Cart.Choose this option at checkout')}
                    </div>
                  )}
                  <div className='text-lg'>
                    {t('Cart.Subtotal')} (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    {t('Cart.items')}):{' '}
                    <span className='font-bold'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>
                  <Button
                    onClick={() => {
                      debugLog('CartPage', 'Proceed to checkout clicked', {
                        itemCount: items.length,
                        totalQuantity: items.reduce((a, c) => a + c.quantity, 0),
                        itemsPrice,
                      })
                      router.push('/checkout')
                    }}
                    className='rounded-full w-full'
                  >
                    {t('Cart.Proceed to Checkout')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <BrowsingHistoryList className='mt-10' />
    </div>
  )
}
