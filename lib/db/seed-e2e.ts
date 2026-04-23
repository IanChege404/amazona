/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcryptjs'
import { cwd } from 'process'
import { loadEnvConfig } from '@next/env'

import { connectToDatabase } from '.'
import data from '../data'
import { round2, generateId, calculateFutureDate, calculatePastDate } from '../utils'
import User from './models/user.model'
import Vendor from './models/vendor.model'
import Product from './models/product.model'
import Review from './models/review.model'
import Order from './models/order.model'
import WebPage from './models/web-page.model'
import Setting from './models/setting.model'
import { WebhookEventLogModel, WebhookMetricModel, WebhookTrendModel } from '../models/webhook-analytics'
import {
  VendorWebhookDeliveryModel,
  VendorWebhookSubscriptionModel,
  VendorWebhookTestModel,
} from '../models/vendor-webhook'

loadEnvConfig(cwd())

const E2E_PASSWORD = '123456'

const buildRatingDistribution = () => [
  { rating: 1, count: 0 },
  { rating: 2, count: 0 },
  { rating: 3, count: 0 },
  { rating: 4, count: 1 },
  { rating: 5, count: 2 },
]

async function main() {
  try {
    await connectToDatabase(process.env.MONGODB_URI)

    await Promise.all([
      Order.deleteMany({}),
      Review.deleteMany({}),
      Product.deleteMany({}),
      Vendor.deleteMany({}),
      User.deleteMany({}),
      Setting.deleteMany({}),
      WebPage.deleteMany({}),
      VendorWebhookSubscriptionModel.deleteMany({}),
      VendorWebhookTestModel.deleteMany({}),
      VendorWebhookDeliveryModel.deleteMany({}),
      WebhookEventLogModel.deleteMany({}),
      WebhookMetricModel.deleteMany({}),
      WebhookTrendModel.deleteMany({}),
    ])

    await Setting.create(data.settings[0])
    await WebPage.insertMany(data.webPages)

    const [admin, vendorUser, user] = await User.insertMany([
      {
        name: 'E2E Admin',
        email: 'admin@example.com',
        password: bcrypt.hashSync(E2E_PASSWORD, 5),
        role: 'admin',
        address: {
          fullName: 'E2E Admin',
          street: '1 Admin Road',
          city: 'Nairobi',
          province: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya',
          phone: '0700000001',
        },
        paymentMethod: 'Stripe',
        emailVerified: false,
      },
      {
        name: 'E2E Vendor',
        email: 'vendor@example.com',
        password: bcrypt.hashSync(E2E_PASSWORD, 5),
        role: 'vendor',
        address: {
          fullName: 'E2E Vendor',
          street: '2 Vendor Road',
          city: 'Nairobi',
          province: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya',
          phone: '0700000002',
        },
        paymentMethod: 'Stripe',
        emailVerified: false,
      },
      {
        name: 'E2E User',
        email: 'user@example.com',
        password: bcrypt.hashSync(E2E_PASSWORD, 5),
        role: 'user',
        address: {
          fullName: 'E2E User',
          street: '3 User Road',
          city: 'Nairobi',
          province: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya',
          phone: '0700000003',
        },
        paymentMethod: 'Stripe',
        emailVerified: false,
      },
    ])

    const vendor = await Vendor.create({
      userId: vendorUser._id,
      businessName: 'E2E Vendor Store',
      slug: 'e2e-vendor-store',
      description: 'Deterministic vendor account for Playwright tests',
      logo: '/images/app.png',
      banner: '/images/banner1.jpg',
      email: 'vendor@example.com',
      phone: '0700000002',
      address: {
        street: '2 Vendor Road',
        city: 'Nairobi',
        country: 'Kenya',
      },
      status: 'approved',
      stripeOnboardingComplete: true,
      commissionRate: 10,
      totalRevenue: 500,
      totalOrders: 3,
      rating: 4.5,
      numReviews: 2,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
    })

    const products = await Product.insertMany([
      {
        name: 'E2E Stripe Tee',
        slug: 'e2e-stripe-tee',
        category: 'E2E Clothing',
        images: ['/images/p11-1.jpg'],
        brand: 'E2E Brand',
        description: 'Primary E2E product used for checkout and payment tests',
        price: 49.99,
        listPrice: 59.99,
        countInStock: 25,
        tags: ['todays-deal', 'best-seller'],
        colors: ['Black', 'White'],
        sizes: ['M', 'L'],
        avgRating: 4.8,
        numReviews: 3,
        ratingDistribution: buildRatingDistribution(),
        numSales: 12,
        isPublished: true,
        vendorId: vendor._id.toString(),
        vendorName: vendor.businessName,
      },
      {
        name: 'E2E Vendor Hoodie',
        slug: 'e2e-vendor-hoodie',
        category: 'E2E Clothing',
        images: ['/images/p12-1.jpg'],
        brand: 'E2E Brand',
        description: 'Published vendor-owned product visible in vendor dashboard',
        price: 89.99,
        listPrice: 109.99,
        countInStock: 10,
        tags: ['new-arrival'],
        colors: ['Gray'],
        sizes: ['M'],
        avgRating: 4.2,
        numReviews: 2,
        ratingDistribution: buildRatingDistribution(),
        numSales: 4,
        isPublished: true,
        vendorId: vendor._id.toString(),
        vendorName: vendor.businessName,
      },
      {
        name: 'E2E Admin Product',
        slug: 'e2e-admin-product',
        category: 'E2E Admin',
        images: ['/images/p13-1.jpg'],
        brand: 'Admin Brand',
        description: 'Auxiliary product for search and catalog tests',
        price: 19.99,
        listPrice: 29.99,
        countInStock: 50,
        tags: ['featured'],
        colors: ['Red'],
        sizes: ['S'],
        avgRating: 4,
        numReviews: 1,
        ratingDistribution: buildRatingDistribution(),
        numSales: 2,
        isPublished: true,
        vendorId: vendor._id.toString(),
        vendorName: vendor.businessName,
      },
    ])

    const baseOrderItems = [
      {
        clientId: generateId(),
        product: products[0]._id,
        name: products[0].name,
        slug: products[0].slug,
        quantity: 1,
        image: products[0].images[0],
        category: products[0].category,
        price: products[0].price,
        countInStock: products[0].countInStock,
        vendorId: products[0].vendorId,
        vendorName: products[0].vendorName,
        color: products[0].colors[0],
        size: products[0].sizes[0],
      },
    ]

    const itemsPrice = round2(baseOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0))
    const shippingPrice = 5
    const taxPrice = round2(itemsPrice * 0.15)
    const totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

    await Order.create({
      user: user._id,
      items: baseOrderItems,
      shippingAddress: user.address,
      expectedDeliveryDate: calculateFutureDate(2),
      paymentMethod: 'Stripe',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: true,
      paidAt: calculatePastDate(2),
      isDelivered: false,
      createdAt: calculatePastDate(3),
      orderNumber: 'E2E-0001',
    })

    const seededEventLogs = Array.from({ length: 25 }).map((_, index) => {
      const status = index % 3 === 0 ? 'failed' : index % 5 === 0 ? 'retry' : 'success'
      const eventType = index % 2 === 0 ? 'ORDER.CREATED' : 'PAYMENT.SUCCEEDED'
      return {
        eventId: `evt_e2e_${index + 1}`,
        eventType,
        subscriptionId: `sub_e2e_${(index % 4) + 1}`,
        url: `https://example.com/webhooks/${(index % 4) + 1}`,
        status,
        statusCode: status === 'success' ? 200 : 500,
        deliveredAt: status === 'success' ? new Date() : undefined,
        latency: 100 + index,
        errorMessage: status === 'success' ? undefined : 'E2E simulated webhook failure',
        retryAttempt: status === 'retry' ? 1 : 0,
        signature: `sig_e2e_${index + 1}`,
        timestamp: new Date(Date.now() - index * 60 * 1000),
      }
    })

    await WebhookEventLogModel.insertMany(seededEventLogs)

    console.log({
      message: 'E2E seed complete',
      users: 3,
      products: products.length,
      webhookLogs: seededEventLogs.length,
      vendorSlug: vendor.slug,
    })

    process.exit(0)
  } catch (error) {
    console.error('Failed to seed E2E database', error)
    process.exit(1)
  }
}

main()
