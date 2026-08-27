import { Router } from 'express';
import { db } from '../../db';
import { customers, orders, communications, businesses } from '../../db/schema';
import { eq, and, desc, gte, lte, or, inArray } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middlewares/auth';

export const communicationsRouter = Router();

communicationsRouter.use(requireAuth);

// Get target customers for broadcast category
communicationsRouter.get('/broadcast-targets', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const category = (req.query.category as string) || 'all';

  try {
    const allCustomers = await db.select().from(customers)
      .where(eq(customers.businessId, req.user.businessId))
      .orderBy(desc(customers.createdAt));

    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = allCustomers;

    if (category === 'active') {
      filtered = allCustomers.filter(c => {
        const lastActive = c.lastOrderDate ? new Date(c.lastOrderDate) : new Date(c.createdAt);
        return lastActive >= sixtyDaysAgo && c.status !== 'inactive';
      });
    } else if (category === 'inactive') {
      filtered = allCustomers.filter(c => {
        const lastActive = c.lastOrderDate ? new Date(c.lastOrderDate) : new Date(c.createdAt);
        return lastActive < sixtyDaysAgo || c.status === 'inactive' || c.status === 'at_risk';
      });
    } else if (category === 'pending_payment') {
      filtered = allCustomers.filter(c => Number(c.outstandingBalance || 0) > 0);
    } else if (category === 'new_customers') {
      filtered = allCustomers.filter(c => new Date(c.createdAt) >= startOfMonth || c.status === 'new');
    } else if (category === 'ready_orders') {
      const readyOrders = await db.select().from(orders)
        .where(and(eq(orders.businessId, req.user.businessId), eq(orders.status, 'ready')));
      const customerIdsWithReadyOrders = new Set(readyOrders.map(o => o.customerId));
      filtered = allCustomers.filter(c => customerIdsWithReadyOrders.has(c.id));
    }

    const mapped = filtered.map(c => ({
      id: c.id,
      fullName: c.fullName,
      phone: c.phone || '',
      whatsappNumber: c.whatsappNumber || c.phone || '',
      email: c.email,
      outstandingBalance: c.outstandingBalance || '0',
      lastOrderDate: c.lastOrderDate,
      status: c.status
    }));

    res.json({
      category,
      totalCount: mapped.length,
      customers: mapped
    });
  } catch (error) {
    console.error('Error fetching broadcast targets:', error);
    res.status(500).json({ error: 'Server error fetching targets' });
  }
});

// Broadcast / Send batch WhatsApp messages
communicationsRouter.post('/broadcast', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { category, templateMessage, targetCustomerIds } = req.body;

  if (!templateMessage || !Array.isArray(targetCustomerIds) || targetCustomerIds.length === 0) {
    return res.status(400).json({ error: 'Template message and target customers are required' });
  }

  try {
    const [biz] = await db.select().from(businesses).where(eq(businesses.id, req.user.businessId));
    if (!biz) return res.status(404).json({ error: 'Business not found' });

    const selectedCustomers = await db.select().from(customers)
      .where(and(eq(customers.businessId, req.user.businessId), inArray(customers.id, targetCustomerIds)));

    const dispatchedMessages = [];

    for (const customer of selectedCustomers) {
      const currency = biz.currency || 'NGN';
      const balanceVal = Number(customer.outstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
      
      // Personalize message text
      let personalizedContent = templateMessage
        .replace(/\{\{customer_name\}\}/g, customer.fullName)
        .replace(/\{\{business_name\}\}/g, biz.name)
        .replace(/\{\{outstanding_balance\}\}/g, `${currency} ${balanceVal}`)
        .replace(/\{\{phone\}\}/g, customer.phone || '');

      // Log in communications table
      const [comm] = await db.insert(communications).values({
        businessId: req.user.businessId,
        customerId: customer.id,
        type: 'whatsapp',
        content: personalizedContent,
        status: 'sent',
      }).returning();

      // Format WhatsApp URL
      const rawPhone = customer.whatsappNumber || customer.phone || '';
      // clean phone number (remove non-digits except leading + if any)
      let cleanPhone = rawPhone.replace(/[^\d+]/g, '');
      if (cleanPhone.startsWith('0')) {
        // Default to Nigeria +234 if starts with local 0, or user provided phone
        cleanPhone = '234' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.substring(1);
      }

      const waUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedContent)}`
        : null;

      dispatchedMessages.push({
        id: comm.id,
        customerId: customer.id,
        customerName: customer.fullName,
        phone: rawPhone,
        cleanPhone,
        content: personalizedContent,
        waUrl,
        sentAt: comm.createdAt
      });
    }

    res.json({
      success: true,
      category,
      count: dispatchedMessages.length,
      dispatchedMessages
    });
  } catch (error) {
    console.error('Error broadcasting messages:', error);
    res.status(500).json({ error: 'Failed to broadcast messages' });
  }
});

// Get communication logs history
communicationsRouter.get('/history', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });

  try {
    const logs = await db.select({
      id: communications.id,
      type: communications.type,
      content: communications.content,
      status: communications.status,
      createdAt: communications.createdAt,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      customerWhatsapp: customers.whatsappNumber
    })
    .from(communications)
    .leftJoin(customers, eq(communications.customerId, customers.id))
    .where(eq(communications.businessId, req.user.businessId))
    .orderBy(desc(communications.createdAt))
    .limit(50);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching communications history:', error);
    res.status(500).json({ error: 'Server error fetching history' });
  }
});
