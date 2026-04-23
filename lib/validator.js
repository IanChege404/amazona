"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingInputSchema = exports.DeliveryDateSchema = exports.PaymentMethodSchema = exports.SiteCurrencySchema = exports.CarouselSchema = exports.SiteLanguageSchema = exports.WebPageUpdateSchema = exports.WebPageInputSchema = exports.VendorApplicationSchema = exports.VendorInputSchema = exports.UserUpdatePasswordSchema = exports.UserUpdateEmailSchema = exports.UserAddressSchema = exports.UserNameSchema = exports.UserSignUpSchema = exports.UserSignInSchema = exports.UserInputSchema = exports.UserUpdateSchema = exports.CartSchema = exports.OrderInputSchema = exports.ShippingAddressSchema = exports.OrderItemSchema = exports.ProductUpdateSchema = exports.ProductInputSchema = exports.ReviewInputSchema = void 0;
var zod_1 = require("zod");
var utils_1 = require("./utils");
// Common
var MongoId = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid MongoDB ID' });
var Price = function (field) {
    return zod_1.z.coerce
        .number()
        .refine(function (value) { return /^\d+(\.\d{2})?$/.test((0, utils_1.formatNumberWithDecimal)(value)); }, "".concat(field, " must have exactly two decimal places (e.g., 49.99)"));
};
exports.ReviewInputSchema = zod_1.z.object({
    product: MongoId,
    user: MongoId,
    isVerifiedPurchase: zod_1.z.boolean(),
    title: zod_1.z.string().min(1, 'Title is required'),
    comment: zod_1.z.string().min(1, 'Comment is required'),
    rating: zod_1.z.coerce
        .number()
        .int()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5'),
});
exports.ProductInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Name must be at least 3 characters'),
    slug: zod_1.z.string().min(3, 'Slug must be at least 3 characters'),
    category: zod_1.z.string().min(1, 'Category is required'),
    images: zod_1.z.array(zod_1.z.string()).min(1, 'Product must have at least one image'),
    brand: zod_1.z.string().min(1, 'Brand is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    isPublished: zod_1.z.boolean(),
    vendorId: MongoId,
    vendorName: zod_1.z.string().min(1, 'Vendor name is required'),
    embedding: zod_1.z.array(zod_1.z.number()).optional(),
    price: Price('Price'),
    listPrice: Price('List price'),
    countInStock: zod_1.z.coerce
        .number()
        .int()
        .nonnegative('count in stock must be a non-negative number'),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    sizes: zod_1.z.array(zod_1.z.string()).default([]),
    colors: zod_1.z.array(zod_1.z.string()).default([]),
    avgRating: zod_1.z.coerce
        .number()
        .min(0, 'Average rating must be at least 0')
        .max(5, 'Average rating must be at most 5'),
    numReviews: zod_1.z.coerce
        .number()
        .int()
        .nonnegative('Number of reviews must be a non-negative number'),
    ratingDistribution: zod_1.z
        .array(zod_1.z.object({ rating: zod_1.z.number(), count: zod_1.z.number() }))
        .max(5),
    reviews: zod_1.z.array(exports.ReviewInputSchema).default([]),
    numSales: zod_1.z.coerce
        .number()
        .int()
        .nonnegative('Number of sales must be a non-negative number'),
});
exports.ProductUpdateSchema = exports.ProductInputSchema.extend({
    _id: zod_1.z.string(),
});
// Order Item
exports.OrderItemSchema = zod_1.z.object({
    clientId: zod_1.z.string().min(1, 'clientId is required'),
    product: zod_1.z.string().min(1, 'Product is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    slug: zod_1.z.string().min(1, 'Slug is required'),
    category: zod_1.z.string().min(1, 'Category is required'),
    quantity: zod_1.z
        .number()
        .int()
        .nonnegative('Quantity must be a non-negative number'),
    countInStock: zod_1.z
        .number()
        .int()
        .nonnegative('Quantity must be a non-negative number'),
    image: zod_1.z.string().min(1, 'Image is required'),
    price: Price('Price'),
    size: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    vendorId: zod_1.z.string().min(1, 'Vendor ID is required'),
    vendorName: zod_1.z.string().min(1, 'Vendor name is required'),
});
exports.ShippingAddressSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, 'Full name is required'),
    street: zod_1.z.string().min(1, 'Address is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    postalCode: zod_1.z.string().min(1, 'Postal code is required'),
    province: zod_1.z.string().min(1, 'Province is required'),
    phone: zod_1.z.string().min(1, 'Phone number is required'),
    country: zod_1.z.string().min(1, 'Country is required'),
});
// Order
exports.OrderInputSchema = zod_1.z.object({
    user: zod_1.z.union([
        MongoId,
        zod_1.z.object({
            name: zod_1.z.string(),
            email: zod_1.z.string().email(),
        }),
    ]),
    items: zod_1.z
        .array(exports.OrderItemSchema)
        .min(1, 'Order must contain at least one item'),
    shippingAddress: exports.ShippingAddressSchema,
    paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
    paymentResult: zod_1.z
        .object({
        id: zod_1.z.string(),
        status: zod_1.z.string(),
        email_address: zod_1.z.string(),
        pricePaid: zod_1.z.string(),
    })
        .optional(),
    itemsPrice: Price('Items price'),
    shippingPrice: Price('Shipping price'),
    taxPrice: Price('Tax price'),
    totalPrice: Price('Total price'),
    expectedDeliveryDate: zod_1.z
        .date()
        .refine(function (value) { return value > new Date(); }, 'Expected delivery date must be in the future'),
    isDelivered: zod_1.z.boolean().default(false),
    deliveredAt: zod_1.z.date().optional(),
    isPaid: zod_1.z.boolean().default(false),
    paidAt: zod_1.z.date().optional(),
});
// Cart
exports.CartSchema = zod_1.z.object({
    items: zod_1.z
        .array(exports.OrderItemSchema)
        .min(1, 'Order must contain at least one item'),
    itemsPrice: zod_1.z.number(),
    taxPrice: zod_1.z.optional(zod_1.z.number()),
    shippingPrice: zod_1.z.optional(zod_1.z.number()),
    totalPrice: zod_1.z.number(),
    paymentMethod: zod_1.z.optional(zod_1.z.string()),
    shippingAddress: zod_1.z.optional(exports.ShippingAddressSchema),
    deliveryDateIndex: zod_1.z.optional(zod_1.z.number()),
    expectedDeliveryDate: zod_1.z.optional(zod_1.z.date()),
});
// USER
var UserName = zod_1.z
    .string()
    .min(2, { message: 'Username must be at least 2 characters' })
    .max(50, { message: 'Username must be at most 30 characters' });
