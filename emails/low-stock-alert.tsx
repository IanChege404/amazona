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

interface LowStockAlertEmailProps {
  vendorName: string
  productName: string
  currentStock: number
  lowStockThreshold: number
  productId: string
  dashboardUrl: string
}

export const LowStockAlertEmail = ({
  vendorName,
  productName,
  currentStock,
  lowStockThreshold,
  productId,
  dashboardUrl,
}: LowStockAlertEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Low stock alert: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Section style={warningBanner}>
              <Text style={bannerText}>⚠ Low Stock Alert</Text>
            </Section>

            <Text style={heading}>Low Stock Notification</Text>
            <Text style={paragraph}>
              Hi {vendorName},
            </Text>
            <Text style={paragraph}>
              One of your products is running low on inventory. Please restock to avoid missing out on sales.
            </Text>

            <Section style={alertBox}>
              <Row>
                <Text style={label}>Product</Text>
                <Text style={value}>{productName}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Current Stock</Text>
                <Text style={valueWarning}>{currentStock} units</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Low Stock Threshold</Text>
                <Text style={value}>{lowStockThreshold} units</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Status</Text>
                <Text style={valueRed}>NEEDS RESTOCKING</Text>
              </Row>
            </Section>

            <Text style={paragraph}>
              We recommend updating your inventory as soon as possible to maintain customer satisfaction and avoid stockouts.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: '32px' }}>
              <Button style={button} href={dashboardUrl}>
                Update Inventory
              </Button>
            </Section>

            <Box style={infoBox}>
              <Text style={infoTitle}>Quick Restock Tips:</Text>
              <Text style={infoItem}>• Monitor your sales velocity regularly</Text>
              <Text style={infoItem}>• Set appropriate safety stock levels</Text>
              <Text style={infoItem}>• Enable automatic low-stock notifications</Text>
              <Text style={infoItem}>• Plan your reorders in advance</Text>
            </Box>

            <Hr style={hr} />
            <Text style={footer}>
              You're receiving this because you have low stock alerts enabled. Adjust your notification settings in your account preferences.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default LowStockAlertEmail

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

const warningBanner = {
  backgroundColor: '#f59e0b',
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

const alertBox = {
  border: '2px solid #fed7aa',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
  backgroundColor: '#fffbeb',
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

const valueWarning = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#f59e0b',
  margin: '0',
}

const valueRed = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#dc2626',
  margin: '0',
}

const divider = {
  borderColor: '#d1d5db',
  margin: '16px 0',
}

const button = {
  backgroundColor: '#f59e0b',
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
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const infoTitle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#1f2937',
  margin: '0 0 12px 0',
}

const infoItem = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '8px 0',
  lineHeight: '1.6',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.5',
}
