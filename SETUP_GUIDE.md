# MongoDB & Environment Setup Guide

## Overview

This guide covers setting up MongoDB with Docker and configuring environment variables for the NxtAmzn marketplace.

## MongoDB Docker Setup

### Structure

```
docker/mongodb/
├── init/
│   ├── 01-init.js     # Database & collection initialization
│   └── 02-seed.js     # Sample data seeding
```

### MongoDB Initialization Scripts

MongoDB init scripts are automatically executed when the Docker container starts for the first time.

#### `01-init.js` - Database Initialization
- Creates the `amazona` database
- Creates all necessary collections (users, products, orders, etc.)
- Sets up indexes for optimal query performance
- Ensures data consistency and efficient querying

#### `02-seed.js` - Sample Data
- Inserts sample categories (Electronics, Clothing, Books, etc.)
- Creates demo users (admin, vendor, customer)
- Adds sample products for testing
- Initializes application settings

### Running MongoDB with Docker

```bash
# Start MongoDB container
docker-compose up -d mongo

# Verify MongoDB is running
docker-compose logs mongo

# Access MongoDB shell
docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin

# To connect with Compass or client
# Connection String: mongodb://admin:password@localhost:27017/amazona?authSource=admin
```

### MongoDB Credentials

- **Username**: `admin`
- **Password**: `password`
- **Database**: `amazona`
- **Port**: `27017`

⚠️ **Important**: Change these credentials in production!

## Environment Variables (.env)

### Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your actual credentials:
   ```bash
   # Required for local Docker setup (already configured)
   MONGODB_URI=mongodb://admin:password@mongo:27017/amazona?authSource=admin
   
   # Update with your actual keys
   STRIPE_SECRET_KEY=sk_test_...
   PAYPAL_CLIENT_ID=your_client_id
   ANTHROPIC_API_KEY=sk-ant-...
   # ... etc
   ```

### Environment Variables Categories

| Category | Variables | Status |
|----------|-----------|--------|
| **App Config** | NODE_ENV, NEXT_PUBLIC_BASE_URL, APP_NAME | Required |
| **Database** | MONGODB_URI | Required |
| **Authentication** | NEXTAUTH_SECRET, NEXTAUTH_URL | Required |
| **Payments** | STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID | Required |
| **Email** | RESEND_API_KEY, SENDER_EMAIL | Optional |
| **Real-time** | PUSHER_KEY, PUSHER_SECRET | Optional |
| **Monitoring** | SENTRY_DSN | Optional |
| **AI/ML** | ANTHROPIC_API_KEY | Optional |

### Quick Setup Checklist

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `NEXTAUTH_SECRET` to a random 32+ character string
- [ ] Add Stripe keys (test keys for development)
- [ ] Add PayPal credentials
- [ ] Set other optional integrations as needed
- [ ] Verify `MONGODB_URI` matches Docker setup
- [ ] Run `docker-compose up` to test

## Docker Compose Stack

### Services

```yaml
Services in docker-compose.yml:
├── app (Next.js application)
├── mongo (MongoDB database)
├── redis (Cache & rate limiting)
└── mailhog (SMTP testing UI)
```

### Starting the Stack

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Full cleanup (removes volumes)
docker-compose down -v
```

## Database Access

### Using MongoDB Shell

```bash
# Connect via Docker
docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin

# Common commands
show dbs                 # List databases
use amazona              # Switch to amazona database
show collections         # List collections
db.users.find()         # View users
db.products.find()      # View products
db.orders.find()        # View orders
```

### Using MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect with: `mongodb://admin:password@localhost:27017/amazona?authSource=admin`
3. Browse collections and data visually

## Troubleshooting

### MongoDB connection fails
```bash
# Check if MongoDB is running
docker-compose ps mongo

# Check logs
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

### Port already in use
```bash
# Change port in docker-compose.yml
# Change from 27017:27017 to 27018:27017
docker-compose up -d
```

### Init scripts not running
```bash
# Init scripts run only on first start
# To re-run: remove volume, then restart
docker-compose down -v
docker-compose up -d mongo

# Or manually run scripts
docker-compose exec mongo mongosh -u admin -p password --authenticationDatabase admin < docker/mongodb/init/01-init.js
```

### Environment variables not loading
```bash
# Verify .env.local exists in project root
# Verify Next.js is restarted
docker-compose restart app

# Check that values are properly set
docker-compose exec app env | grep MONGODB
```

## Security Notes

1. **Development Only**: Credentials in `.env.local` are for development
2. **Production**: Use strong passwords and secure credential management
3. **Never commit** `.env.local` to version control
4. **.gitignore**: Already includes `.env.local` and `.env.production.local`

## Next Steps

1. Start services: `docker-compose up -d`
2. Access application: `http://localhost:3000`
3. View emails: `http://localhost:8025` (Mailhog)
4. Monitor MongoDB: Use MongoDB Compass or shell

## Resources

- [MongoDB Official Docs](https://docs.mongodb.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
