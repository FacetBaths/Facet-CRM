import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import { authMiddleware } from './middleware/auth';

// Import all models to ensure they're registered (prevents ref errors)
import './models/User';
import './models/Customer';
import './models/Market';
import './models/Team';
import './models/Project';
import './models/Product';
import './models/Vendor';
import './models/Subscription';
import './models/CompanySettings';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import customerRoutes from './routes/customers';
import projectRoutes from './routes/projects';
import productRoutes from './routes/products';
import vendorRoutes from './routes/vendors';
import subscriptionRoutes from './routes/subscriptions';
import commissionRoutes from './routes/commissions';
import companyRoutes from './routes/company';
import notificationRoutes from './routes/notifications';
import auditsRoutes from './routes/audits';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.use((req, _res, next) => {
  (req as any).io = io;
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/vendors', authMiddleware, vendorRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);
app.use('/api/commissions', authMiddleware, commissionRoutes);
app.use('/api/company', authMiddleware, companyRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/audits', authMiddleware, auditsRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    console.log(`Socket ${socket.id} joined project:${projectId}`);
  });
  
  socket.on('leave-project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
    console.log(`Socket ${socket.id} left project:${projectId}`);
  });
  
  // Join user's personal notification room
  socket.on('join-user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user:${userId}`);
  });
  
  socket.on('leave-user', (userId: string) => {
    socket.leave(`user:${userId}`);
    console.log(`Socket ${socket.id} left user:${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();

export { io };
