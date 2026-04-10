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

interface PayoutProcessedEmailProps {
  vendorName: string
  payoutAmount: number
  payoutDate: string
  bankAccount: string
  transferId: string
  dashboardUrl: string
}

export const PayoutProcessedEmail = ({
  vendorName,
  payoutAmount,
  payoutDate,
  bankAccount,
  transferId,
  dashboardUrl,
}: PayoutProcessedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your payout of ${payoutAmount.toFixed(2)} has been processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Section style={successBanner}>
              <Text style={bannerText}>✓ Payout Processed</Text>
            </Section>

            <Text style={heading}>Your Payout Has Been Sent</Text>
            <Text style={paragraph}>
              Hi {vendorName},
            </Text>
            <Text style={paragraph}>
              Your earnings have been successfully transferred to your bank account. Check your bank in 1-2 business days for the funds to appear.
            </Text>

            <Section style={payoutBox}>
              <Row>
                <Text style={label}>Payout Amount</Text>
                <Text style={valueGreen}>${payoutAmount.toFixed(2)}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Processing Date</Text>
                <Text style={value}>{payoutDate}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Bank Account (Last 4)</Text>
                <Text style={value}>...{bankAccount.slice(-4)}</Text>
              </Row>
              <Hr style={divider} />
              <Row>
                <Text style={label}>Transfer ID</Text>
                <Text style={valueSmall}>{transferId}</Text>
              </Row>
            </Section>

            <Box style={infoBox}>
              <Text style={infoTitle}>Payout Details</Text>
              <Text style={infoParagraph}>
                This payout includes all verified orders from your sales period. You can view a detailed breakdown of sales, fees, and net earnings in your dashboard.
              </Text>
            </Box>

            <Section style={{ textAlign: 'center', marginTop: '32px' }}>
              <Button style={button} href={dashboardUrl}>
                View Payment Details
              </Button>
            </Section>

            <Hr style={hr} />

            <Box style={tipBox}>
              <Text style={tipTitle}>💡 Quick Tips:</Text>
              <Text style={tipItem}>• Payouts are processed every 2 weeks</Text>
              <Text style={tipItem}>• Earnings are available after 7 days following order delivery</Text>
              <Text style={tipItem}>• Keep your bank information updated in settings</Text>
              <Text style={tipItem}>• Check your dashboard for detailed analytics</Text>
            </Box>

            <Hr style={hr} />
            <Text style={footer}>
              Questions about your payout? Visit our help center or contact the seller support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PayoutProcessedEmail

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

const payoutBox = {
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
  fontSize: '20px',
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

const tipBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const tipTitle = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#92400e',
  margin: '0 0 12px 0',
}

const tipItem = {
  fontSize: '14px',
  color: '#92400e',
  margin: '8px 0',
  lineHeight: '1.6',
}

const footer = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.5',
}
