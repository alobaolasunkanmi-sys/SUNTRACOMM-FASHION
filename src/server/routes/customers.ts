import { Router } from 'express';
import { db } from '../../db';
import { customers } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middlewares/auth';

export const customerRouter = Router();

customerRouter.use(requireAuth);

// Get customers for current business
customerRouter.get('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  try {
    const list = await db.select().from(customers)
      .where(eq(customers.businessId, req.user.businessId))
      .orderBy(desc(customers.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create customer
customerRouter.post('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { fullName, phone, whatsappNumber, email, address, gender, notes, measurements } = req.body;
  try {
    const [customer] = await db.insert(customers).values({
      businessId: req.user.businessId,
      fullName, phone, whatsappNumber, email, address, gender, notes, measurements
    }).returning();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update customer
customerRouter.put('/:id', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { id } = req.params;
  const { fullName, phone, whatsappNumber, email, address, gender, notes, status, measurements } = req.body;
  
  try {
    const [customer] = await db.update(customers).set({
      fullName, phone, whatsappNumber, email, address, gender, notes, status, measurements, updatedAt: new Date()
    }).where(and(eq(customers.id, id), eq(customers.businessId, req.user.businessId))).returning();
    
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer details
customerRouter.get('/:id', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { id } = req.params;
  try {
    const [customer] = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.businessId, req.user.businessId)));
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete customer
customerRouter.delete('/:id', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  if (req.user?.role === 'staff') return res.status(403).json({ error: 'Staff are not permitted to delete customers' });
  const { id } = req.params;
  try {
    const [deletedCustomer] = await db.delete(customers)
      .where(and(eq(customers.id, id), eq(customers.businessId, req.user.businessId)))
      .returning();
    if (!deletedCustomer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