var Email = zod_1.z.string().min(1, 'Email is required').email('Email is invalid');
var Password = zod_1.z.string().min(3, 'Password must be at least 3 characters');
var UserRole = zod_1.z.enum(['user', 'vendor', 'admin']);
exports.UserUpdateSchema = zod_1.z.object({
    _id: MongoId,
    name: UserName,
    email: Email,
    role: UserRole,
});
exports.UserInputSchema = zod_1.z.object({
    name: UserName,
    email: Email,
    image: zod_1.z.string().optional(),
    emailVerified: zod_1.z.boolean(),
    role: UserRole,
    password: Password,
    paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
    address: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Full name is required'),
        street: zod_1.z.string().min(1, 'Street is required'),
        city: zod_1.z.string().min(1, 'City is required'),
        province: zod_1.z.string().min(1, 'Province is required'),
        postalCode: zod_1.z.string().min(1, 'Postal code is required'),
        country: zod_1.z.string().min(1, 'Country is required'),
        phone: zod_1.z.string().min(1, 'Phone number is required'),
    }),
});
exports.UserSignInSchema = zod_1.z.object({
    email: Email,
    password: Password,
});
exports.UserSignUpSchema = exports.UserSignInSchema.extend({
    name: UserName,
    confirmPassword: Password,
}).refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
exports.UserNameSchema = zod_1.z.object({
    name: UserName,
});
exports.UserAddressSchema = exports.ShippingAddressSchema;
exports.UserUpdateEmailSchema = zod_1.z.object({
    email: Email,
    currentPassword: Password,
});
exports.UserUpdatePasswordSchema = zod_1.z
    .object({
    currentPassword: Password,
    newPassword: Password,
    confirmPassword: Password,
})
    .refine(function (data) { return data.newPassword === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
// VENDOR
exports.VendorInputSchema = zod_1.z.object({
    userId: MongoId,
    businessName: zod_1.z
        .string()
        .min(2, 'Business name must be at least 2 characters')
        .max(50, 'Business name must be at most 50 characters'),
    slug: zod_1.z
        .string()
        .min(2, 'Slug must be at least 2 characters')
        .max(50, 'Slug must be at most 50 characters'),
    description: zod_1.z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must be at most 500 characters'),
    logo: zod_1.z.string().optional(),
    banner: zod_1.z.string().optional(),
    email: Email,
    phone: zod_1.z.string().optional(),
    address: zod_1.z
        .object({
        street: zod_1.z.string().min(1, 'Street is required'),
        city: zod_1.z.string().min(1, 'City is required'),
        country: zod_1.z.string().min(1, 'Country is required'),
    })
        .optional(),
    status: zod_1.z.enum(['pending', 'approved', 'suspended']),
    stripeAccountId: zod_1.z.string().optional(),
    stripeOnboardingComplete: zod_1.z.boolean(),
    stripeRequirementsDue: zod_1.z.array(zod_1.z.string()).optional(),
    commissionRate: zod_1.z.coerce
        .number()
        .min(0, 'Commission rate must be at least 0')
        .max(100, 'Commission rate must be at most 100'),
    totalRevenue: zod_1.z.coerce
        .number()
        .nonnegative('Total revenue must be non-negative'),
    totalOrders: zod_1.z.coerce
        .number()
        .int()
        .nonnegative('Total orders must be non-negative'),
    rating: zod_1.z.coerce
        .number()
        .min(0, 'Rating must be at least 0')
        .max(5, 'Rating must be at most 5'),
    numReviews: zod_1.z.coerce
        .number()
        .int()
        .nonnegative('Number of reviews must be non-negative'),
    subscriptionTier: zod_1.z.enum(['free', 'starter', 'pro']).optional(),
    subscriptionId: zod_1.z.string().optional(),
    stripeCustomerId: zod_1.z.string().optional(),
    subscriptionStatus: zod_1.z.enum(['active', 'past_due', 'canceled', 'trialing']).optional(),
    subscriptionCurrentPeriodEnd: zod_1.z.date().optional(),
});
exports.VendorApplicationSchema = zod_1.z.object({
    businessName: zod_1.z
        .string()
        .min(2, 'Business name must be at least 2 characters')
        .max(50, 'Business name must be at most 50 characters'),
    description: zod_1.z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must be at most 500 characters'),
    email: Email,
    phone: zod_1.z.string().min(7, 'Phone number must be valid'),
    address: zod_1.z.object({
        street: zod_1.z.string().min(1, 'Street is required'),
        city: zod_1.z.string().min(1, 'City is required'),
        country: zod_1.z.string().min(1, 'Country is required'),
    }),
    logo: zod_1.z.string().optional(),
    banner: zod_1.z.string().optional(),
});
// WEBPAGE
exports.WebPageInputSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    slug: zod_1.z.string().min(3, 'Slug must be at least 3 characters'),
    content: zod_1.z.string().min(1, 'Content is required'),
    isPublished: zod_1.z.boolean(),
});
exports.WebPageUpdateSchema = exports.WebPageInputSchema.extend({
    _id: zod_1.z.string(),
});
// Setting
exports.SiteLanguageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    code: zod_1.z.string().min(1, 'Code is required'),
});
exports.CarouselSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'title is required'),
    url: zod_1.z.string().min(1, 'url is required'),
    image: zod_1.z.string().min(1, 'image is required'),
    buttonCaption: zod_1.z.string().min(1, 'buttonCaption is required'),
});
exports.SiteCurrencySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    code: zod_1.z.string().min(1, 'Code is required'),
    convertRate: zod_1.z.coerce.number().min(0, 'Convert rate must be at least 0'),
    symbol: zod_1.z.string().min(1, 'Symbol is required'),
});
exports.PaymentMethodSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    commission: zod_1.z.coerce.number().min(0, 'Commission must be at least 0'),
});
exports.DeliveryDateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    daysToDeliver: zod_1.z.number().min(0, 'Days to deliver must be at least 0'),
    shippingPrice: zod_1.z.coerce.number().min(0, 'Shipping price must be at least 0'),
    freeShippingMinPrice: zod_1.z.coerce
        .number()
        .min(0, 'Free shipping min amount must be at least 0'),
});
exports.SettingInputSchema = zod_1.z.object({
    // PROMPT: create fields
    // codeium, based on the mongoose schema for settings
    common: zod_1.z.object({
        pageSize: zod_1.z.coerce
            .number()
            .min(1, 'Page size must be at least 1')
            .default(9),
        isMaintenanceMode: zod_1.z.boolean().default(false),
        freeShippingMinPrice: zod_1.z.coerce
            .number()
            .min(0, 'Free shipping min price must be at least 0')
            .default(0),
        defaultTheme: zod_1.z
            .string()
            .min(1, 'Default theme is required')
            .default('light'),
        defaultColor: zod_1.z
            .string()
            .min(1, 'Default color is required')
            .default('gold'),
    }),
    site: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        logo: zod_1.z.string().min(1, 'logo is required'),
        slogan: zod_1.z.string().min(1, 'Slogan is required'),
        description: zod_1.z.string().min(1, 'Description is required'),
        keywords: zod_1.z.string().min(1, 'Keywords is required'),
        url: zod_1.z.string().min(1, 'Url is required'),
        email: zod_1.z.string().min(1, 'Email is required'),
        phone: zod_1.z.string().min(1, 'Phone is required'),
        author: zod_1.z.string().min(1, 'Author is required'),
        copyright: zod_1.z.string().min(1, 'Copyright is required'),
        address: zod_1.z.string().min(1, 'Address is required'),
    }),
    availableLanguages: zod_1.z
        .array(exports.SiteLanguageSchema)
        .min(1, 'At least one language is required'),
    carousels: zod_1.z
        .array(exports.CarouselSchema)
        .min(1, 'At least one language is required'),
    defaultLanguage: zod_1.z.string().min(1, 'Language is required'),
    availableCurrencies: zod_1.z
        .array(exports.SiteCurrencySchema)
        .min(1, 'At least one currency is required'),
    defaultCurrency: zod_1.z.string().min(1, 'Currency is required'),
    availablePaymentMethods: zod_1.z
        .array(exports.PaymentMethodSchema)
        .min(1, 'At least one payment method is required'),
    defaultPaymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
    availableDeliveryDates: zod_1.z
        .array(exports.DeliveryDateSchema)
        .min(1, 'At least one delivery date is required'),
    defaultDeliveryDate: zod_1.z.string().min(1, 'Delivery date is required'),
});
