import { Router } from 'express';
import { authRouter } from './auth';
import { businessRouter } from './businesses';
import { customerRouter } from './customers';
import { orderRouter } from './orders';
import { paymentRouter } from './payments';
import { staffRouter } from './staff';
import { communicationsRouter } from './communications';
import { supabaseRouter } from './supabase';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/businesses', businessRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/staff', staffRouter);
apiRouter.use('/communications', communicationsRouter);
apiRouter.use('/supabase', supabaseRouter);
