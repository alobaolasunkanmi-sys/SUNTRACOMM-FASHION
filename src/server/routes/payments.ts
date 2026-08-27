import { Router } from 'express';
import { db } from '../../db';
import { payments, orders, customers } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middlewares/auth';

export const paymentRouter = Router();
paymentRouter.use(requireAuth);

paymentRouter.get('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  try {
    const list = await db.query.payments.findMany({
      where: eq(payments.businessId, req.user.businessId),
      orderBy: [desc(payments.createdAt)],
      with: {
        customer: true,
        order: true
      }
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

paymentRouter.post('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { orderId, amount, method, reference } = req.body;
  
  try {
    // Check order exists
    const [order] = await db.select().from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.businessId, req.user.businessId)));
      
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Create payment
    const [payment] = await db.insert(payments).values({
      businessId: req.user.businessId,
      orderId,
      customerId: order.customerId,
      amount: amount.toString(),
      method,
      reference,
      recordedById: req.user.userId
    }).returning();
    
    // Update order balance
    const newPaid = Number(order.totalPaid) + Number(amount);
    const newBalance = Number(order.totalAmount) - newPaid;
    
    await db.update(orders).set({
      totalPaid: newPaid.toString(),
      balance: newBalance.toString()
    }).where(eq(orders.id, orderId));
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
