import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface VendorApplicationReceivedEmailProps {
  vendorName: string;
  businessName: string;
  email: string;
  adminUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'

export default function VendorApplicationReceivedEmail({
  vendorName,
  businessName,
  email,
  adminUrl = `${baseUrl}/admin/vendors`,
}: VendorApplicationReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New vendor application received</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>New Vendor Application</Text>
            
            <Text style={paragraph}>
              A new vendor application has been received and is waiting for your review.
            </Text>

            <Section style={infoBox}>
              <Text style={infoLabel}>Vendor Name:</Text>
              <Text style={infoValue}>{vendorName}</Text>

              <Text style={infoLabel}>Business Name:</Text>
              <Text style={infoValue}>{businessName}</Text>

              <Text style={infoLabel}>Email:</Text>
              <Text style={infoValue}>{email}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={adminUrl}>
                Review Application
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              Status: <strong>Pending Review</strong>
            </Text>

            <Text style={paragraph}>
              You can approve or reject this application from your admin dashboard.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              © 2026 Marketplace. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f3f3f5',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
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
  color: '#212121',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#404040',
  margin: '16px 0',
}

const infoBox = {
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
  padding: '16px',
  margin: '16px 0',
}

const infoLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#666666',
  margin: '8px 0 4px 0',
}

const infoValue = {
  fontSize: '14px',
  color: '#404040',
  margin: '0 0 8px 0',
}

const buttonContainer = {
  padding: '27px 0 27px',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '3px',
  fontWeight: '600',
  border: '1px solid #000',
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: '1.5',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '11px 23px',
  color: '#fff',
}

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '16px 0',
}
