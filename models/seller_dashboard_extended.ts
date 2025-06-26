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
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
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
                orderBy: { day_of_week: 'asc' }
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
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        // Update each day's hours
        const updatedHours = [];
        for (const hourData of hours) {
            const { day_of_week, is_open, opening_time, closing_time, break_start_time, break_end_time, is_24_hours } = hourData;
            
            const updated = await prisma.store_hours.upsert({
                where: {
                    store_id_day_of_week: {
                        store_id: storeId,
                        day_of_week: day_of_week
                    }
                },
                update: {
                    is_open: is_open ?? true,
                    opening_time: is_24_hours ? null : opening_time,
                    closing_time: is_24_hours ? null : closing_time,
                    break_start_time,
                    break_end_time,
                    is_24_hours: is_24_hours ?? false
                },
                create: {
                    store_id: storeId,
                    day_of_week: day_of_week,
                    is_open: is_open ?? true,
                    opening_time: is_24_hours ? null : opening_time,
                    closing_time: is_24_hours ? null : closing_time,
                    break_start_time,
                    break_end_time,
                    is_24_hours: is_24_hours ?? false
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
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const alerts = await prisma.inventory_alert.findMany({
            where: {
                store_id: storeId,
                ...(typeof is_resolved === 'string' && { is_resolved: is_resolved === 'true' }),
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
                unresolved: alerts.filter(a => !a.is_resolved).length,
                critical: alerts.filter(a => a.priority === 'CRITICAL' && !a.is_resolved).length,
                high: alerts.filter(a => a.priority === 'HIGH' && !a.is_resolved).length
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
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === store_id);
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
                threshold_value,
                current_value: product.stock,
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
                    include: {
                        seller: true
                    }
                }
            }
        });

        if (!alert) {
            res.status(404).json({ error: 'Alert not found' });
            return;
        }

        // Check if user owns this store
        const ownsStore = alert.store.seller.some(s => s.user_id === req.userId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const resolvedAlert = await prisma.inventory_alert.update({
            where: { id: alertId },
            data: {
                is_resolved: true,
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
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
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
                    include: {
                        seller: true
                    }
                }
            }
        });

        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        const ownsStore = review.store.seller.some(s => s.user_id === req.userId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const updatedReview = await prisma.store_review.update({
            where: { id: reviewId },
            data: {
                is_featured: is_featured ?? true
            },
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
            message: `Review ${is_featured ? 'featured' : 'unfeatured'} successfully`,
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
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        let storeFilter = {};
        if (store_id) {
            const storeId = parseInt(store_id as string);
            const ownsStore = seller.store.some(s => s.id === storeId);
            if (!ownsStore) {
                res.status(403).json({ error: 'Access denied: You do not own this store' });
                return;
            }
            storeFilter = { store_id: storeId };
        }

        const notifications = await prisma.dashboard_notification.findMany({
            where: {
                seller_id: seller.id,
                ...storeFilter,
                ...(typeof is_read === 'string' && { is_read: is_read === 'true' }),
                ...(typeof is_urgent === 'string' && { is_urgent: is_urgent === 'true' }),
                ...(notification_type && { notification_type: notification_type as any }),
                // Filter out expired notifications
                OR: [
                    { expires_at: null },
                    { expires_at: { gt: new Date() } }
                ]
            },
            orderBy: [
                { is_urgent: 'desc' },
                { created_at: 'desc' }
            ],
            take: parseInt(limit as string)
        });

        const unreadCount = await prisma.dashboard_notification.count({
            where: {
                seller_id: seller.id,
                is_read: false,
                OR: [
                    { expires_at: null },
                    { expires_at: { gt: new Date() } }
                ]
            }
        });

        res.json({
            message: "Notifications fetched successfully",
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
            where: { user_id: req.userId as number },
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

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const notification = await prisma.dashboard_notification.create({
            data: {
                seller_id: seller.id,
                store_id: storeId,
                title,
                message,
                notification_type: notification_type || 'INFO',
                is_urgent: is_urgent || false,
                action_url,
                action_text,
                expires_at: expires_at ? new Date(expires_at) : null
            }
        });

        res.status(201).json({
            message: "Notification created successfully",
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
            where: { user_id: req.userId as number }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const notification = await prisma.dashboard_notification.update({
            where: {
                id: notificationId,
                seller_id: seller.id
            },
            data: {
                is_read: true
            }
        });

        res.json({
            message: "Notification marked as read",
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
            where: { user_id: req.userId as number }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const updateResult = await prisma.dashboard_notification.updateMany({
            where: {
                seller_id: seller.id,
                ...(store_id && { store_id }),
                is_read: false
            },
            data: {
                is_read: true
            }
        });

        res.json({
            message: "All notifications marked as read",
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
            where: { user_id: req.userId as number }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const actionLog = await prisma.dashboard_action_log.create({
            data: {
                seller_id: seller.id,
                store_id: store_id || seller.store[0]?.id,
                action_type,
                action_description,
                metadata: metadata || {},
                ip_address: ip_address || req.ip,
                user_agent: user_agent || req.get('User-Agent')
            }
        });

        res.status(201).json({
            message: "Action logged successfully",
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
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        let storeFilter = {};
        if (store_id) {
            const storeId = parseInt(store_id as string);
            const ownsStore = seller.store.some(s => s.id === storeId);
            if (!ownsStore) {
                res.status(403).json({ error: 'Access denied: You do not own this store' });
                return;
            }
            storeFilter = { store_id: storeId };
        }

        const logs = await prisma.dashboard_action_log.findMany({
            where: {
                seller_id: seller.id,
                ...storeFilter,
                ...(action_type && { action_type: action_type as any }),
                ...(start_date && end_date && {
                    created_at: {
                        gte: new Date(start_date as string),
                        lte: new Date(end_date as string)
                    }
                })
            },
            orderBy: {
                created_at: 'desc'
            },
            take: parseInt(limit as string)
        });

        const actionStats = await prisma.dashboard_action_log.groupBy({
            by: ['action_type'],
            where: {
                seller_id: seller.id,
                ...storeFilter
            },
            _count: {
                action_type: true
            }
        });

        res.json({
            message: "Action logs fetched successfully",
            logs,
            statistics: {
                total_actions: logs.length,
                action_breakdown: actionStats.map(stat => ({
                    action_type: stat.action_type,
                    count: stat._count.action_type
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching action logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default sellerDashboardExtended;
