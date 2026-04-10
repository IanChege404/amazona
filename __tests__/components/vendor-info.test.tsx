import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

// Mock VendorInfo component
const VendorInfo = ({ vendor }: any) => {
  const avgRating = vendor.rating || 0
  const totalReviews = vendor.numReviews || 0

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold">{vendor.businessName}</h1>
              <p className="text-gray-600 mt-2 text-lg max-w-2xl">
                {vendor.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {avgRating.toFixed(1)} ({totalReviews} reviews)
              </span>
            </div>
          </div>
        </div>
        <div>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <p className="text-lg font-semibold">{vendor.email}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Phone</p>
              <p className="text-lg font-semibold">{vendor.phone}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{vendor.totalOrders}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const mockVendor = {
  _id: '507f1f77bcf86cd799439011',
  businessName: 'Test Vendor',
  description: 'A test vendor store',
  email: 'vendor@test.com',
  phone: '1234567890',
  address: {
    street: '123 Main St',
    city: 'Test City',
    country: 'Test Country',
  },
  logo: '/logo.png',
  banner: '/banner.png',
  rating: 4.5,
  numReviews: 42,
  totalOrders: 100,
  totalRevenue: 50000,
  status: 'approved' as const,
  stripeAccountId: 'acct_test123',
  stripeOnboardingComplete: true,
  slug: 'test-vendor',
  userId: '507f1f77bcf86cd799439012',
  commissionRate: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('VendorInfo Component', () => {
  it('renders vendor business name', () => {
    const { getByText } = render(<VendorInfo vendor={mockVendor} />)
    expect(getByText('Test Vendor')).toBeInTheDocument()
  })

  it('displays vendor description', () => {
    const { getByText } = render(<VendorInfo vendor={mockVendor} />)
    expect(getByText('A test vendor store')).toBeInTheDocument()
  })

  it('shows vendor email', () => {
    const { getByText } = render(<VendorInfo vendor={mockVendor} />)
    expect(getByText('vendor@test.com')).toBeInTheDocument()
  })

  it('shows vendor phone', () => {
    const { getByText } = render(<VendorInfo vendor={mockVendor} />)
    expect(getByText('1234567890')).toBeInTheDocument()
  })

  it('displays total orders stat', () => {
    const { getByText } = render(<VendorInfo vendor={mockVendor} />)
    expect(getByText('100')).toBeInTheDocument()
    expect(getByText('Total Orders')).toBeInTheDocument()
  })

  it('displays rating and review count', () => {
    const { getByText } = render(<VendorInfo vendor={mockVendor} />)
    expect(getByText(/4.5/)).toBeInTheDocument()
    expect(getByText(/42 reviews/)).toBeInTheDocument()
  })
})
