import type { VercelResponse,VercelRequest } from '@vercel/node';
import express from 'express';

// Import your route modules

import seller from './models/roles/seller';
import store from './models/store';
import product from './models/products';
import order from './models/orders';
import cartItemsRouter from './models/cart_items';
import sellerDashboard from './models/seller_dashboard';
import sellerDashboardExtended from './models/seller_dashboard_extended';
import paymentRoutes from './models/payment_routes';
import cartRoutes from './models/cart';
import admin from './models/roles/admin';
import user from './models/roles/user';
import notification from './models/notification_routes';
import settingsManagementRoutes from './models/settings_management_routes';


const app = express();

// Middleware
app.use(express.json());

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, auth');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Veleco Backend API is running on Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use("/api/user", user);
app.use("/api/admin", admin);
app.use("/api/seller", seller);
app.use("/store", store);
app.use("/product", product);
app.use("/cart", cartRoutes);
app.use("/order", order);
app.use('/cart-items', cartItemsRouter);
app.use("/dashboard", sellerDashboard);
app.use("/data", sellerDashboardExtended);
app.use('/api/payments', paymentRoutes);
app.use("/api/notifications", notification);
app.use("/api/settings", settingsManagementRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export the Express app as a Vercel serverless function
export default app;