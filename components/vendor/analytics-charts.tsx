'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface RevenueTrendProps {
  data: Array<{
    date: string
    revenue: number
    orders: number
  }>
  isLoading?: boolean
}

export function RevenueTrendChart({ data, isLoading }: RevenueTrendProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className='h-80 flex items-center justify-center'>
          <div className='animate-pulse text-gray-400'>Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis 
              dataKey='date' 
              tick={{ fontSize: 12 }}
              interval={Math.floor(data.length / 7)}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: '$', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type='monotone' 
              dataKey='revenue' 
              stroke='#3b82f6' 
              name='Revenue ($)'
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface TopProductsProps {
  data: Array<{
    name: string
    revenue: number
    quantity: number
    image?: string
  }>
  isLoading?: boolean
}

export function TopProductsChart({ data, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent className='h-80 flex items-center justify-center'>
          <div className='animate-pulse text-gray-400'>Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.slice(0, 8).map((item) => ({
    ...item,
    shortName: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products by Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis 
              dataKey='shortName' 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor='end'
              height={100}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: '$', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
              labelFormatter={(label) => `Product: ${label}`}
            />
            <Legend />
            <Bar dataKey='revenue' fill='#10b981' name='Revenue ($)' />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface CategoryBreakdownProps {
  data: Array<{
    category: string
    revenue: number
    quantity: number
    percentage: number
  }>
  isLoading?: boolean
}

export function CategoryBreakdownChart({
  data,
  isLoading,
}: CategoryBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
        </CardHeader>
        <CardContent className='h-80 flex items-center justify-center'>
          <div className='animate-pulse text-gray-400'>Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <PieChart>
            <Pie
              data={data}
              cx='50%'
              cy='50%'
              labelLine={false}
              label={({ category, percentage }) => `${category}: ${percentage}%`}
              outerRadius={80}
              fill='#8884d8'
              dataKey='revenue'
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface OrderStatusDistributionProps {
  data: Array<{
    status: string
    count: number
  }>
  isLoading?: boolean
}

export function OrderStatusDistribution({
  data,
  isLoading,
}: OrderStatusDistributionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className='h-80 flex items-center justify-center'>
          <div className='animate-pulse text-gray-400'>Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={data} layout='vertical'>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis type='number' />
            <YAxis dataKey='status' type='category' width={100} />
            <Tooltip />
            <Bar dataKey='count' fill='#f59e0b' name='Orders' />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
