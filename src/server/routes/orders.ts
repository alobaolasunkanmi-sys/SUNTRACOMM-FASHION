import { Router } from 'express';
import { db } from '../../db';
import { orders, customers } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middlewares/auth';

export const orderRouter = Router();
orderRouter.use(requireAuth);

orderRouter.get('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  try {
    const list = await db.query.orders.findMany({
      where: eq(orders.businessId, req.user.businessId),
      orderBy: [desc(orders.createdAt)],
      with: {
        customer: true
      }
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

orderRouter.post('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { customerId, category, totalAmount, notes, expectedDeliveryDate } = req.body;
  try {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const [order] = await db.insert(orders).values({
      orderNumber,
      businessId: req.user.businessId,
      customerId,
      category,
      totalAmount: totalAmount.toString(),
      balance: totalAmount.toString(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      notes
    }).returning();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
