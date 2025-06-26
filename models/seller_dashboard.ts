import express from 'express';
import { authSellerMiddleware } from './auth/middleware';
import { PrismaClient } from '../db/generated/prisma';

const prisma = new PrismaClient();
const sellerDashboard = express.Router();

// Add JSON parsing middleware
sellerDashboard.use(express.json());

// ========== SELLER ENDPOINTS ==========

// Create seller profile
sellerDashboard.post("/seller/create", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { phone, business_license, tax_id } = req.body;
        
        if (!phone) {
            res.status(400).json({ error: 'Phone number is required' });
            return;
        }

        // Check if seller already exists for this user
        const existingSeller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number }
        });

        if (existingSeller) {
            res.status(400).json({ error: 'Seller profile already exists for this user' });
            return;
        }

        const seller = await prisma.seller.create({
            data: {
                user_id: req.userId as number,
                phone,
                business_license,
                tax_id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json({
            message: "Seller profile created successfully",
            seller
        });
    } catch (error) {
        console.error('Error creating seller:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get seller profile
sellerDashboard.get("/seller/profile", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        store_status: true,
                        store_type: true,
                        created_At: true
                    }
                }
            }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        res.json({
            message: "Seller profile fetched successfully",
            seller
        });
    } catch (error) {
        console.error('Error fetching seller profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update seller profile
sellerDashboard.put("/seller/update", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { phone, business_license, tax_id, is_verified } = req.body;

        const seller = await prisma.seller.update({
            where: { user_id: req.userId as number },
            data: {
                ...(phone && { phone }),
                ...(business_license && { business_license }),
                ...(tax_id && { tax_id }),
                ...(typeof is_verified === 'boolean' && { is_verified, verification_date: is_verified ? new Date() : null })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            message: "Seller profile updated successfully",
            seller
        });
    } catch (error) {
        console.error('Error updating seller profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== SELLER ANALYTICS ENDPOINTS ==========

// Get dashboard analytics
sellerDashboard.get("/analytics/dashboard", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, date } = req.query;

        // Verify seller owns the store
        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: {
                store: true
            }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id ? parseInt(store_id as string) : seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
``        }        // Check if seller owns this store
        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }const targetDate = date ? new Date(date as string) : new Date();
        
        // Validate the date
        if (isNaN(targetDate.getTime())) {
            res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD format.' });
            return;
        }
        
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        let analytics = await prisma.seller_analytics.findFirst({
            where: {
                seller_id: seller.id,
                store_id: storeId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // If no analytics exist for today, create one with current data
        if (!analytics) {
            const todaysOrders = await prisma.orders.findMany({
                where: {
                    store_id: storeId,
                    placed_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    order_items: true
                }
            });

            const dailySalesAmount = todaysOrders.reduce((sum, order) => sum + order.total_amount, 0);
            const dailyOrdersCount = todaysOrders.length;
            const totalProductsSold = todaysOrders.reduce((sum, order) => 
                sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
            const uniqueCustomers = new Set(todaysOrders.map(order => order.user_id)).size;
            const averageOrderValue = dailyOrdersCount > 0 ? dailySalesAmount / dailyOrdersCount : 0;

            // Get inventory count
            const inventoryCount = await prisma.product.aggregate({
                where: { store_id: storeId },
                _sum: { stock: true }
            });

            analytics = await prisma.seller_analytics.create({
                data: {
                    seller_id: seller.id,
                    store_id: storeId,
                    date: targetDate,
                    daily_sales_amount: dailySalesAmount,
                    daily_orders_count: dailyOrdersCount,
                    daily_revenue: Math.round(dailySalesAmount * 0.8), // Assuming 20% cost
                    total_products_sold: totalProductsSold,
                    total_customers_served: uniqueCustomers,
                    average_order_value: averageOrderValue,
                    inventory_count: inventoryCount._sum.stock || 0
                }
            });
        }

        res.json({
            message: "Dashboard analytics fetched successfully",
            analytics
        });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get analytics for date range
sellerDashboard.get("/analytics/range", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, start_date, end_date } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id ? parseInt(store_id as string) : seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const startDate = start_date ? new Date(start_date as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = end_date ? new Date(end_date as string) : new Date();

        const analytics = await prisma.seller_analytics.findMany({
            where: {
                seller_id: seller.id,
                store_id: storeId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        // Calculate totals
        const totals = analytics.reduce((acc, curr) => ({
            total_sales: acc.total_sales + curr.daily_sales_amount,
            total_orders: acc.total_orders + curr.daily_orders_count,
            total_revenue: acc.total_revenue + curr.daily_revenue,
            total_products_sold: acc.total_products_sold + curr.total_products_sold,
            total_customers: acc.total_customers + curr.total_customers_served
        }), {
            total_sales: 0,
            total_orders: 0,
            total_revenue: 0,
            total_products_sold: 0,
            total_customers: 0
        });

        res.json({
            message: "Analytics range fetched successfully",
            analytics,
            totals,
            period: {
                start_date: startDate,
                end_date: endDate,
                days: analytics.length
            }
        });
    } catch (error) {
        console.error('Error fetching analytics range:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== SALES REPORT ENDPOINTS ==========

// Generate sales report
sellerDashboard.post("/reports/generate", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, report_type, start_date, end_date, custom_data } = req.body;

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

        let reportStartDate: Date;
        let reportEndDate: Date = new Date();

        // Calculate date range based on report type
        switch (report_type) {
            case 'DAILY':
                reportStartDate = new Date();
                reportStartDate.setHours(0, 0, 0, 0);
                reportEndDate.setHours(23, 59, 59, 999);
                break;
            case 'WEEKLY':
                reportStartDate = new Date();
                reportStartDate.setDate(reportStartDate.getDate() - 7);
                break;
            case 'MONTHLY':
                reportStartDate = new Date();
                reportStartDate.setMonth(reportStartDate.getMonth() - 1);
                break;
            case 'QUARTERLY':
                reportStartDate = new Date();
                reportStartDate.setMonth(reportStartDate.getMonth() - 3);
                break;
            case 'YEARLY':
                reportStartDate = new Date();
                reportStartDate.setFullYear(reportStartDate.getFullYear() - 1);
                break;
            case 'CUSTOM':
                if (!start_date || !end_date) {
                    res.status(400).json({ error: 'Start date and end date are required for custom reports' });
                    return;
                }
                reportStartDate = new Date(start_date);
                reportEndDate = new Date(end_date);
                break;
            default:
                res.status(400).json({ error: 'Invalid report type' });
                return;
        }

        // Fetch orders for the period
        const orders = await prisma.orders.findMany({
            where: {
                store_id: storeId,
                placed_at: {
                    gte: reportStartDate,
                    lte: reportEndDate
                }
            },
            include: {
                order_items: {
                    include: {
                        product: true
                    }
                },
                user: true
            }
        });

        // Calculate metrics
        const totalSalesAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const totalOrders = orders.length;
        const totalProductsSold = orders.reduce((sum, order) => 
            sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        const totalCustomers = new Set(orders.map(order => order.user_id)).size;

        // Find best and worst selling products
        const productSales: { [key: number]: { product: any, quantity: number } } = {};
        orders.forEach(order => {
            order.order_items.forEach(item => {                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        product: item.product,
                        quantity: 0
                    };
                }
                productSales[item.product_id]!.quantity += item.quantity;
            });
        });

        const sortedProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
        const bestSellingProduct = sortedProducts[0]?.product;
        const worstSellingProduct = sortedProducts[sortedProducts.length - 1]?.product;

        // Calculate profit margin (assuming 20% cost)
        const profitMargin = totalSalesAmount > 0 ? ((totalSalesAmount * 0.8) / totalSalesAmount) * 100 : 0;

        // Calculate hourly sales for peak analysis
        const hourlySales: { [key: string]: number } = {};
        orders.forEach(order => {
            const hour = order.placed_at.getHours().toString().padStart(2, '0') + ':00';
            hourlySales[hour] = (hourlySales[hour] || 0) + order.total_amount;
        });

        const sortedHours = Object.entries(hourlySales).sort(([,a], [,b]) => b - a);
        const peakSalesHour = sortedHours[0]?.[0];
        const slowestSalesHour = sortedHours[sortedHours.length - 1]?.[0];

        const report = await prisma.sales_report.create({
            data: {
                seller_id: seller.id,
                store_id: storeId,
                report_type: report_type || 'DAILY',
                start_date: reportStartDate,
                end_date: reportEndDate,
                total_sales_amount: totalSalesAmount,
                total_orders: totalOrders,
                total_products_sold: totalProductsSold,
                total_customers: totalCustomers,
                best_selling_product_id: bestSellingProduct?.id,
                worst_selling_product_id: worstSellingProduct?.id,
                profit_margin: profitMargin,
                return_rate: 0, // Placeholder - would need return tracking
                peak_sales_hour: peakSalesHour,
                slowest_sales_hour: slowestSalesHour,
                report_data: {
                    hourly_sales: hourlySales,
                    product_performance: sortedProducts.slice(0, 10), // Top 10 products
                    custom_data: custom_data || {}
                }
            },
            include: {
                best_selling_product: true,
                worst_selling_product: true
            }
        });

        res.status(201).json({
            message: "Sales report generated successfully",
            report
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sales reports
sellerDashboard.get("/reports", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, report_type, limit = '10' } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id ? parseInt(store_id as string) : seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const reports = await prisma.sales_report.findMany({
            where: {
                seller_id: seller.id,
                store_id: storeId,
                ...(report_type && { report_type: report_type as any })
            },
            include: {
                best_selling_product: {
                    select: {
                        id: true,
                        product_name: true,
                        price: true
                    }
                },
                worst_selling_product: {
                    select: {
                        id: true,
                        product_name: true,
                        price: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: parseInt(limit as string)
        });

        res.json({
            message: "Sales reports fetched successfully",
            reports,
            total: reports.length
        });
    } catch (error) {
        console.error('Error fetching sales reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== STORE PERFORMANCE ENDPOINTS ==========

// Get store performance metrics
sellerDashboard.get("/performance/:store_id", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id } = req.params;
        if (!store_id) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }
        const storeId = parseInt(store_id);

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

        let performance = await prisma.store_performance.findUnique({
            where: { store_id: storeId }
        });

        // If no performance record exists, create one
        if (!performance) {
            // Calculate initial metrics
            const orders = await prisma.orders.findMany({
                where: { store_id: storeId }
            });

            const reviews = await prisma.store_review.findMany({
                where: { store_id: storeId }
            });

            const totalLifetimeSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
            const totalLifetimeOrders = orders.length;
            const totalCustomers = new Set(orders.map(order => order.user_id)).size;
            const averageRating = reviews.length > 0 
                ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                : 0;
            const totalReviews = reviews.length;            const lastSaleDate = orders.length > 0 
                ? orders.sort((a, b) => b.placed_at.getTime() - a.placed_at.getTime())[0]!.placed_at 
                : null;

            performance = await prisma.store_performance.create({
                data: {
                    store_id: storeId,
                    total_lifetime_sales: totalLifetimeSales,
                    total_lifetime_orders: totalLifetimeOrders,
                    total_customers: totalCustomers,
                    average_rating: averageRating,
                    total_reviews: totalReviews,
                    last_sale_date: lastSaleDate,
                    inventory_turnover_rate: 0, // Would need more complex calculation
                    monthly_growth_rate: 0, // Would need historical data
                    customer_retention_rate: 0 // Would need customer visit tracking
                }
            });
        }

        res.json({
            message: "Store performance fetched successfully",
            performance
        });
    } catch (error) {
        console.error('Error fetching store performance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update store performance metrics
sellerDashboard.put("/performance/:store_id", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id } = req.params;
        if (!store_id) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }
        const storeId = parseInt(store_id);
        const updateData = req.body;

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

        const performance = await prisma.store_performance.update({
            where: { store_id: storeId },
            data: updateData
        });

        res.json({
            message: "Store performance updated successfully",
            performance
        });
    } catch (error) {
        console.error('Error updating store performance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== COMPREHENSIVE SELLER REPORTS ENDPOINTS ==========

// Get earnings report (daily, weekly, monthly)
sellerDashboard.get("/reports/earnings", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, period = 'daily', start_date, end_date } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id ? parseInt(store_id as string) : seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        let reportStartDate: Date;
        let reportEndDate: Date = new Date();

        // Calculate date range based on period
        switch (period) {
            case 'daily':
                reportStartDate = new Date();
                reportStartDate.setHours(0, 0, 0, 0);
                reportEndDate.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                reportStartDate = new Date();
                reportStartDate.setDate(reportStartDate.getDate() - 7);
                break;
            case 'monthly':
                reportStartDate = new Date();
                reportStartDate.setMonth(reportStartDate.getMonth() - 1);
                break;
            case 'custom':
                if (!start_date || !end_date) {
                    res.status(400).json({ error: 'Start date and end date are required for custom period' });
                    return;
                }
                reportStartDate = new Date(start_date as string);
                reportEndDate = new Date(end_date as string);
                
                if (isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
                    res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD format.' });
                    return;
                }
                break;
            default:
                res.status(400).json({ error: 'Invalid period. Use daily, weekly, monthly, or custom' });
                return;
        }

        // Fetch orders for the period
        const orders = await prisma.orders.findMany({
            where: {
                store_id: storeId,
                placed_at: {
                    gte: reportStartDate,
                    lte: reportEndDate
                }
            },
            include: {
                order_items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                product_name: true,
                                price: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                placed_at: 'desc'
            }
        });        // Calculate earnings metrics
        const totalOrders = orders.length;
        const totalEarnings = orders.reduce((sum, order) => sum + order.total_amount, 0);
        const deliveredOrders = orders.filter(order => order.status === 'DELIVERED');
        const cancelledOrders = orders.filter(order => order.status === 'CANCELLED');
        const rejectedOrders = orders.filter(order => order.status === 'REJECTED');
        
        const completedEarnings = deliveredOrders.reduce((sum, order) => sum + order.total_amount, 0);
        const cancelledAmount = cancelledOrders.reduce((sum, order) => sum + order.total_amount, 0);
        const rejectedAmount = rejectedOrders.reduce((sum, order) => sum + order.total_amount, 0);        // Calculate daily breakdown for the period
        const dailyBreakdown: { [key: string]: { orders: number, earnings: number, cancelled: number, rejected: number } } = {};
        
        orders.forEach(order => {
            const dateKey = order.placed_at.toISOString().split('T')[0];
            if (dateKey && !dailyBreakdown[dateKey]) {
                dailyBreakdown[dateKey] = { orders: 0, earnings: 0, cancelled: 0, rejected: 0 };
            }
              if (dateKey) {
                dailyBreakdown[dateKey]!.orders += 1;
                dailyBreakdown[dateKey]!.earnings += order.total_amount;
                
                if (order.status === 'CANCELLED') {
                    dailyBreakdown[dateKey]!.cancelled += 1;
                } else if (order.status === 'REJECTED') {
                    dailyBreakdown[dateKey]!.rejected += 1;
                }
            }
        });

        // Calculate product performance
        const productSales: { [key: number]: { product: any, quantity: number, revenue: number } } = {};
        orders.forEach(order => {
            order.order_items.forEach(item => {
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        product: item.product,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.product_id]!.quantity += item.quantity;
                productSales[item.product_id]!.revenue += item.price * item.quantity;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const report = {
            period: period as string,
            date_range: {
                start_date: reportStartDate,
                end_date: reportEndDate
            },            summary: {
                total_orders: totalOrders,
                total_earnings: totalEarnings,
                completed_earnings: completedEarnings,
                cancelled_orders: cancelledOrders.length,
                cancelled_amount: cancelledAmount,
                rejected_orders: rejectedOrders.length,
                rejected_amount: rejectedAmount,
                net_earnings: completedEarnings - rejectedAmount,
                average_order_value: totalOrders > 0 ? totalEarnings / totalOrders : 0,
                completion_rate: totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0,
                cancellation_rate: totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0,
                rejection_rate: totalOrders > 0 ? (rejectedOrders.length / totalOrders) * 100 : 0
            },
            daily_breakdown: dailyBreakdown,
            top_products: topProducts,
            orders: orders.map(order => ({
                id: order.id,
                total_amount: order.total_amount,
                status: order.status,
                placed_at: order.placed_at,
                items_count: order.order_items.length
            }))
        };

        res.json({
            message: "Earnings report generated successfully",
            report
        });
    } catch (error) {
        console.error('Error generating earnings report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get order status summary
sellerDashboard.get("/reports/order-status", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, period = 'monthly' } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id ? parseInt(store_id as string) : seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        let startDate = new Date();
        switch (period) {
            case 'weekly':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarterly':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            default:
                startDate.setMonth(startDate.getMonth() - 1);
        }

        const orders = await prisma.orders.findMany({
            where: {
                store_id: storeId,
                placed_at: {
                    gte: startDate
                }
            },
            include: {
                order_items: true,
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                placed_at: 'desc'
            }
        });

        // Group by status
        const statusSummary = orders.reduce((acc, order) => {
            const status = order.status;
            if (!acc[status]) {
                acc[status] = {
                    count: 0,
                    total_amount: 0,
                    orders: []
                };
            }
            acc[status].count += 1;
            acc[status].total_amount += order.total_amount;
            acc[status].orders.push({
                id: order.id,
                total_amount: order.total_amount,
                placed_at: order.placed_at,
                customer: order.user.name,
                items_count: order.order_items.length
            });
            return acc;
        }, {} as any);

        // Calculate trends
        const totalOrders = orders.length;
        const trends = {
            pending: statusSummary['PENDING']?.count || 0,
            accepted: statusSummary['ACCEPTED']?.count || 0,
            preparing: statusSummary['PREPARING']?.count || 0,
            ready: statusSummary['READY']?.count || 0,
            out_for_delivery: statusSummary['OUT_FOR_DELIVERY']?.count || 0,
            delivered: statusSummary['DELIVERED']?.count || 0,
            cancelled: statusSummary['CANCELLED']?.count || 0,
            returned: statusSummary['RETURNED']?.count || 0
        };

        res.json({
            message: "Order status summary generated successfully",
            period: period as string,
            total_orders: totalOrders,
            status_summary: statusSummary,
            trends,
            performance_metrics: {
                fulfillment_rate: totalOrders > 0 ? ((trends.delivered / totalOrders) * 100).toFixed(2) : 0,
                cancellation_rate: totalOrders > 0 ? ((trends.cancelled / totalOrders) * 100).toFixed(2) : 0,
                return_rate: totalOrders > 0 ? ((trends.returned / totalOrders) * 100).toFixed(2) : 0,
                average_processing_time: "2.5 hours" // This would need actual processing time tracking
            }
        });
    } catch (error) {
        console.error('Error generating order status report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export report as CSV
sellerDashboard.get("/reports/export/csv", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, report_type = 'earnings', period = 'monthly', start_date, end_date } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: { store: true }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id ? parseInt(store_id as string) : seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        // Calculate date range
        let reportStartDate: Date;
        let reportEndDate: Date = new Date();

        if (period === 'custom' && start_date && end_date) {
            reportStartDate = new Date(start_date as string);
            reportEndDate = new Date(end_date as string);
        } else {
            reportStartDate = new Date();
            switch (period) {
                case 'weekly':
                    reportStartDate.setDate(reportStartDate.getDate() - 7);
                    break;
                case 'monthly':
                    reportStartDate.setMonth(reportStartDate.getMonth() - 1);
                    break;
                case 'quarterly':
                    reportStartDate.setMonth(reportStartDate.getMonth() - 3);
                    break;
                default:
                    reportStartDate.setMonth(reportStartDate.getMonth() - 1);
            }
        }

        // Fetch orders data
        const orders = await prisma.orders.findMany({
            where: {
                store_id: storeId,
                placed_at: {
                    gte: reportStartDate,
                    lte: reportEndDate
                }
            },
            include: {
                order_items: {
                    include: {
                        product: {
                            select: {
                                product_name: true,
                                price: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                placed_at: 'desc'
            }
        });

        let csvContent = '';
        let filename = '';

        if (report_type === 'earnings') {
            // Generate earnings CSV
            csvContent = 'Date,Order ID,Customer Name,Customer Email,Total Amount,Status,Items Count,Revenue\n';
            filename = `earnings_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
            
            orders.forEach(order => {
                const date = order.placed_at.toISOString().split('T')[0];
                const revenue = order.status === 'DELIVERED' ? order.total_amount : 0;
                csvContent += `${date},${order.id},"${order.user.name}","${order.user.email}",${order.total_amount},${order.status},${order.order_items.length},${revenue}\n`;
            });
        } else if (report_type === 'products') {
            // Generate product performance CSV
            csvContent = 'Product Name,Quantity Sold,Revenue,Average Price,Orders Count\n';
            filename = `product_performance_${period}_${new Date().toISOString().split('T')[0]}.csv`;
            
            const productSales: { [key: string]: { quantity: number, revenue: number, orders: number, totalPrice: number } } = {};
            
            orders.forEach(order => {
                if (order.status === 'DELIVERED') {
                    order.order_items.forEach(item => {
                        const productName = item.product.product_name;
                        if (!productSales[productName]) {
                            productSales[productName] = { quantity: 0, revenue: 0, orders: 0, totalPrice: 0 };
                        }
                        productSales[productName].quantity += item.quantity;
                        productSales[productName].revenue += item.price * item.quantity;
                        productSales[productName].orders += 1;
                        productSales[productName].totalPrice += item.price;
                    });
                }
            });
            
            Object.entries(productSales).forEach(([productName, data]) => {
                const avgPrice = data.orders > 0 ? data.totalPrice / data.orders : 0;
                csvContent += `"${productName}",${data.quantity},${data.revenue},${avgPrice.toFixed(2)},${data.orders}\n`;
            });
        } else {
            // Generate orders CSV
            csvContent = 'Date,Order ID,Customer Name,Customer Email,Total Amount,Status,Items,Payment Method\n';
            filename = `orders_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
            
            orders.forEach(order => {
                const date = order.placed_at.toISOString().split('T')[0];
                const items = order.order_items.map(item => `${item.product.product_name} (${item.quantity})`).join('; ');
                csvContent += `${date},${order.id},"${order.user.name}","${order.user.email}",${order.total_amount},${order.status},"${items}",N/A\n`;
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting CSV report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate PDF report (simplified version - in production, use a proper PDF library)
sellerDashboard.get("/reports/export/pdf", authSellerMiddleware, async (req, res): Promise<void> => {
    try {
        const { store_id, report_type = 'earnings', period = 'monthly' } = req.query;

        const seller = await prisma.seller.findUnique({
            where: { user_id: req.userId as number },
            include: { 
                store: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        if (!seller) {
            res.status(404).json({ error: 'Seller profile not found' });
            return;
        }

        const storeId = store_id ? parseInt(store_id as string) : seller.store[0]?.id;
        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required' });
            return;
        }

        const ownsStore = seller.store.some(s => s.id === storeId);
        if (!ownsStore) {
            res.status(403).json({ error: 'Access denied: You do not own this store' });
            return;
        }

        const store = seller.store.find(s => s.id === storeId);

        // For now, return a JSON structure that represents the PDF content
        // In production, you would use a library like puppeteer, jsPDF, or PDFKit
        const pdfData = {
            title: `${String(report_type).toUpperCase()} Report - ${store?.name}`,
            period: period as string,
            generated_at: new Date().toISOString(),
            store_info: {
                name: store?.name,
                address: store?.address,
                email: store?.email,
                phone: store?.phone
            },
            report_url: `/api/seller-dashboard/reports/earnings?store_id=${storeId}&period=${period}`,
            note: "PDF generation is not fully implemented. Use the CSV export or the JSON report endpoint for now.",
            instructions: "To implement PDF generation, integrate a PDF library like puppeteer, jsPDF, or PDFKit."
        };

        res.json({
            message: "PDF report structure generated (PDF generation not fully implemented)",
            pdf_data: pdfData,
            csv_export_url: `/api/seller-dashboard/reports/export/csv?store_id=${storeId}&report_type=${report_type}&period=${period}`
        });
    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default sellerDashboard;
