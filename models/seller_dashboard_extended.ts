import express from 'express';
import { authSellerMiddleware } from './auth/middleware';
import { PrismaClient } from '../db/generated/prisma';

const prisma = new PrismaClient();
const sellerDashboardExtended = express.Router();

// Add JSON parsing middleware
sellerDashboardExtended.use(express.json());

// ========== STORE HOURS ENDPOINTS ==========

// Get store hours
sellerDashboardExtended.get("/store-hours/:store_id", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id } = req.params;
        const storeId = Number(store_id);

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some((s: any) => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const storeHours = await prisma.store_hours.findMany({
            where: { store_id: storeId },
            orderBy: { day: 'asc' }
        });

        // If no hours are set, create default hours (9 AM to 9 PM, closed on Sunday)
        if (storeHours.length === 0) {
            const defaultHours = [];
            const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
            for (let day = 0; day <= 6; day++) {
                defaultHours.push({
                    store_id: storeId,
                    day: dayNames[day],
                    open_time: day !== 0 ? "09:00" : null,
                    close_time: day !== 0 ? "21:00" : null,
                    is_closed: day === 0 // Closed on Sunday (0)
                });
            }

            const createdHours = await prisma.store_hours.createMany({
                data: defaultHours
            });

            const newStoreHours = await prisma.store_hours.findMany({
                where: { store_id: storeId },
                orderBy: { day: 'asc' }
            });

            res.json({
                message: "Default store hours created and fetched successfully",
                storeHours: newStoreHours
            });
            return;
        }

        res.json({
            message: "Store hours fetched successfully",
            storeHours
        });
    } catch (error) {
        console.error('Error fetching store hours:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update store hours
sellerDashboardExtended.put("/store-hours/:store_id", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id } = req.params;
        const storeId = Number(store_id);
        const { hours } = req.body; // Array of hour objects

        if (!Array.isArray(hours)) {
            res.status(400).json({ error: 'Hours must be provided as an array' });
            return;
        }

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some((s: any) => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        // Update each day's hours
        const updatedHours = [];
        for (const hourData of hours) {
            const { day, is_closed, open_time, close_time } = hourData;
            
            const updated = await prisma.store_hours.upsert({
                where: {
                    id: hourData.id || 0 // Use existing ID or 0 for new records
                },
                update: {
                    is_closed: is_closed ?? false,
                    open_time: is_closed ? null : open_time,
                    close_time: is_closed ? null : close_time
                },
                create: {
                    store_id: storeId,
                    day: day,
                    is_closed: is_closed ?? false,
                    open_time: is_closed ? null : open_time,
                    close_time: is_closed ? null : close_time
                }
            });
            updatedHours.push(updated);
        }

        res.json({
            message: "Store hours updated successfully",
            storeHours: updatedHours
        });
    } catch (error) {
        console.error('Error updating store hours:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== INVENTORY ALERTS ENDPOINTS ==========

// Get inventory alerts
sellerDashboardExtended.get("/alerts/:store_id", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id } = req.params;
        const { is_resolved, priority, alert_type } = req.query;
        const storeId = Number(store_id);

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some((s: any) => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const alerts = await prisma.inventory_alert.findMany({
            where: {
                store_id: storeId,
                ...(typeof is_resolved === 'string' && { resolved: is_resolved === 'true' }),
                ...(priority && { priority: priority as any }),
                ...(alert_type && { alert_type: alert_type as any })
            },
            include: {
                product: {
                    select: {
                        id: true,
                        product_name: true,
                        stock: true,
                        price: true
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { created_at: 'desc' }
            ]
        });

        res.json({
            message: "Inventory alerts fetched successfully",
            alerts,
            summary: {
                total: alerts.length,
                unresolved: alerts.filter(a => !a.resolved).length,
                critical: alerts.filter(a => a.priority === 'CRITICAL' && !a.resolved).length,
                high: alerts.filter(a => a.priority === 'HIGH' && !a.resolved).length
            }
        });
    } catch (error) {
        console.error('Error fetching inventory alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create inventory alert
sellerDashboardExtended.post("/alerts", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, product_id, alert_type, threshold_value, message, priority } = req.body;

        if (!store_id || !product_id || !alert_type || !threshold_value) {
            res.status(400).json({ error: 'Store ID, Product ID, alert type, and threshold value are required' });
            return;
        }

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some((s: any) => s.id === store_id);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        // Get current product stock
        const product = await prisma.product.findUnique({
            where: { id: product_id }
        });

        if (!product) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }

        const alert = await prisma.inventory_alert.create({
            data: {
                store_id,
                product_id,
                alert_type: alert_type || 'LOW_STOCK',
                message,
                priority: priority || 'MEDIUM'
            },
            include: {
                product: {
                    select: {
                        id: true,
                        product_name: true,
                        stock: true,
                        price: true
                    }
                }
            }
        });

        res.status(201).json({
            message: "Inventory alert created successfully",
            alert
        });
    } catch (error) {
        console.error('Error creating inventory alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Resolve inventory alert
sellerDashboardExtended.put("/alerts/:alert_id/resolve", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { alert_id } = req.params;
        const alertId = Number(alert_id);

        const alert = await prisma.inventory_alert.findUnique({
            where: { id: alertId },
            include: {
                store: {
                    select: {
                        seller_id: true
                    }
                }
            }
        });

        if (!alert) {
            res.status(404).json({ error: 'Alert not found' });
            return;
        }

        // Check if user owns this store
        if (alert.store.seller_id !== req.userId) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const resolvedAlert = await prisma.inventory_alert.update({
            where: { id: alertId },
            data: {
                resolved: true,
                resolved_at: new Date()
            },
            include: {
                product: {
                    select: {
                        id: true,
                        product_name: true,
                        stock: true
                    }
                }
            }
        });

        res.json({
            message: "Alert resolved successfully",
            alert: resolvedAlert
        });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== STORE REVIEWS ENDPOINTS ==========

// Get store reviews
sellerDashboardExtended.get("/reviews/:store_id", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id } = req.params;
        const { rating, is_verified, limit = '20', offset = '0' } = req.query;
        const storeId = Number(store_id);

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some((s: any) => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const reviews = await prisma.store_review.findMany({
            where: {
                store_id: storeId,
                ...(rating && { rating: parseInt(rating as string) }),
                ...(typeof is_verified === 'string' && { is_verified: is_verified === 'true' })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        total_amount: true,
                        placed_at: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        // Get review statistics
        const reviewStats = await prisma.store_review.groupBy({
            by: ['rating'],
            where: { store_id: storeId },
            _count: {
                rating: true
            }
        });

        const totalReviews = await prisma.store_review.count({
            where: { store_id: storeId }
        });

        const averageRating = await prisma.store_review.aggregate({
            where: { store_id: storeId },
            _avg: {
                rating: true
            }
        });

        res.json({
            message: "Store reviews fetched successfully",
            reviews,
            statistics: {
                total_reviews: totalReviews,
                average_rating: averageRating._avg.rating || 0,
                rating_breakdown: reviewStats.map(stat => ({
                    rating: stat.rating,
                    count: stat._count.rating
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching store reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark review as featured
sellerDashboardExtended.put("/reviews/:review_id/feature", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { review_id } = req.params;
        const { is_featured } = req.body;
        const reviewId = Number(review_id);

        const review = await prisma.store_review.findUnique({
            where: { id: reviewId },
            include: {
                store: {
                    select: {
                        seller_id: true
                    }
                }
            }
        });

        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        if (review.store.seller_id !== req.userId) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        // Since the schema doesn't have is_featured field, we'll just return the review as is
        // In a real implementation, you would add the is_featured field to the schema
        const updatedReview = await prisma.store_review.findUnique({
            where: { id: reviewId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json({
            message: `Review feature status updated successfully (field not implemented in schema)`,
            review: updatedReview
        });
    } catch (error) {
        console.error('Error updating review feature status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== DASHBOARD NOTIFICATIONS ENDPOINTS ==========

// Get notifications
sellerDashboardExtended.get("/notifications", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, is_read, is_urgent, notification_type, limit = '20' } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        let storeFilter = {};
        if (store_id) {
            const storeId = parseInt(store_id as string);
            const ownsStore = seller.store.some((s: any) => s.id === storeId);
            if (!ownsStore) {
                res.status(403).json({ error: 'Access denied: You do not own this store' });
                return;
            }
            storeFilter = { store_id: storeId };
        }

        // Since dashboard_notification doesn't exist in schema, return mock data
        const notifications: any[] = [];
        const unreadCount = 0;

        res.json({
            message: "Notifications fetched successfully (table not implemented in schema)",
            notifications,
            unread_count: unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create notification
sellerDashboardExtended.post("/notifications", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, title, message, notification_type, is_urgent, action_url, action_text, expires_at } = req.body;

        if (!title || !message) {
            res.status(400).json({ error: 'Title and message are required' });
            return;
        }

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id || seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }

        const ownsStore = seller.store.some((s: any) => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        // Since dashboard_notification doesn't exist, return mock response
        const notification = {
            id: Math.floor(Math.random() * 1000),
            seller_id: seller.id,
            store_id: storeId,
            title,
            message,
            notification_type: notification_type || 'INFO',
            is_urgent: is_urgent || false,
            action_url,
            action_text,
            expires_at: expires_at ? new Date(expires_at) : null,
            created_at: new Date()
        };

        res.status(201).json({
            message: "Notification created successfully (table not implemented in schema)",
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark notification as read
sellerDashboardExtended.put("/notifications/:notification_id/read", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { notification_id } = req.params;
        const notificationId = Number(notification_id);

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        // Since dashboard_notification doesn't exist, return mock response
        const notification = {
            id: notificationId,
            seller_id: seller.id,
            is_read: true,
            updated_at: new Date()
        };

        res.json({
            message: "Notification marked as read (table not implemented in schema)",
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark all notifications as read
sellerDashboardExtended.put("/notifications/read-all", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id } = req.body;

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        // Since dashboard_notification doesn't exist, return mock response
        const updateResult = { count: 0 };

        res.json({
            message: "All notifications marked as read (table not implemented in schema)",
            updated_count: updateResult.count
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== ACTION LOG ENDPOINTS ==========

// Log dashboard action
sellerDashboardExtended.post("/actions/log", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, action_type, action_description, metadata, ip_address, user_agent } = req.body;

        if (!action_type || !action_description) {
            res.status(400).json({ error: 'Action type and description are required' });
            return;
        }

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        // Since dashboard_action_log doesn't exist, return mock response
        const actionLog = {
            id: Math.floor(Math.random() * 1000),
            seller_id: seller.id,
            store_id: store_id,
            action_type,
            action_description,
            metadata: metadata || {},
            ip_address: ip_address || req.ip,
            user_agent: user_agent || req.get('User-Agent'),
            created_at: new Date()
        };

        res.status(201).json({
            message: "Action logged successfully (table not implemented in schema)",
            action: actionLog
        });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get action logs
sellerDashboardExtended.get("/actions/logs", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, action_type, start_date, end_date, limit = '50' } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        let storeFilter = {};
        if (store_id) {
            const storeId = parseInt(store_id as string);
            const ownsStore = seller.store.some((s: any) => s.id === storeId);
            if (!ownsStore) {
                res.status(403).json({ error: 'Access denied: You do not own this store' });
                return;
            }
            storeFilter = { store_id: storeId };
        }

        // Since dashboard_action_log doesn't exist, return mock response
        const logs: any[] = [];
        const actionStats: any[] = [];

        res.json({
            message: "Action logs fetched successfully (table not implemented in schema)",
            logs,
            statistics: {
                total_actions: logs.length,
                action_breakdown: actionStats.map((stat: any) => ({
                    action_type: stat.action_type,
                    count: stat._count?.action_type || 0
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching action logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default sellerDashboardExtended;
