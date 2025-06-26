import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  // Core notification endpoints
  createNotification,
  getNotifications,
  getNotificationById,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  dismissNotification,
  archiveNotification,
  deleteNotification,
  getNotificationSummary,
  
  // Notification preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  
  // Helper functions
  createOrderNotification,
  createInventoryNotification,
  createPaymentNotification,
  createPromotionNotification,
  cleanupExpiredNotifications
} from './notification_api';

const router = Router();

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res)).catch(next);
};

// ============ CORE NOTIFICATION ROUTES ============

/**
 * @route POST /api/notifications
 * @desc Create a new notification
 */
router.post('/', asyncHandler(createNotification));

/**
 * @route GET /api/notifications
 * @desc Get notifications with filtering and pagination
 * @query seller_id, store_id, category, status, priority, unread_only, start_date, end_date, page, limit
 */
router.get('/', asyncHandler(getNotifications));

/**
 * @route GET /api/notifications/:id
 * @desc Get notification by ID
 */
router.get('/:id', asyncHandler(getNotificationById));

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 */
router.put('/:id/read', asyncHandler(markAsRead));

/**
 * @route PUT /api/notifications/bulk-read
 * @desc Mark multiple notifications as read
 */
router.put('/bulk-read', asyncHandler(markMultipleAsRead));

/**
 * @route PUT /api/notifications/:id/dismiss
 * @desc Dismiss notification
 */
router.put('/:id/dismiss', asyncHandler(dismissNotification));

/**
 * @route PUT /api/notifications/:id/archive
 * @desc Archive notification
 */
router.put('/:id/archive', asyncHandler(archiveNotification));

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 */
router.delete('/:id', asyncHandler(deleteNotification));

// ============ SELLER-SPECIFIC NOTIFICATION ROUTES ============

/**
 * @route GET /api/notifications/sellers/:sellerId/summary
 * @desc Get notification summary for a seller
 * @query store_id (optional)
 */
router.get('/sellers/:sellerId/summary', asyncHandler(getNotificationSummary));

/**
 * @route PUT /api/notifications/sellers/:sellerId/mark-all-read
 * @desc Mark all notifications as read for a seller
 * @query store_id (optional)
 */
router.put('/sellers/:sellerId/mark-all-read', asyncHandler(markAllAsRead));

/**
 * @route GET /api/notifications/sellers/:sellerId/preferences
 * @desc Get notification preferences for a seller
 * @query store_id (optional)
 */
router.get('/sellers/:sellerId/preferences', asyncHandler(getNotificationPreferences));

/**
 * @route PUT /api/notifications/sellers/:sellerId/preferences
 * @desc Update notification preferences for a seller
 */
router.put('/sellers/:sellerId/preferences', asyncHandler(updateNotificationPreferences));

// ============ SPECIALIZED NOTIFICATION CREATION ROUTES ============

/**
 * @route POST /api/notifications/order
 * @desc Create order-related notification
 */
