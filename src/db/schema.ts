import { pgTable, text, serial, timestamp, boolean, integer, json, decimal, uuid, AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- ENUMS --- //
// We can use simple text fields with app-level validation, or pgEnum if preferred.
// Let's stick to text for flexibility and easier migrations, documenting the expected values.

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'tailoring', 'laundry', 'both'
  registrationNumber: text('registration_number'),
  ownerName: text('owner_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  logoUrl: text('logo_url'),
  description: text('description'),
  whatsappNumber: text('whatsapp_number'),
  whatsappSettings: json('whatsapp_settings'),
  status: text('status').default('active'), // 'active', 'disabled', 'suspended', 'archived'
  currency: text('currency').default('NGN'),
  taxRate: decimal('tax_rate').default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }), // null for super admin
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  username: text('username'),
  staffId: text('staff_id'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'superadmin', 'admin', 'staff'
  status: text('status').default('active'), // 'active', 'inactive', 'suspended'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  whatsappNumber: text('whatsapp_number'),
  email: text('email'),
  address: text('address'),
  gender: text('gender'),
  measurements: json('measurements'), // JSON structure for tailoring measurements
  totalSpending: decimal('total_spending').default('0'),
  outstandingBalance: decimal('outstanding_balance').default('0'),
  lastOrderDate: timestamp('last_order_date'),
  lastPaymentDate: timestamp('last_payment_date'),
  notes: text('notes'),
  status: text('status').default('active'), // 'new', 'active', 'returning', 'at_risk', 'inactive'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'tailoring', 'laundry'
  price: decimal('price').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull(), // Unique per business, e.g. ORD-1001
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull(), // 'tailoring', 'laundry'
  status: text('status').default('new'), // tailoring: new, measurement_taken, cutting, sewing, finishing, ready, delivered, cancelled / laundry: received, sorting, washing, drying, ironing, quality_check, ready, delivered, cancelled
  totalAmount: decimal('total_amount').notNull(),
  totalPaid: decimal('total_paid').default('0'),
  balance: decimal('balance').default('0'),
  pickupDate: timestamp('pickup_date'),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  serviceId: uuid('service_id').references(() => services.id),
  description: text('description'), // specific garment or laundry instructions
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price').notNull(),
  totalPrice: decimal('total_price').notNull(),
  measurements: json('measurements'), // JSON structure for tailoring measurements
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount').notNull(),
  method: text('method').notNull(), // 'cash', 'transfer', 'pos', 'card'
  reference: text('reference'),
  status: text('status').default('completed'), // 'completed', 'refunded'
  recordedById: uuid('recorded_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communications = pgTable('communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'whatsapp', 'email', 'sms'
  content: text('content').notNull(),
  status: text('status').default('sent'), // 'sent', 'delivered', 'failed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const businessRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  orders: many(orders),
  services: many(services),
}));

export const userRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  business: one(businesses, {
    fields: [customers.businessId],
    references: [businesses.id],
  }),
  orders: many(orders),
  payments: many(payments),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  business: one(businesses, {
    fields: [orders.businessId],
    references: [businesses.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  service: one(services, {
    fields: [orderItems.serviceId],
    references: [services.id],
  }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  business: one(businesses, {
    fields: [payments.businessId],
    references: [businesses.id],
  }),
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  business: one(businesses, {
    fields: [auditLogs.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
