# Production Deployment Checklist

## Pre-Deployment Review (Complete Before Going Live)

### 1. Environment Configuration ✅
- [ ] **Secrets Management**
  - [ ] All sensitive values in `.env.local` or deployment platform's secret manager
  - [ ] Never commit `.env.local` to version control
  - [ ] NEXTAUTH_SECRET is strong (32+ chars, random)
  - [ ] Database connection strings are environment-specific
  - [ ] API keys are rotated in production

- [ ] **API Keys & Credentials**
  - [ ] STRIPE_SECRET_KEY (production key, not test)
  - [ ] STRIPE_WEBHOOK_SECRET (production webhook secret)
  - [ ] PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET
  - [ ] MONGODB_URI points to production MongoDB Atlas
  - [ ] UPSTASH_REDIS_REST_URL and TOKEN configured
  - [ ] NEXT_PUBLIC_SENTRY_DSN is production DSN
  - [ ] CRON_SECRET is strong and stored securely
  - [ ] UPLOADTHING_SECRET and UPLOADTHING_APP_ID

- [ ] **Third-Party Services**
  - [ ] SendGrid API key for transactional emails
  - [ ] Resend/Email provider credentials
  - [ ] Pusher App ID, Key, Secret, Cluster
  - [ ] Google OAuth credentials for production domain
  - [ ] MongoDB Vector Search credentials (if using AI search)

- [ ] **Application Configuration**
  - [ ] NEXT_PUBLIC_APP_URL set to production domain (HTTPS)
  - [ ] NEXTAUTH_URL matches production domain
  - [ ] STRIPE_CONNECT_REDIRECT_URI uses production domain
  - [ ] NODE_ENV set to "production"
  - [ ] Platform fee percentage configured (PLATFORM_FEE_PERCENTAGE)

---

### 2. Database Setup ✅
- [ ] **MongoDB Atlas Configuration**
  - [ ] Cluster tier: M10 or higher for production
  - [ ] Replica set enabled (automatic backups, high availability)
  - [ ] IP Whitelist includes Vercel deployment IPs (0.0.0.0/0 for serverless)
  - [ ] Database user created with appropriate permissions
  - [ ] Database password is strong and stored securely
  - [ ] Connection string uses `mongodb+srv://` (DNS seed list)
  - [ ] SSL/TLS connection enabled (enforced)

- [ ] **Database Indexes**
  - [ ] All indexes from `docker/mongodb/init/01-init.js` created
  - [ ] Verify indexes: `db.users.getIndexes()`, etc.
  - [ ] Compound indexes created for common queries:
    - `users: email (unique)`
    - `products: (vendorId, isPublished)`
    - `orders: (userId, createdAt)`
    - `vendors: slug (unique), email (unique)`

- [ ] **Vector Search (if using AI features)**
  - [ ] MongoDB Atlas Vector Search index created
  - [ ] Index name: `product_vector_index`
  - [ ] Index status: ACTIVE (verify in Atlas console)
  - [ ] Search queries tested and working
  - [ ] OpenAI API key configured

- [ ] **Backup & Recovery**
  - [ ] Daily automated backups enabled
  - [ ] Backup retention: minimum 30 days
  - [ ] Point-in-time recovery tested (restore to specific timestamp)
  - [ ] Backup files stored in secure location
  - [ ] Disaster recovery runbook created and tested

- [ ] **Monitoring**
  - [ ] Slow query log enabled
  - [ ] Performance advisor reviewed
  - [ ] Disk space monitored (alert at 80%)
  - [ ] Connection count monitored

---

### 3. Caching & Performance ✅
- [ ] **Redis/Upstash Configuration**
  - [ ] Upstash Redis database created
  - [ ] REST URL and Token stored securely
  - [ ] Connection tested from production environment
  - [ ] Appropriate tier selected (minimum for production: 1GB)
  - [ ] TTL policies configured
  - [ ] Monitoring/alerting enabled

