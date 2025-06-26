import { PrismaClient, NotificationCategory, NotificationPriority, NotificationStatus } from '../db/generated/prisma';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

// Error handling utility
const handleError = (error: unknown, res: Response) => {
  console.error('Notification API Error:', error);
  
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Unique constraint violation' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
  }
  
  return res.status(500).json({ error: 'Internal server error' });
};

// ============ NOTIFICATION ENDPOINTS ============

// Create a new notification
export const createNotification = async (req: Request, res: Response) => {
  try {
    const {
      seller_id,
      store_id,
      category,
      type,
      title,
      message,
      priority = NotificationPriority.MEDIUM,
      related_order_id,
      related_product_id,
      related_payment_id,
      related_settlement_id,
      action_url,
      action_data,
      metadata,
      expires_at
    } = req.body;

    const notification = await prisma.seller_notification.create({
      data: {
        seller_id,
        store_id,
        category,
        type,
        title,
        message,
        priority,
        related_order_id,
        related_product_id,
        related_payment_id,
        related_settlement_id,
        action_url,
        action_data,
        metadata,
        expires_at: expires_at ? new Date(expires_at) : null,
        status: NotificationStatus.UNREAD
      },
      include: {
        seller: true,
        store: true,
        related_order: true,
        related_product: true,
        related_payment: true,
        related_settlement: true
      }
    });

    return res.status(201).json(notification);
  } catch (error) {
    return handleError(error, res);
  }
};

// Get notifications for a seller with filtering and pagination
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      seller_id,
      store_id,
      category,
      status,
      priority,
      unread_only,
      start_date,
      end_date    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit (must be 1-100)' });
    }

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const where: any = {};
    if (seller_id) {
      const sellerIdNum = parseInt(seller_id as string);
      if (isNaN(sellerIdNum)) {
        return res.status(400).json({ error: 'Invalid seller ID format' });
      }
      where.seller_id = sellerIdNum;
    }
    if (store_id) {
      const storeIdNum = parseInt(store_id as string);
      if (isNaN(storeIdNum)) {
        return res.status(400).json({ error: 'Invalid store ID format' });
      }
      where.store_id = storeIdNum;
    }
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (unread_only === 'true') where.status = NotificationStatus.UNREAD;
    
    if (start_date && end_date) {
      where.created_at = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    // Filter out expired notifications
    where.OR = [
      { expires_at: null },
      { expires_at: { gt: new Date() } }
    ];

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.seller_notification.findMany({
        where,
        skip,
        take,
        include: {
          seller: true,
          store: true,
          related_order: true,
          related_product: true,
          related_payment: true,
          related_settlement: true
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ]
      }),
      prisma.seller_notification.count({ where }),
      prisma.seller_notification.count({
        where: {
          ...where,
          status: NotificationStatus.UNREAD
        }
      })
    ]);    return res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      unread_count: unreadCount
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Get notification by ID
export const getNotificationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID format' });
    }

    const notification = await prisma.seller_notification.findUnique({
      where: { id: notificationId },
      include: {
        seller: true,
        store: true,
        related_order: {
          include: {
            order_items: {
              include: {
                product: true
              }
            }
          }
        },
        related_product: true,
        related_payment: true,
        related_settlement: true,
        deliveries: true
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error) {
    return handleError(error, res);
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID format' });
    }

    const notification = await prisma.seller_notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        read_at: new Date()
      },
      include: {
        seller: true,
        store: true
      }
    });

    return res.json(notification);
  } catch (error) {
    return handleError(error, res);
  }
};

// Mark multiple notifications as read
export const markMultipleAsRead = async (req: Request, res: Response) => {
  try {
    const { notification_ids } = req.body;

    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return res.status(400).json({ error: 'notification_ids must be a non-empty array' });
    }

    // Validate and parse all IDs
    const validIds = notification_ids.map(id => {
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        throw new Error(`Invalid notification ID format: ${id}`);
      }
      return parsedId;
    });

    const result = await prisma.seller_notification.updateMany({
      where: {
        id: { in: validIds }
      },
      data: {
        status: NotificationStatus.READ,
        read_at: new Date()
      }
    });

    return res.json({ updated_count: result.count });
  } catch (error) {
    return handleError(error, res);
  }
};

// Mark all notifications as read for a seller
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { store_id } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const where: any = {
      seller_id: sellerIdNum,
      status: NotificationStatus.UNREAD
    };

    if (store_id) {
      const storeIdNum = parseInt(store_id as string);
      if (isNaN(storeIdNum)) {
        return res.status(400).json({ error: 'Invalid store ID format' });
      }
      where.store_id = storeIdNum;
    }

    const result = await prisma.seller_notification.updateMany({
      where,
      data: {
        status: NotificationStatus.READ,
        read_at: new Date()
      }
    });

    return res.json({ updated_count: result.count });
  } catch (error) {
    return handleError(error, res);
  }
};

// Dismiss notification
export const dismissNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID format' });
    }

    const notification = await prisma.seller_notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.DISMISSED,
        dismissed_at: new Date()
      }
    });

    return res.json(notification);
  } catch (error) {
    return handleError(error, res);
  }
};

// Archive notification
export const archiveNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID format' });
    }

    const notification = await prisma.seller_notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.ARCHIVED
      }
    });

    return res.json(notification);
  } catch (error) {
    return handleError(error, res);
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID format' });
    }

    await prisma.seller_notification.delete({
      where: { id: notificationId }
    });

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

