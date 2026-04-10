import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

interface OrderDeliveryEmailProps {
  customerName: string
  orderNumber: string
  itemCount: number
  orderUrl: string
  reviewUrl: string
}

export const OrderDeliveryEmail = ({
  customerName,
  orderNumber,
  itemCount,
  orderUrl,
  reviewUrl,
}: OrderDeliveryEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your order #{orderNumber} has been delivered!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Section style={successBanner}>
              <Text style={bannerText}>✓ Delivered!</Text>
            </Section>

            <Text style={heading}>Your Order Has Arrived</Text>
            <Text style={paragraph}>
              Hi {customerName},
            </Text>
            <Text style={paragraph}>
              Great news! Your order has been delivered and is ready for you to enjoy.
            </Text>

            <Section style={deliveryBox}>
              <Row>
                <Text style={label}>Order Number</Text>
                <Text style={value}>{orderNumber}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Items Received</Text>
                <Text style={value}>{itemCount} items</Text>
              </Row>
            </Section>

            <Box style={feedbackBox}>
              <Text style={feedbackTitle}>We'd Love Your Feedback!</Text>
              <Text style={feedbackParagraph}>
                Please take a moment to review your order. Your feedback helps us improve and helps other customers make informed decisions.
              </Text>
              <Section style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button style={reviewButton} href={reviewUrl}>
                  Leave a Review
                </Button>
              </Section>
            </Box>

            <Hr style={hr} />

            <Box style={helpBox}>
              <Text style={helpTitle}>Need Any Help?</Text>
              <Text style={helpParagraph}>
                If you have any questions about your order or need assistance, our customer support team is ready to help. Feel free to reply to this email or visit our support page.
              </Text>
            </Box>

            <Section style={{ textAlign: 'center', marginTop: '24px' }}>
              <Button style={orderButton} href={orderUrl}>
                View Order
              </Button>
            </Section>

            <Hr style={hr} />
            <Text style={footer}>
              Thank you for shopping with us! We hope you enjoy your purchase.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderDeliveryEmail

const Box = ({ children, style }: any) => <div style={style}>{children}</div>

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

const successBanner = {
  backgroundColor: '#10b981',
  padding: '24px',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const bannerText = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0',
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

const deliveryBox = {
  border: '2px solid #d1fae5',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
  backgroundColor: '#f0fdf4',
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

const feedbackBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const feedbackTitle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#92400e',
  margin: '0 0 12px 0',
}

const feedbackParagraph = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
  lineHeight: '1.6',
}

const reviewButton = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
}

const helpBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const helpTitle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#1e40af',
  margin: '0 0 12px 0',
}

const helpParagraph = {
  fontSize: '14px',
  color: '#1e40af',
  margin: '0',
  lineHeight: '1.6',
}

const orderButton = {
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
