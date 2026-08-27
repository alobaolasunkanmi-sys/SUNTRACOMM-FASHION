import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../db';
import { businesses, users, payments, orders } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middlewares/auth';

export const businessRouter = Router();

businessRouter.use(requireAuth);

// Get all businesses (Super Admin only)
businessRouter.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const list = await db.select().from(businesses).orderBy(desc(businesses.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get SuperAdmin platform stats
businessRouter.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const allBusinesses = await db.select().from(businesses);
    const allUsers = await db.select().from(users);
    
    // Total revenue across all businesses
    const allPayments = await db.select().from(payments);
    const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const allOrders = await db.select().from(orders);

    res.json({
      totalBusinesses: allBusinesses.length,
      activeBusinesses: allBusinesses.filter(b => b.status === 'active').length,
      totalUsers: allUsers.length,
      totalOrders: allOrders.length,
      totalRevenue
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
});

// Create a new business (Super Admin only)
businessRouter.post('/', requireSuperAdmin, async (req, res) => {
  const { 
    name, type, registrationNumber, ownerName, phone, email, address, description,
    adminName, adminEmail, adminPhone, adminPassword
  } = req.body;

  try {
    // 1. Create Business
    const [business] = await db.insert(businesses).values({
      name, type, registrationNumber, ownerName, phone, email, address, description
    }).returning();

    // 2. Create Admin User
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const [adminUser] = await db.insert(users).values({
      businessId: business.id,
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      role: 'admin',
    }).returning();

    res.json({ business, adminUser: { id: adminUser.id, email: adminUser.email } });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

// Get current business (Business users)
businessRouter.get('/current', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) {
    return res.status(400).json({ error: 'Not associated with a business' });
  }
  try {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, req.user.businessId));
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update current business profile / settings (Business Admin only)
businessRouter.put('/current', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) {
    return res.status(400).json({ error: 'Not associated with a business' });
  }
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only business admins can update business profile' });
  }

  const {
    name, type, registrationNumber, ownerName, phone, whatsappNumber,
    email, address, logoUrl, description, currency, whatsappSettings
  } = req.body;

  try {
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (phone !== undefined) updateData.phone = phone;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (description !== undefined) updateData.description = description;
    if (currency !== undefined) updateData.currency = currency;
    if (whatsappSettings !== undefined) updateData.whatsappSettings = whatsappSettings;

    const [updated] = await db.update(businesses)
      .set(updateData)
      .where(eq(businesses.id, req.user.businessId))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Business not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ error: 'Failed to update business profile' });
  }
});

// Update business status (Super Admin)
businessRouter.patch('/:id/status', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [business] = await db.update(businesses).set({ status }).where(eq(businesses.id, id)).returning();
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update business status' });
  }
});
