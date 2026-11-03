import { Router } from 'express';
import { db } from '../../db';
import { orders, customers } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middlewares/auth';

export const orderRouter = Router();
orderRouter.use(requireAuth);

// Get all orders for current business
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
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// Get single order by ID
orderRouter.get('/:id', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  try {
    const list = await db.query.orders.findMany({
      where: and(eq(orders.id, req.params.id), eq(orders.businessId, req.user.businessId)),
      with: {
        customer: true,
        items: true,
        payments: true
      }
    });
    if (!list || list.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(list[0]);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Server error fetching order' });
  }
});

// Create new order
orderRouter.post('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { customerId, category, totalAmount, notes, expectedDeliveryDate } = req.body;
  
  if (!customerId || totalAmount === undefined) {
    return res.status(400).json({ error: 'Customer and total amount are required' });
  }

  try {
    const numericAmount = Number(totalAmount) || 0;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    
    const [order] = await db.insert(orders).values({
      orderNumber,
      businessId: req.user.businessId,
      customerId,
      category: category || 'tailoring',
      totalAmount: numericAmount.toString(),
      totalPaid: '0',
      balance: numericAmount.toString(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      notes: notes || null
    }).returning();

    // Also update customer's outstanding balance, total spending, and last order date
    try {
      const [currentCustomer] = await db.select().from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.businessId, req.user.businessId)));
      
      if (currentCustomer) {
        const newBalance = (Number(currentCustomer.outstandingBalance || 0) + numericAmount).toString();
        const newSpending = (Number(currentCustomer.totalSpending || 0) + numericAmount).toString();
        await db.update(customers).set({
          outstandingBalance: newBalance,
          totalSpending: newSpending,
          lastOrderDate: new Date(),
          updatedAt: new Date()
        }).where(eq(customers.id, customerId));
      }
    } catch (custErr) {
      console.warn('Customer stats update warning on new order:', custErr);
    }

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error?.message || 'Server error creating order' });
  }
});

// Update order status or details
orderRouter.put('/:id', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { id } = req.params;
  const { status, expectedDeliveryDate, actualDeliveryDate, notes, pickupDate } = req.body;

  try {
    const updateData: any = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    if (actualDeliveryDate !== undefined) updateData.actualDeliveryDate = actualDeliveryDate ? new Date(actualDeliveryDate) : null;
    if (pickupDate !== undefined) updateData.pickupDate = pickupDate ? new Date(pickupDate) : null;
    if (notes !== undefined) updateData.notes = notes;

    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(and(eq(orders.id, id), eq(orders.businessId, req.user.businessId)))
      .returning();

    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
    res.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Server error updating order' });
  }
});

// Delete order
orderRouter.delete('/:id', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  if (req.user.role === 'staff') return res.status(403).json({ error: 'Staff are not permitted to delete orders' });
  const { id } = req.params;

  try {
    const [deleted] = await db.delete(orders)
      .where(and(eq(orders.id, id), eq(orders.businessId, req.user.businessId)))
      .returning();
    if (!deleted) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Server error deleting order' });
  }
});
