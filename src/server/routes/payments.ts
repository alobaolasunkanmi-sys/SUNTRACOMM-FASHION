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
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Server error fetching payments' });
  }
});

paymentRouter.post('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { orderId, amount, method, reference } = req.body;
  
  if (!orderId || !amount) {
    return res.status(400).json({ error: 'Order ID and payment amount are required' });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero' });
  }

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
      amount: numericAmount.toString(),
      method: method || 'transfer',
      reference: reference || null,
      recordedById: req.user.userId
    }).returning();
    
    // Update order balance
    const currentPaid = Number(order.totalPaid || 0);
    const totalOrderAmount = Number(order.totalAmount || 0);
    const newPaid = currentPaid + numericAmount;
    const newBalance = Math.max(0, totalOrderAmount - newPaid);
    
    await db.update(orders).set({
      totalPaid: newPaid.toString(),
      balance: newBalance.toString(),
      updatedAt: new Date()
    }).where(eq(orders.id, orderId));

    // Update customer outstanding balance and last payment date
    try {
      const [customer] = await db.select().from(customers)
        .where(eq(customers.id, order.customerId));
      if (customer) {
        const curCustomerBalance = Number(customer.outstandingBalance || 0);
        const updatedCustomerBalance = Math.max(0, curCustomerBalance - numericAmount);
        await db.update(customers).set({
          outstandingBalance: updatedCustomerBalance.toString(),
          lastPaymentDate: new Date(),
          updatedAt: new Date()
        }).where(eq(customers.id, order.customerId));
      }
    } catch (custErr) {
      console.warn('Customer balance sync warning on payment:', custErr);
    }
    
    res.status(201).json(payment);
  } catch (error: any) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error?.message || 'Server error recording payment' });
  }
});
