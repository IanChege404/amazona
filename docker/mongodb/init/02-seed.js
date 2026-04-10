// MongoDB Seed Script - Sample Data
// This runs AFTER the initial setup script

db = db.getSiblingDB('admin');
db.auth('admin', 'password');
db = db.getSiblingDB('amazona');

// Insert sample categories
db.categories.insertMany([
  {
    _id: ObjectId(),
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and accessories',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: ObjectId(),
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and apparel',
    image: 'https://images.unsplash.com/photo-1489987046614-6f0ee8e88763?w=500',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: ObjectId(),
    name: 'Books',
    slug: 'books',
    description: 'Books and reading materials',
    image: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=500',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: ObjectId(),
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home and garden products',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: ObjectId(),
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sports equipment and outdoor gear',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Insert sample users (will be created dynamically in real usage)
db.users.insertMany([
  {
    _id: ObjectId(),
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
  },
  {
    _id: ObjectId(),
    email: 'vendor@example.com',
    name: 'Vendor User',
    role: 'vendor',
    createdAt: new Date(),
  },
  {
    _id: ObjectId(),
    email: 'customer@example.com',
    name: 'Customer User',
    role: 'customer',
    createdAt: new Date(),
  },
]);

// Insert sample products
const categoryId = db.categories.findOne({ slug: 'electronics' })._id;
db.products.insertMany([
  {
    _id: ObjectId(),
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Premium wireless headphones with noise cancellation',
    price: 99.99,
    originalPrice: 149.99,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    category: categoryId,
    rating: 4.5,
    reviews: 0,
    tags: ['electronics', 'audio', 'wireless'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: ObjectId(),
    name: 'USB-C Cable',
    slug: 'usb-c-cable',
    description: 'Fast charging USB-C cable',
    price: 9.99,
    originalPrice: 14.99,
    stock: 200,
    images: ['https://images.unsplash.com/photo-1625948515291-49613eebf314?w=500'],
    category: categoryId,
    rating: 4.8,
    reviews: 0,
    tags: ['electronics', 'cable', 'usb'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Create sample settings
db.settings.insertOne({
  _id: 'app_settings',
  siteName: 'NxtAmzn',
  freeShippingMinPrice: 35,
  defaultPageSize: 9,
  platform_fee_percentage: 10,
  currency: 'USD',
  updatedAt: new Date(),
});

print('✅ MongoDB Seed Data Complete');
print('   - Categories: 5');
print('   - Users: 3 (sample)');
print('   - Products: 2 (sample)');
print('   - Settings: Initialized');