router.post('/order', asyncHandler(async (req, res) => {
  const { seller_id, store_id, order_id, type, title, message, priority } = req.body;
  
  const notification = await createOrderNotification(
    seller_id, store_id, order_id, type, title, message, priority
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/inventory
 * @desc Create inventory-related notification
 */
router.post('/inventory', asyncHandler(async (req, res) => {
  const { seller_id, store_id, product_id, type, title, message, priority } = req.body;
  
  const notification = await createInventoryNotification(
    seller_id, store_id, product_id, type, title, message, priority
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/payment
 * @desc Create payment-related notification
 */
router.post('/payment', asyncHandler(async (req, res) => {
  const { seller_id, store_id, payment_id, type, title, message, priority } = req.body;
  
  const notification = await createPaymentNotification(
    seller_id, store_id, payment_id, type, title, message, priority
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/promotion
 * @desc Create promotion-related notification
 */
router.post('/promotion', asyncHandler(async (req, res) => {
  const { seller_id, store_id, type, title, message, priority, action_url } = req.body;
  
  const notification = await createPromotionNotification(
    seller_id, store_id, type, title, message, priority, action_url
  );
  
  return res.status(201).json(notification);
}));

// ============ MAINTENANCE ROUTES ============

/**
 * @route POST /api/notifications/cleanup
 * @desc Clean up expired notifications
 */
router.post('/cleanup', asyncHandler(async (req, res) => {
  const count = await cleanupExpiredNotifications();
  return res.json({ cleaned_up_count: count });
}));

// ============ WEBHOOK/TRIGGER ROUTES ============

/**
 * @route POST /api/notifications/triggers/new-order
 * @desc Trigger notification for new order
 */
router.post('/triggers/new-order', asyncHandler(async (req, res) => {
  const { order_id, seller_id, store_id, order_amount, customer_name } = req.body;
  
  const notification = await createOrderNotification(
    seller_id,
    store_id,
    order_id,
    'NEW_ORDER',
    'New Order Received!',
    `You have received a new order from ${customer_name} worth ₹${order_amount}`,
    'HIGH'
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/triggers/low-stock
 * @desc Trigger notification for low stock
 */
router.post('/triggers/low-stock', asyncHandler(async (req, res) => {
  const { product_id, seller_id, store_id, product_name, current_stock, threshold } = req.body;
  
  const notification = await createInventoryNotification(
    seller_id,
    store_id,
    product_id,
    'LOW_STOCK',
    'Low Stock Alert!',
    `${product_name} is running low. Current stock: ${current_stock} (Threshold: ${threshold})`,
    'MEDIUM'
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/triggers/out-of-stock
 * @desc Trigger notification for out of stock
 */
router.post('/triggers/out-of-stock', asyncHandler(async (req, res) => {
  const { product_id, seller_id, store_id, product_name } = req.body;
  
  const notification = await createInventoryNotification(
    seller_id,
    store_id,
    product_id,
    'OUT_OF_STOCK',
    'Out of Stock Alert!',
    `${product_name} is now out of stock. Please restock immediately.`,
    'HIGH'
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/triggers/payment-completed
 * @desc Trigger notification for payment completion
 */
router.post('/triggers/payment-completed', asyncHandler(async (req, res) => {
  const { payment_id, seller_id, store_id, amount, payment_method } = req.body;
  
  const notification = await createPaymentNotification(
    seller_id,
    store_id,
    payment_id,
    'PAYMENT_COMPLETED',
    'Payment Received!',
    `Payment of ₹${amount} via ${payment_method} has been completed successfully`,
    'HIGH'
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/triggers/payment-failed
 * @desc Trigger notification for payment failure
 */
router.post('/triggers/payment-failed', asyncHandler(async (req, res) => {
  const { payment_id, seller_id, store_id, amount, failure_reason } = req.body;
  
  const notification = await createPaymentNotification(
    seller_id,
    store_id,
    payment_id,
    'PAYMENT_FAILED',
    'Payment Failed!',
    `Payment of ₹${amount} has failed. Reason: ${failure_reason}`,
    'URGENT'
  );
  
  return res.status(201).json(notification);
}));

/**
 * @route POST /api/notifications/triggers/offer-approval
 * @desc Trigger notification for offer approval request
 */
router.post('/triggers/offer-approval', asyncHandler(async (req, res) => {
  const { seller_id, store_id, offer_title, customer_name, proposed_price, original_price } = req.body;
  
  const notification = await createPromotionNotification(
    seller_id,
    store_id,
    'OFFER_APPROVAL',
    'Offer Approval Request',
    `${customer_name} wants to buy "${offer_title}" for ₹${proposed_price} (Original: ₹${original_price})`,
    'MEDIUM',
    '/dashboard/offers'
  );
  
  return res.status(201).json(notification);
}));

// ============ HEALTH CHECK ============

/**
 * @route GET /api/notifications/health
 * @desc Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Notification API',
    version: '1.0.0'
  });
});

// Error handling middleware
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Notification API Error:', error);
  
  if (error.message.includes('ID is required') || error.message.includes('Invalid ID format')) {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint violation' });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  return res.status(500).json({ error: 'Internal server error' });
});
const notification = router;
export default notification;
