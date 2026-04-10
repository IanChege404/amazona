import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Example Badge component test
describe('Badge Component', () => {
  it('renders with text content', () => {
    const Badge = ({ children }: { children: React.ReactNode }) => (
      <span className="badge">{children}</span>
    )

    const { getByText } = render(<Badge>Verified</Badge>)
    expect(getByText('Verified')).toBeInTheDocument()
  })

  it('applies variant class', () => {
    const Badge = ({
      children,
      variant,
    }: {
      children: React.ReactNode
      variant?: string
    }) => (
      <span className={`badge badge-${variant || 'default'}`}>{children}</span>
    )

    const { container } = render(<Badge variant="success">Active</Badge>)
    expect(container.firstChild).toHaveClass('badge-success')
  })
})

// Example Button component test
describe('Button Component', () => {
  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    const Button = ({ onClick, children }: any) => (
      <button onClick={onClick}>{children}</button>
    )

    const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(getByRole('button', { name: /click me/i }))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('disables when disabled prop is true', () => {
    const Button = ({ disabled, children }: any) => (
      <button disabled={disabled}>{children}</button>
    )

    const { getByRole } = render(<Button disabled>Disabled</Button>)
    expect(getByRole('button')).toBeDisabled()
  })
})

// Example Form component test
describe('Form Input', () => {
  it('updates value on input change', async () => {
    const user = userEvent.setup()

    const Form = () => {
      const [value, setValue] = React.useState('')
      return (
        <div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter text"
          />
          <p>{value}</p>
        </div>
      )
    }

    const { getByPlaceholderText, getByText } = render(<Form />)

    const input = getByPlaceholderText('Enter text')
    await user.type(input, 'test input')

    expect(getByText('test input')).toBeInTheDocument()
  })
})
