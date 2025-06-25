// payment_integration_example.ts
// Example of how to integrate the payment API routes into your main Express application

import express from 'express';
import paymentRoutes from '../payment_routes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount payment routes
app.use('/api/payments', paymentRoutes);

// Example usage in your main server file (index.ts):
/*
import express from 'express';
import paymentRoutes from './payment_routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/payments', paymentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Payment API available at http://localhost:${PORT}/api/payments`);
});
*/

// Example test requests you can make:

// 1. Health check
// GET http://localhost:3000/api/payments/health

// 2. Create a settlement
// POST http://localhost:3000/api/payments/settlements
// {
//   "seller_id": 1,
//   "store_id": 1,
//   "settlement_period_start": "2024-01-01T00:00:00Z",
//   "settlement_period_end": "2024-01-31T23:59:59Z",
//   "total_sales_amount": 10000,
//   "platform_commission": 500,
//   "tax_deduction": 200,
//   "payment_method": "BANK_TRANSFER"
// }

// 3. Get settlements with filtering
// GET http://localhost:3000/api/payments/settlements?seller_id=1&status=PENDING&page=1&limit=10

// 4. Create a payment
// POST http://localhost:3000/api/payments/payments
// {
//   "seller_id": 1,
//   "store_id": 1,
//   "amount": 5000,
//   "payment_method": "UPI",
//   "due_date": "2024-02-01T00:00:00Z",
//   "description": "Regular payment"
// }

// 5. Get seller balance
// GET http://localhost:3000/api/payments/sellers/1/stores/1/balance

// 6. Process withdrawal
// POST http://localhost:3000/api/payments/sellers/1/stores/1/withdraw
// {
//   "amount": 1000,
//   "payment_method": "BANK_TRANSFER",
//   "description": "Monthly withdrawal"
// }

// 7. Get payment analytics
// GET http://localhost:3000/api/payments/sellers/1/analytics?period=30d

export default app;
