// MongoDB Initialization Script
// Creates the application database and defines initial collections

// Select the admin database to authenticate
db = db.getSiblingDB('admin');

// Authenticate with root credentials
db.auth('admin', 'password');

// Switch to application database
db = db.getSiblingDB('amazona');

// Create collections with validation schemas
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('reviews');
db.createCollection('categories');
db.createCollection('payments');
db.createCollection('payouts');
db.createCollection('vendors');
db.createCollection('vendor_applications');
db.createCollection('webhook_events');
db.createCollection('webhook_replays');
db.createCollection('settings');
db.createCollection('notifications');

// Create indexes for better query performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ category: 1 });
db.products.createIndex({ vendor: 1 });
db.products.createIndex({ rating: -1 });
db.products.createIndex({ createdAt: -1 });

db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ user: 1 });
db.orders.createIndex({ vendor: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

db.reviews.createIndex({ product: 1 });
db.reviews.createIndex({ user: 1 });
db.reviews.createIndex({ createdAt: -1 });

db.categories.createIndex({ slug: 1 }, { unique: true });

db.payments.createIndex({ orderId: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ createdAt: -1 });

db.payouts.createIndex({ vendor: 1 });
db.payouts.createIndex({ status: 1 });
db.payouts.createIndex({ createdAt: -1 });

db.vendors.createIndex({ slug: 1 }, { unique: true });
db.vendors.createIndex({ email: 1 }, { unique: true });

db.webhook_events.createIndex({ eventType: 1 });
db.webhook_events.createIndex({ status: 1 });
db.webhook_events.createIndex({ createdAt: -1 });

db.webhook_replays.createIndex({ originalEventId: 1 });
db.webhook_replays.createIndex({ status: 1 });

print('✅ MongoDB Initialization Complete');
print('   - Database: amazona');
print('   - Collections: 14');
print('   - Indexes: Created for optimal performance');
