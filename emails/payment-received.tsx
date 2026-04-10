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

interface PaymentReceivedEmailProps {
  customerName: string
  orderNumber: string
  amount: number
  paymentMethod: string
  transactionId: string
  orderUrl: string
}

export const PaymentReceivedEmail = ({
  customerName,
  orderNumber,
  amount,
  paymentMethod,
  transactionId,
  orderUrl,
}: PaymentReceivedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Payment received for order #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Payment Received ✓</Text>
            <Text style={paragraph}>
              Hi {customerName},
            </Text>
            <Text style={paragraph}>
              Your payment has been successfully processed! Your order is now confirmed and will be prepared for shipment shortly.
            </Text>

            <Section style={successBox}>
              <Row>
                <Text style={label}>Order Number</Text>
                <Text style={value}>{orderNumber}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Amount Paid</Text>
                <Text style={valueGreen}>${amount.toFixed(2)}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Payment Method</Text>
                <Text style={value}>{paymentMethod}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Transaction ID</Text>
                <Text style={valueSmall}>{transactionId}</Text>
              </Row>
            </Section>

            <Text style={paragraph}>
              Your payment confirmation receipt has been saved to your account for future reference.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: '32px' }}>
              <Button style={button} href={orderUrl}>
                Track Your Order
              </Button>
            </Section>

            <Box style={infoBox}>
              <Text style={infoTitle}>What's Next?</Text>
              <Text style={infoParagraph}>
                Your items are being prepared for shipment. You'll receive a notification with tracking information as soon as your order ships. This typically happens within 1-2 business days.
              </Text>
            </Box>

            <Hr style={hr} />
            <Text style={footer}>
              Thank you for your purchase! If you have any questions, please don't hesitate to contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PaymentReceivedEmail

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

const successBox = {
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

const valueGreen = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#10b981',
  margin: '0',
}

const valueSmall = {
  fontSize: '12px',
  fontWeight: '500',
  color: '#6b7280',
  margin: '0',
  fontFamily: 'monospace',
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

const infoBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const infoTitle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#1e40af',
  margin: '0 0 12px 0',
}

const infoParagraph = {
  fontSize: '14px',
  color: '#1e40af',
  margin: '0',
  lineHeight: '1.6',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.5',
}
