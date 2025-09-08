import type { VercelResponse, VercelRequest } from '@vercel/node';
import express from 'express';
import user from '../models/roles/user';
import admin from '../models/roles/admin';
import seller from '../models/roles/seller';
import store from '../models/store';
import product from '../models/products';
import order from '../models/orders';
import cartItemsRouter from '../models/cart_items';
import sellerDashboard from '../models/seller_dashboard';
import sellerDashboardExtended from '../models/seller_dashboard_extended';
import paymentRoutes from '../models/payment_routes';
import notification from '../models/notification_routes';
import settingsManagementRoutes from '../models/settings_management_routes';
import cartRoutes from '../models/cart';
import supportRoutes from '../support_ticket_routes';
import sellerCap from '../models/seller_cap';
import percentageRouter from '../models/percentage';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/user", user);
app.use("/api/admin", admin);
app.use("/store", store);
app.use("/product", product);
app.use("/cart", cartRoutes);
app.use("/order", order);
app.use("/api/seller", seller);
app.use('/cart-items', cartItemsRouter);
app.use("/dashboard", sellerDashboard);
app.use("/data", sellerDashboardExtended);
app.use('/api/payments', paymentRoutes);
app.use("/api/notifications", notification);
app.use("/api/settings", settingsManagementRoutes);
app.use('/api/support', supportRoutes);
app.use("/seller/seller_cap", sellerCap);
app.use("/api/percentage", percentageRouter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Veleco Backend API is running on Vercel!' });
});

// For local development
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');

  });
}

// Export for Vercel
export default app;
