# Quick Start & Reference

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# - Add Stripe keys (test/live)
# - Add PayPal credentials
# - Add other API keys as needed
```

### 2. Start Docker Stack
```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f app
```

### 3. Access Application
- **App**: http://localhost:3000
- **Mailhog (Email UI)**: http://localhost:8025
- **MongoDB Port**: localhost:27017

## 📁 Project Structure

```
📦 nextjs-amazona
├── 📂 app/                    # Next.js app directory (routes, pages)
├── 📂 components/             # React components
├── 📂 lib/                    # Utilities and helpers
├── 📂 public/                 # Static files
├── 📂 docker/
│   ├── 📂 mongodb/
│   │   └── 📂 init/
│   │       ├── 01-init.js     # Database setup
│   │       └── 02-seed.js     # Sample data
│   └── Dockerfile             # App container image
├── .env.local                 # Environment variables (local)
├── .env.example               # Environment template
├── docker-compose.yml         # Development stack
├── docker-compose.prod.yml    # Production stack
└── SETUP_GUIDE.md             # Detailed setup docs
```

## 🗄️ Database

### MongoDB Collections
- `users` - User accounts and authentication
- `products` - Product listings
- `orders` - Customer orders
- `reviews` - Product reviews
- `categories` - Product categories
- `payments` - Payment records
- `payouts` - Vendor payouts
- `vendors` - Vendor information
- `webhook_events` - Webhook logs
- `settings` - App configuration

### Sample Credentials (Development Only)
```
MongoDB Admin:
  Username: admin
  Password: password
  
Connection: mongodb://admin:password@localhost:27017/amazona?authSource=admin
```

## 🔑 Environment Variables

### Required
- `NEXTAUTH_SECRET` - Auth session secret (min 32 chars)
- `MONGODB_URI` - Database connection string
- `STRIPE_SECRET_KEY` - Stripe API key
- `PAYPAL_CLIENT_ID` - PayPal client ID

### Optional but Recommended
- `RESEND_API_KEY` - Email service
- `ANTHROPIC_API_KEY` - AI features
- `SENTRY_DSN` - Error monitoring
- `PUSHER_*` - Real-time features

See `.env.example` for complete list.

## 📝 Common Commands

### Docker
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Remove volumes (clean database)
docker-compose down -v

# View service logs
docker-compose logs -f [service_name]

# Execute command in container
docker-compose exec [service] [command]
```

### MongoDB
```bash
# Connect to MongoDB shell
docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin

# View collections
show collections

# Insert sample data
db.products.insertOne({name: "Product", price: 99.99})

# Query data
db.products.find({})
db.products.findOne({})
```

### Next.js
```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker-compose logs mongo

# Test connection from app
docker-compose exec app mongosh --eval "db.adminCommand('ping')"
```

### Port Already in Use
```bash
# Change port in docker-compose.yml
# Example: change 27017:27017 to 27018:27017
```

### Env Variables Not Loading
```bash
# Restart app container
docker-compose restart app

# Verify variables are set
docker-compose exec app env | grep NEXT_PUBLIC
```

### Init Scripts Not Running
```bash
# Init scripts only run on container first start
# Clean up and restart
docker-compose down -v
docker-compose up -d mongo
```

## 📚 Resources

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup documentation
- [MongoDB Docs](https://docs.mongodb.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Docker Compose Docs](https://docs.docker.com/compose/)

## ✅ Deployment Checklist

- [ ] Database backups configured
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Monitoring configured (Sentry)
- [ ] Error logging enabled
- [ ] Database credentials rotated
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Only production env in .env.production
- [ ] Health checks working

## 🎯 Next Steps

1. ✅ Set up Docker and MongoDB
2. ✅ Configure environment variables
3. ⬜️ Create admin account
4. ⬜️ Set up payment processors
5. ⬜️ Configure email service
6. ⬜️ Set up monitoring
7. ⬜️ Deploy to production
