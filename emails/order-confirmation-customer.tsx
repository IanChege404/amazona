import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

interface OrderConfirmationCustomerEmailProps {
  orderNumber: string
  customerName: string
  totalPrice: number
  itemCount: number
  estimatedDelivery: string
  orderUrl: string
}

export const OrderConfirmationCustomerEmail = ({
  orderNumber,
  customerName,
  totalPrice,
  itemCount,
  estimatedDelivery,
  orderUrl,
}: OrderConfirmationCustomerEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Order confirmed! Your order #{orderNumber} is on the way</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Order Confirmed!</Text>
            <Text style={paragraph}>
              Hi {customerName},
            </Text>
            <Text style={paragraph}>
              Thank you for your order! We're excited to prepare your items for shipment.
            </Text>

            <Section style={orderInfoBox}>
              <Row>
                <Text style={label}>Order Number</Text>
                <Text style={value}>{orderNumber}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Total Amount</Text>
                <Text style={value}>${totalPrice.toFixed(2)}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Items</Text>
                <Text style={value}>{itemCount} items</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Estimated Delivery</Text>
                <Text style={value}>{estimatedDelivery}</Text>
              </Row>
            </Section>

            <Section style={{ textAlign: 'center', marginTop: '32px' }}>
              <Button style={button} href={orderUrl}>
                View Order Details
              </Button>
            </Section>

            <Text style={paragraph}>
              You can track your order status at any time by visiting your account or clicking the link above.
            </Text>

            <Hr style={hr} />
            <Text style={footer}>
              Questions? Our customer support team is here to help. Reply to this email or visit our support page.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderConfirmationCustomerEmail

const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const box = {
  padding: '0 48px',
}

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 24px 0',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4b5563',
  margin: '16px 0',
}

const orderInfoBox = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
  backgroundColor: '#f3f4f6',
}

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 8px 0',
}

const value = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0',
}

const divider = {
  borderColor: '#d1d5db',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.5',
}
