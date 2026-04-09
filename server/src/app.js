import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import jarActualBalanceRoutes from './routes/jarActualBalanceRoutes.js';
import debtRoutes from './routes/debtRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import importRoutes from './routes/importRoutes.js';
import jarAllocationRoutes from './routes/jarAllocationRoutes.js';
import jarRoutes from './routes/jarRoutes.js';
import { attachAuth, requireAuth } from './middleware/authMiddleware.js';
import monthlyIncomeRoutes from './routes/monthlyIncomeRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://finance-ai-manager.vercel.app'
];
const allowedOrigins = (process.env.CLIENT_ORIGIN || defaultAllowedOrigins.join(','))
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(attachAuth);

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

app.use(requireAuth);
app.use('/api/assistant', assistantRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jars', jarRoutes);
app.use('/api/jar-actual-balances', jarActualBalanceRoutes);
app.use('/api/import', importRoutes);
app.use('/api/monthly-incomes', monthlyIncomeRoutes);
app.use('/api/jar-allocations', jarAllocationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found.'
  });
});

app.use((error, req, res, next) => {
  const statusCode =
    error.statusCode ||
    (/(đăng nhập|authentication|unauthorized)/i.test(error.message || '') ? 401 :
    (error.name === 'MulterError' ||
    /required|supported|invalid|exists|not found|must use|already/i.test(error.message || '')
      ? 400
      : 500));

  res.status(statusCode).json({
    message: error.message || 'Internal server error.'
  });
});

export default app;
