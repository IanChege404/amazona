import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import { debugLog, debugError } from '@/lib/debug'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
  clearCart: () => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        debugLog('CartStore', 'addItem called', {
          productId: item.product,
          productName: item.name,
          quantity,
          color: item.color,
          size: item.size,
          countInStock: item.countInStock,
        })

        const { items, shippingAddress } = get().cart
        debugLog('CartStore', 'Current cart state before add', {
          itemCount: items.length,
          totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
          hasSippingAddress: !!shippingAddress,
        })

        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (existItem) {
          debugLog('CartStore', 'Item already exists in cart', {
            existingQuantity: existItem.quantity,
            addingQuantity: quantity,
            newTotal: existItem.quantity + quantity,
            countInStock: existItem.countInStock,
          })

          if (existItem.countInStock < quantity + existItem.quantity) {
            const error = new Error('Not enough items in stock')
            debugError('CartStore', 'addItem - Stock validation failed', error, {
              productId: item.product,
              availableStock: existItem.countInStock,
              requestedTotal: quantity + existItem.quantity,
            })
            throw error
          }
        } else {
          debugLog('CartStore', 'New item being added to cart', {
            productId: item.product,
            requestedQuantity: quantity,
            availableStock: item.countInStock,
          })

          if (item.countInStock < item.quantity) {
            const error = new Error('Not enough items in stock')
            debugError('CartStore', 'addItem - Initial stock validation failed', error, {
              productId: item.product,
              availableStock: item.countInStock,
              requestedQuantity: item.quantity,
            })
            throw error
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
                ? { ...existItem, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        debugLog('CartStore', 'Calculating delivery and pricing', {
          itemCount: updatedCartItems.length,
          totalQuantity: updatedCartItems.reduce((sum, i) => sum + i.quantity, 0),
        })

        try {
          const pricingData = await calcDeliveryDateAndPrice({
            items: updatedCartItems,
            shippingAddress,
          })

          debugLog('CartStore', 'Pricing calculated successfully', {
            itemsPrice: pricingData.itemsPrice,
            shippingPrice: pricingData.shippingPrice,
            taxPrice: pricingData.taxPrice,
            totalPrice: pricingData.totalPrice,
          })

          set({
            cart: {
              ...get().cart,
              items: updatedCartItems,
              ...pricingData,
            },
          })
        } catch (error) {
          debugError(
            'CartStore',
            'addItem - Error calculating pricing',
            error,
            { items: updatedCartItems }
          )
          throw error
        }

        const foundItem = updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (!foundItem) {
          const error = new Error('Item not found in cart after adding')
          debugError('CartStore', 'addItem - Item verification failed', error, {
            productId: item.product,
            updatedCartItemCount: updatedCartItems.length,
          })
          throw error
        }

        debugLog('CartStore', 'addItem completed successfully', {
          clientId: foundItem.clientId,
          productId: foundItem.product,
          finalQuantity: foundItem.quantity,
          cartItemCount: updatedCartItems.length,
        })

        return foundItem.clientId
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        debugLog('CartStore', 'updateItem called', {
          productId: item.product,
          productName: item.name,
          newQuantity: quantity,
          color: item.color,
          size: item.size,
        })

        const { items, shippingAddress } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (!exist) {
          debugLog('CartStore', 'updateItem - Item not found in cart', {
            productId: item.product,
            color: item.color,
            size: item.size,
            cartItemCount: items.length,
          })
          return
        }

        debugLog('CartStore', 'Item found in cart, updating quantity', {
          productId: item.product,
          oldQuantity: exist.quantity,
          newQuantity: quantity,
          countInStock: exist.countInStock,
        })

        const updatedCartItems = items.map((x) =>
          x.product === item.product &&
          x.color === item.color &&
          x.size === item.size
            ? { ...exist, quantity: quantity }
            : x
        )

        try {
          const pricingData = await calcDeliveryDateAndPrice({
            items: updatedCartItems,
            shippingAddress,
          })

          debugLog('CartStore', 'updateItem - Pricing recalculated', {
            itemsPrice: pricingData.itemsPrice,
            shippingPrice: pricingData.shippingPrice,
            taxPrice: pricingData.taxPrice,
            totalPrice: pricingData.totalPrice,
          })

          set({
            cart: {
              ...get().cart,
              items: updatedCartItems,
              ...pricingData,
            },
          })

          debugLog('CartStore', 'updateItem completed successfully', {
            productId: item.product,
            finalQuantity: quantity,
            cartItemCount: updatedCartItems.length,
          })
        } catch (error) {
          debugError('CartStore', 'updateItem - Error updating item', error, {
            productId: item.product,
            newQuantity: quantity,
          })
          throw error
        }
      },
      removeItem: async (item: OrderItem) => {
        debugLog('CartStore', 'removeItem called', {
          productId: item.product,
          productName: item.name,
          color: item.color,
          size: item.size,
        })

        const { items, shippingAddress } = get().cart
        const itemToRemove = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (!itemToRemove) {
          debugLog('CartStore', 'removeItem - Item not found in cart', {
            productId: item.product,
            cartItemCount: items.length,
          })
          return
        }

        debugLog('CartStore', 'Removing item from cart', {
          productId: item.product,
          removingQuantity: itemToRemove.quantity,
          currentCartSize: items.length,
        })

        const updatedCartItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
        )

        try {
          const pricingData = await calcDeliveryDateAndPrice({
            items: updatedCartItems,
            shippingAddress,
          })

          debugLog('CartStore', 'removeItem - Pricing recalculated after removal', {
            itemsPrice: pricingData.itemsPrice,
            shippingPrice: pricingData.shippingPrice,
            taxPrice: pricingData.taxPrice,
            totalPrice: pricingData.totalPrice,
            newCartSize: updatedCartItems.length,
          })

          set({
            cart: {
              ...get().cart,
              items: updatedCartItems,
              ...pricingData,
            },
          })

          debugLog('CartStore', 'removeItem completed successfully', {
            productId: item.product,
            cartItemCount: updatedCartItems.length,
          })
        } catch (error) {
          debugError('CartStore', 'removeItem - Error removing item', error, {
            productId: item.product,
            itemsCount: updatedCartItems.length,
          })
          throw error
        }
      },
      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        debugLog('CartStore', 'setShippingAddress called', {
          street: shippingAddress.street,
          city: shippingAddress.city,
          province: shippingAddress.province,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode,
        })

        const { items } = get().cart
        try {
          const pricingData = await calcDeliveryDateAndPrice({
            items,
            shippingAddress,
          })

          debugLog('CartStore', 'Shipping address set, pricing recalculated', {
            itemsPrice: pricingData.itemsPrice,
            shippingPrice: pricingData.shippingPrice,
            taxPrice: pricingData.taxPrice,
            totalPrice: pricingData.totalPrice,
          })

          set({
            cart: {
              ...get().cart,
              shippingAddress,
              ...pricingData,
            },
          })
        } catch (error) {
          debugError(
            'CartStore',
            'setShippingAddress - Error calculating pricing',
            error,
            { address: shippingAddress }
          )
          throw error
        }
      },
      setPaymentMethod: (paymentMethod: string) => {
        debugLog('CartStore', 'setPaymentMethod called', {
          paymentMethod,
        })

        set({
          cart: {
            ...get().cart,
            paymentMethod,
          },
        })

        debugLog('CartStore', 'Payment method set successfully', {
          paymentMethod,
        })
      },
      setDeliveryDateIndex: async (index: number) => {
        debugLog('CartStore', 'setDeliveryDateIndex called', {
          deliveryDateIndex: index,
        })

        const { items, shippingAddress } = get().cart

        try {
          const pricingData = await calcDeliveryDateAndPrice({
            items,
            shippingAddress,
            deliveryDateIndex: index,
          })

          debugLog('CartStore', 'Delivery date set, pricing recalculated', {
            deliveryDateIndex: index,
            itemsPrice: pricingData.itemsPrice,
            shippingPrice: pricingData.shippingPrice,
            taxPrice: pricingData.taxPrice,
            totalPrice: pricingData.totalPrice,
          })

          set({
            cart: {
              ...get().cart,
              ...pricingData,
            },
          })
        } catch (error) {
          debugError(
            'CartStore',
            'setDeliveryDateIndex - Error calculating pricing',
            error,
            { deliveryDateIndex: index }
          )
          throw error
        }
      },
      clearCart: () => {
        debugLog('CartStore', 'clearCart called', {
          itemsBeforeClear: get().cart.items.length,
        })

        set({
          cart: {
            ...get().cart,
            items: [],
          },
        })

        debugLog('CartStore', 'Cart cleared successfully')
      },
      init: () => set({ cart: initialState }),
    }),

    {
      name: 'cart-store',
    }
  )
)
export default useCartStore
