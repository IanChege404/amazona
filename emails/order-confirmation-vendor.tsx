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

interface OrderConfirmationVendorEmailProps {
  vendorName: string
  orderNumber: string
  customerName: string
  itemCount: number
  totalAmount: number
  vendorRevenue: number
  orderUrl: string
}

export const OrderConfirmationVendorEmail = ({
  vendorName,
  orderNumber,
  customerName,
  itemCount,
  totalAmount,
  vendorRevenue,
  orderUrl,
}: OrderConfirmationVendorEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New order received! Order #{orderNumber} from {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>New Order Received!</Text>
            <Text style={paragraph}>
              Hi {vendorName},
            </Text>
            <Text style={paragraph}>
              You have received a new order from a customer. Please review the order details and prepare for shipment.
            </Text>

            <Section style={orderInfoBox}>
              <Row>
                <Text style={label}>Order Number</Text>
                <Text style={value}>{orderNumber}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Customer Name</Text>
                <Text style={value}>{customerName}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Items Ordered</Text>
                <Text style={value}>{itemCount} items</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Total Order Value</Text>
                <Text style={value}>${totalAmount.toFixed(2)}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Your Revenue</Text>
                <Text style={valueGreen}>${vendorRevenue.toFixed(2)}</Text>
              </Row>
            </Section>

            <Section style={{ textAlign: 'center', marginTop: '32px' }}>
              <Button style={button} href={orderUrl}>
                View Order & Process
              </Button>
            </Section>

            <Text style={paragraph}>
              Log in to your vendor dashboard to view the full order details, customer shipping address, and mark items as shipped.
            </Text>

            <Box style={checklistBox}>
              <Text style={checklistTitle}>Next Steps:</Text>
              <Text style={checklistItem}>✓ Review order details</Text>
              <Text style={checklistItem}>✓ Verify inventory</Text>
              <Text style={checklistItem}>✓ Prepare for shipment</Text>
              <Text style={checklistItem}>✓ Update tracking information</Text>
            </Box>

            <Hr style={hr} />
            <Text style={footer}>
              Questions about this order? Visit your vendor dashboard or contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderConfirmationVendorEmail

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

const valueGreen = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#10b981',
  margin: '0',
}

const divider = {
  borderColor: '#d1d5db',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#10b981',
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

const checklistBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const checklistTitle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#166534',
  margin: '0 0 12px 0',
}

const checklistItem = {
  fontSize: '14px',
  color: '#166534',
  margin: '8px 0',
  lineHeight: '1.6',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.5',
}
