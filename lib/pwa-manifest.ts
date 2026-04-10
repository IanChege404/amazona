/**
 * PWA Manifest Configuration
 * Defines app appearance for installation
 */

export const manifest = {
  name: 'Amazona - Multi-Vendor Marketplace',
  short_name: 'Amazona',
  description:
    'Premium multi-vendor e-commerce platform with real-time tracking, AI recommendations, and secure payments',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  theme_color: '#1f2937',
  background_color: '#ffffff',

  icons: [
    {
      src: '/images/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/images/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/images/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/images/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/images/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/images/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: '/images/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: '/images/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ],

  categories: ['shopping', 'e-commerce'],
  screenshots: [
    {
      src: '/images/screenshots/narrow.png',
      sizes: '540x720',
      type: 'image/png',
      form_factor: 'narrow',
    },
    {
      src: '/images/screenshots/wide.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide',
    },
  ],

  shortcuts: [
    {
      name: 'Search Products',
      short_name: 'Search',
      description: 'Search for products',
      url: '/search',
      icons: [
        {
          src: '/images/icons/search-96x96.png',
          sizes: '96x96',
        },
      ],
    },
    {
      name: 'My Orders',
      short_name: 'Orders',
      description: 'View your orders',
      url: '/orders',
      icons: [
        {
          src: '/images/icons/orders-96x96.png',
          sizes: '96x96',
        },
      ],
    },
    {
      name: 'Cart',
      short_name: 'Cart',
      description: 'View shopping cart',
      url: '/cart',
      icons: [
        {
          src: '/images/icons/cart-96x96.png',
          sizes: '96x96',
        },
      ],
    },
  ],

  // Share target for sharing products
  share_target: {
    action: '/share',
    method: 'POST',
    enctype: 'application/x-www-form-urlencoded',
    params: {
      title: 'title',
      text: 'text',
      url: 'url',
    },
  },

  // Protocol handlers
  protocol_handlers: [
    {
      protocol: 'web+amazona',
      url: '/product?id=%s',
    },
  ],

  // Prefer related applications
  prefer_related_applications: false,
}

export default manifest