- [ ] **Next.js Caching**
  - [ ] ISR (Incremental Static Regeneration) configured on product pages
  - [ ] Cache-Control headers set in next.config.ts:
    - Static assets: `public, max-age=31536000` (1 year)
    - HTML pages: `public, max-age=0, s-maxage=3600` (1 hour)
    - API responses: `public, max-age=60, s-maxage=300` (5 minutes)
  - [ ] Service Worker caching strategy active (offline support)
  - [ ] Browser caching headers correct

- [ ] **Content Delivery Network**
  - [ ] Vercel CDN enabled (automatic for Vercel deployment)
  - [ ] Image optimization enabled with next/image
  - [ ] Static assets compressed (gzip/brotli)

---

### 4. Webhooks & Integrations ✅
- [ ] **Stripe Webhooks**
  - [ ] Webhook endpoint registered: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Events subscribed:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.refunded`
    - `charge.dispute.created`
    - `payout.paid`
    - `payout.failed`
    - `account.updated`
  - [ ] Webhook signing secret stored in STRIPE_WEBHOOK_SECRET
  - [ ] Webhook retries configured

- [ ] **Internal Webhooks**
  - [ ] Platform webhook dispatcher tested
  - [ ] Vendor webhook subscriptions tested
  - [ ] Webhook replay system functional
  - [ ] Retry logic with exponential backoff verified

- [ ] **Cron Jobs**
  - [ ] Cron job endpoints created:
    - `/api/cron/process-webhook-replays`
    - `/api/cron/run-reconciliation`
  - [ ] CRON_SECRET environment variable set
  - [ ] Cron trigger configured (Vercel Cron, AWS EventBridge, or external service)
  - [ ] Cron job schedule: Every 5-10 minutes for webhook replays, daily for reconciliation
  - [ ] Health check for cron jobs implemented

---

### 5. Monitoring & Error Tracking ✅
- [ ] **Sentry Setup**
  - [ ] Sentry project created
  - [ ] NEXT_PUBLIC_SENTRY_DSN set to production DSN
  - [ ] SENTRY_AUTH_TOKEN configured
  - [ ] initializeMonitoring() called in root layout
  - [ ] Performance monitoring enabled (tracesSampleRate: 0.1)
  - [ ] Error rate threshold alerts configured
  - [ ] Slack/Email notifications enabled
  - [ ] Release tracking enabled

- [ ] **Health Checks**
  - [ ] `/api/health` endpoint responding with status
  - [ ] Health check includes:
    - API server status
    - Database connectivity
    - Redis connectivity (if applicable)
    - External service status (Stripe, etc.)
  - [ ] Uptime monitoring service configured (UptimeRobot, etc.)
  - [ ] Alert threshold: alert on 2+ consecutive failures

- [ ] **Logging**
  - [ ] Structured logging implemented
  - [ ] Log aggregation service configured (CloudWatch, Datadog, etc.)
  - [ ] Log retention policy set (minimum 30 days)
  - [ ] Log sampling configured for high-volume endpoints
  - [ ] Sensitive data (passwords, tokens) never logged

- [ ] **Performance Monitoring**
  - [ ] Core Web Vitals monitored (Vercel Analytics or alternative)
  - [ ] Database query performance monitored
  - [ ] API response time percentiles tracked (P50, P95, P99)
  - [ ] Error rate by endpoint monitored
  - [ ] Custom metrics for webhooks, orders, reconciliation

---

### 6. Security ✅
- [ ] **SSL/TLS**
  - [ ] HTTPS enforced (auto-redirect from HTTP → HTTPS)
  - [ ] SSL certificate valid and not expired
  - [ ] Certificate auto-renewal configured
  - [ ] HSTS header set (Strict-Transport-Security)
  - [ ] Certificate pinning considered (if using public API)

- [ ] **Authentication & Authorization**
  - [ ] Auth.js properly configured
  - [ ] Session secret is strong and random
  - [ ] JWT expiration reasonable (15 min - 7 days)
  - [ ] Role-based access control (RBAC) enforced
  - [ ] API routes protected with auth checks
  - [ ] OAuth providers (Google, etc.) configured for production

- [ ] **Rate Limiting**
  - [ ] Rate limiting on all API endpoints
  - [ ] Auth endpoints: 10 requests/min per IP
  - [ ] Search endpoints: 30 requests/min per user
  - [ ] Order endpoints: 20 requests/min per user
  - [ ] Upload endpoints: 5 requests/5 min per user
  - [ ] Webhook endpoints: per-subscription rate limits

- [ ] **CORS Configuration**
  - [ ] CORS headers properly configured
  - [ ] Only trusted domains allowed
  - [ ] Credentials handling correct (SameSite cookies)
  - [ ] Preflight caching optimized

- [ ] **Data Protection**
  - [ ] PII encryption at rest (MongoDB encryption enabled)
  - [ ] PII encryption in transit (HTTPS + TLS)
  - [ ] Sensitive fields masked in logs
  - [ ] Database credentials never exposed in logs or error messages
  - [ ] File uploads scanned for malware
  - [ ] Input validation on all user inputs (Zod)
  - [ ] SQL injection protection (Mongoose parameterized queries)
  - [ ] XSS protection enabled

- [ ] **Compliance**
  - [ ] GDPR privacy policy published
  - [ ] Cookie consent banner implemented
  - [ ] User data export functionality available
  - [ ] User data deletion functionality available
  - [ ] Terms of Service published
  - [ ] Payment processing compliance (PCI DSS via Stripe)

---

### 7. Deployment Infrastructure ✅
- [ ] **Vercel Deployment**
  - [ ] Production environment configured
  - [ ] GitHub repository connected
  - [ ] Auto-deployment on push to main branch
  - [ ] Preview deployments enabled
  - [ ] Environment variables configured in Vercel dashboard
  - [ ] Custom domain configured (SSL cert auto-renewed)
  - [ ] Deployment logs accessible
  - [ ] Rollback procedure documented

- [ ] **Alternative Deployment (Docker/Self-Hosted)**
  - [ ] Dockerfile optimized for production
  - [ ] Docker image tested locally
  - [ ] Image pushed to container registry (Docker Hub, ECR, etc.)
  - [ ] Container orchestration configured (if using Kubernetes)
  - [ ] Health check endpoint configured in container

- [ ] **Load Balancing** (if applicable)
  - [ ] Load balancer configured
  - [ ] Health checks configured
  - [ ] Auto-scaling rules configured
  - [ ] Sticky sessions (if needed) configured

---

### 8. Compliance & Legal ✅
- [ ] **Privacy**
  - [ ] Privacy policy updated with data processing details
  - [ ] GDPR compliance verified
  - [ ] CCPA compliance verified (if applicable)
  - [ ] Privacy policy accessible at `/privacy`

- [ ] **Terms of Service**
  - [ ] Terms of Service documented
  - [ ] Vendor agreement documented
  - [ ] Acceptable use policy documented
  - [ ] Terms accessible at `/terms`

- [ ] **Payment Processing**
  - [ ] PCI DSS compliance achieved (Stripe handles)
  - [ ] Payment terms documented
  - [ ] Refund policy documented
  - [ ] Chargeback policy documented

---

### 9. Vendor Setup ✅
- [ ] **Vendor Onboarding**
  - [ ] Vendor application form functional
  - [ ] Vendor approval workflow tested
  - [ ] Vendor dashboard accessible
  - [ ] Stripe Connect integration working
  - [ ] Vendor payout process tested

- [ ] **Vendor Webhooks** (New)
  - [ ] Vendor webhook subscription UI working
  - [ ] Webhook testing functionality available
  - [ ] Delivery history visible to vendors
  - [ ] Manual replay available to vendors

---

### 10. Testing & Quality Assurance ✅
- [ ] **Test Coverage**
  - [ ] Unit tests: >70% coverage
  - [ ] Integration tests for critical paths
  - [ ] E2E tests for order flow (order → payment → delivery)
  - [ ] Webhook tests: delivery, retry, replay
  - [ ] Test suite runs in CI/CD pipeline

- [ ] **Browser Testing**
  - [ ] Chrome (latest) - Desktop & Mobile
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
  - [ ] iOS Safari
  - [ ] Android Chrome

- [ ] **Performance Testing**
  - [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
  - [ ] First Contentful Paint (FCP) < 1.5s
  - [ ] Largest Contentful Paint (LCP) < 2.5s
  - [ ] Cumulative Layout Shift (CLS) < 0.1
  - [ ] Time to Interactive (TTI) < 3.5s
  - [ ] Load testing completed (100+ concurrent users)

- [ ] **Security Testing**
  - [ ] OWASP Top 10 vulnerabilities checked
  - [ ] Dependency vulnerability scan (npm audit)
  - [ ] Penetration testing (if applicable)

---

### 11. Documentation ✅
- [ ] **Runbooks**
  - [ ] Production deployment runbook
  - [ ] Disaster recovery runbook
  - [ ] Webhook troubleshooting guide
  - [ ] Database migration guide
  - [ ] Rollback procedure documented

- [ ] **API Documentation**
  - [ ] REST API documentation (Swagger/OpenAPI)
  - [ ] Webhook event documentation
  - [ ] Error code reference
  - [ ] Rate limiting documentation

- [ ] **Architecture Documentation**
  - [ ] System architecture diagram
  - [ ] Data flow diagrams
  - [ ] Database schema documented
  - [ ] Deployment architecture documented

---

### 12. Launch Readiness ✅
- [ ] **Soft Launch**
  - [ ] Limited user testing (beta group)
  - [ ] Monitoring active during soft launch
  - [ ] Alert thresholds appropriate (not too strict)
  - [ ] Team on standby for issues

- [ ] **Production Launch**
  - [ ] All checks above completed
  - [ ] Backup created before launch
  - [ ] Team communicated and ready
  - [ ] Runbooks accessible to team
  - [ ] Communication channels open (Slack, etc.)
  - [ ] Success metrics defined and tracked

- [ ] **Post-Launch**
  - [ ] Monitor error rates for 24-48 hours
  - [ ] Monitor performance metrics
  - [ ] Check webhook delivery success rates
  - [ ] Monitor database performance
  - [ ] Gather user feedback
  - [ ] Document any issues and resolutions

---

## Success Criteria for Production Launch

✅ **All environment variables configured correctly**
✅ **Database fully indexed and backed up**
✅ **Webhook systems tested end-to-end**
✅ **Monitoring and alerting active**
✅ **Error tracking (Sentry) functional**
✅ **Performance metrics collected and within targets**
✅ **Security scan completed with no critical vulnerabilities**
✅ **User authentication and authorization working**
✅ **Payment processing tested with real (test) transactions**
✅ **Team trained on runbooks and incident response**
✅ **24/7 support plan in place**

---

## Quick Rollback Procedure

If issues arise post-launch:

1. **Immediate**: Alert team via Slack/communication channel
2. **1 min**: Revert to previous working deployment in Vercel
3. **5 min**: Check Sentry for error spikes
4. **10 min**: Review webhook delivery status
5. **15 min**: Check database status and slow queries
6. **20 min**: Post-mortem started

---

## Estimated Time to Complete

- **Environment Setup**: 2-3 hours
- **Database Configuration**: 1-2 hours
- **Testing & QA**: 4-6 hours
- **Security Review**: 2-3 hours
- **Documentation**: 2-3 hours
- **Total**: 11-17 hours

---

## Sign-Off

- [ ] **Tech Lead**: _________________ Date: _______
- [ ] **DevOps/Deployment**: _________________ Date: _______
- [ ] **Security Review**: _________________ Date: _______
- [ ] **Product Manager**: _________________ Date: _______

**Launch Approved**: _________________ Date: _______
