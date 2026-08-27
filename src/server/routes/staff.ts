import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middlewares/auth';

export const staffRouter = Router();

staffRouter.use(requireAuth);

// Ensure only Business Admin or Super Admin can access staff management
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only admins can manage staff' });
  }
  next();
};

staffRouter.use(requireAdmin);

// List staff
staffRouter.get('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  try {
    const list = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      username: users.username,
      staffId: users.staffId,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.businessId, req.user.businessId), eq(users.role, 'staff')))
    .orderBy(desc(users.createdAt));
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create staff
staffRouter.post('/', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { name, email, phone, username, staffId, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    const [staff] = await db.insert(users).values({
      businessId: req.user.businessId,
      name,
      email,
      phone,
      username,
      staffId,
      passwordHash,
      role: 'staff',
      status: 'active'
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Email might be in use.' });
  }
});

// Update staff status/details
staffRouter.put('/:id', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { id } = req.params;
  const { name, phone, status } = req.body;
  try {
    const [staff] = await db.update(users).set({
      name, phone, status, updatedAt: new Date()
    }).where(and(eq(users.id, id), eq(users.businessId, req.user.businessId), eq(users.role, 'staff'))).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status
    });
    
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password for staff
staffRouter.put('/:id/reset-password', async (req: AuthRequest, res) => {
  if (!req.user?.businessId) return res.status(403).json({ error: 'No business context' });
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [staff] = await db.update(users).set({ passwordHash })
      .where(and(eq(users.id, id), eq(users.businessId, req.user.businessId), eq(users.role, 'staff')))
      .returning({ id: users.id });
      
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
