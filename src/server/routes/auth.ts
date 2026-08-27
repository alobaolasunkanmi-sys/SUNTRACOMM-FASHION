import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../db';
import { users, businesses } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '../lib/auth';
import { requireAuth, AuthRequest } from '../middlewares/auth';

export const authRouter = Router();

authRouter.put('/change-password', requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing required fields' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  
  try {
    const userList = await db.select().from(users).where(eq(users.id, req.user!.userId));
    if (userList.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userList[0];
    
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Incorrect current password' });
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const userList = await db.select().from(users).where(eq(users.email, email));
    if (userList.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userList[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    let business = null;
    if (user.businessId) {
      const bList = await db.select().from(businesses).where(eq(businesses.id, user.businessId));
      if (bList.length > 0) business = bList[0];
      
      if (business && business.status !== 'active') {
        return res.status(403).json({ error: 'Business account is not active' });
      }
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      businessId: user.businessId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      business
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup Super Admin if none exists (for demo/initial setup)
authRouter.post('/setup', async (req, res) => {
  try {
    const superAdmins = await db.select().from(users).where(eq(users.role, 'superadmin'));
    if (superAdmins.length > 0) {
      return res.status(400).json({ error: 'Setup already complete' });
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const [admin] = await db.insert(users).values({
      name: 'Super Admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'superadmin',
    }).returning();

    res.json({ message: 'Super admin created. email: admin@example.com, password: admin123' });
  } catch (error) {
    console.error('Setup error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