// Get notification summary/stats
export const getNotificationSummary = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { store_id } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const where: any = {
      seller_id: sellerIdNum,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } }
      ]
    };

    if (store_id) {
      const storeIdNum = parseInt(store_id as string);
      if (isNaN(storeIdNum)) {
        return res.status(400).json({ error: 'Invalid store ID format' });
      }
      where.store_id = storeIdNum;
    }

    const [
      totalCount,
      unreadCount,
      urgentCount,
      categoryBreakdown
    ] = await Promise.all([
      prisma.seller_notification.count({ where }),
      prisma.seller_notification.count({
        where: { ...where, status: NotificationStatus.UNREAD }
      }),
      prisma.seller_notification.count({
        where: { ...where, priority: NotificationPriority.URGENT, status: NotificationStatus.UNREAD }
      }),
      prisma.seller_notification.groupBy({
        by: ['category'],
        where: { ...where, status: NotificationStatus.UNREAD },
        _count: { id: true }
      })
    ]);

    return res.json({
      total_count: totalCount,
      unread_count: unreadCount,
      urgent_count: urgentCount,
      category_breakdown: categoryBreakdown.map(item => ({
        category: item.category,
        count: item._count.id
      }))
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// ============ NOTIFICATION PREFERENCES ENDPOINTS ============

// Get notification preferences
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { store_id } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const where: any = { seller_id: sellerIdNum };
    if (store_id) {
      const storeIdNum = parseInt(store_id as string);
      if (isNaN(storeIdNum)) {
        return res.status(400).json({ error: 'Invalid store ID format' });
      }
      where.store_id = storeIdNum;
    }

    const preferences = await prisma.seller_notification_preferences.findFirst({
      where,
      include: {
        seller: true,
        store: true
      }
    });    if (!preferences) {
      // Create default preferences if none exist
      const defaultPreferences = await prisma.seller_notification_preferences.create({
        data: {
          seller_id: sellerIdNum,
          store_id: store_id ? parseInt(store_id as string) : null
        },
        include: {
          seller: true,
          store: true
        }
      });
      return res.json(defaultPreferences);
    }

    return res.json(preferences);
  } catch (error) {
    return handleError(error, res);
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const updateData = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const sellerIdNum = parseInt(sellerId);
    if (isNaN(sellerIdNum)) {
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    const preferences = await prisma.seller_notification_preferences.upsert({
      where: { seller_id: sellerIdNum },
      update: updateData,
      create: {
        seller_id: sellerIdNum,
        ...updateData
      },
      include: {
        seller: true,
        store: true
      }
    });

    return res.json(preferences);
  } catch (error) {
    return handleError(error, res);
  }
};

// ============ HELPER FUNCTIONS FOR CREATING NOTIFICATIONS ============

// Helper function to create order notification
export const createOrderNotification = async (
  seller_id: number,
  store_id: number,
  order_id: number,
  type: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.HIGH
) => {
  try {
    return await prisma.seller_notification.create({
      data: {
        seller_id,
        store_id,
        category: NotificationCategory.ORDER,
        type,
        title,
        message,
        priority,
        related_order_id: order_id,
        action_url: `/dashboard/orders/${order_id}`,
        status: NotificationStatus.UNREAD
      }
    });
  } catch (error) {
    console.error('Error creating order notification:', error);
    throw error;
  }
};

// Helper function to create inventory notification
export const createInventoryNotification = async (
  seller_id: number,
  store_id: number,
  product_id: number,
  type: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.MEDIUM
) => {
  try {
    return await prisma.seller_notification.create({
      data: {
        seller_id,
        store_id,
        category: NotificationCategory.INVENTORY,
        type,
        title,
        message,
        priority,
        related_product_id: product_id,
        action_url: `/dashboard/products/${product_id}`,
        status: NotificationStatus.UNREAD
      }
    });
  } catch (error) {
    console.error('Error creating inventory notification:', error);
    throw error;
  }
};

// Helper function to create payment notification
export const createPaymentNotification = async (
  seller_id: number,
  store_id: number,
  payment_id: number,
  type: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.HIGH
) => {
    if(!seller_id || !store_id || !payment_id || !type || !title || !message) {
        return('Missing required parameters for creating payment notification');
    }
  try {
    return await prisma.seller_notification.create({
      data: {
        seller_id,
        store_id,
        category: NotificationCategory.PAYMENT,
        type,
        title,
        message,
        priority,
        related_payment_id: payment_id,
        action_url: `/dashboard/payments/${payment_id}`,
        status: NotificationStatus.UNREAD
      }
    });
  } catch (error) {
    console.error('Error creating payment notification:', error);
    throw error;
  }
};

// Helper function to create promotion notification
export const createPromotionNotification = async (
  seller_id: number,
  store_id: number,
  type: string,
  title: string,
  message: string,
  priority: NotificationPriority = NotificationPriority.MEDIUM,
  action_url?: string
) => {
  try {
    return await prisma.seller_notification.create({
      data: {
        seller_id,
        store_id,
        category: NotificationCategory.PROMOTION,
        type,
        title,
        message,
        priority,
        action_url: action_url || '/dashboard/promotions',
        status: NotificationStatus.UNREAD
      }
    });
  } catch (error) {
    console.error('Error creating promotion notification:', error);
    throw error;
  }
};

// Clean up expired notifications
export const cleanupExpiredNotifications = async () => {
  try {
    const result = await prisma.seller_notification.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    });
    
    console.log(`Cleaned up ${result.count} expired notifications`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    throw error;
  }
};
