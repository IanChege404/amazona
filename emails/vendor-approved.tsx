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

interface VendorApprovedEmailProps {
  vendorName: string;
  businessName: string;
  loginUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'

export default function VendorApprovedEmail({
  vendorName,
  businessName,
  loginUrl = `${baseUrl}/seller/dashboard`,
}: VendorApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your vendor application has been approved!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Text style={heading}>Welcome to the Marketplace! 🎉</Text>
            
            <Text style={paragraph}>
              Hi {vendorName},
            </Text>

            <Text style={paragraph}>
              Great news! Your vendor application for <strong>{businessName}</strong> has been approved!
            </Text>

            <Text style={paragraph}>
              You can now:
            </Text>
            
            <ul style={listStyle}>
              <li style={listItem}>Access your vendor dashboard</li>
              <li style={listItem}>Create and manage your product listings</li>
              <li style={listItem}>Start receiving orders from customers</li>
              <li style={listItem}>Track your sales and earnings</li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Go to Vendor Dashboard
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              <strong>Next Steps:</strong>
            </Text>
            
            <ol style={listStyle}>
              <li style={listItem}>Complete your Stripe Connect setup to receive payments</li>
              <li style={listItem}>Add your first product listing</li>
              <li style={listItem}>Promote your store on social media</li>
            </ol>

            <Hr style={hr} />

            <Text style={paragraph}>
              If you have any questions, feel free to reach out to our support team at{' '}
              <Link href={`mailto:support@example.com`} style={link}>
                support@example.com
              </Link>
            </Text>

            <Text style={paragraph}>
              Welcome aboard!
              <br />
              The Marketplace Team
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

const listStyle = {
  paddingLeft: '20px',
  margin: '16px 0',
}

const listItem = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#404040',
  marginBottom: '8px',
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

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
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
