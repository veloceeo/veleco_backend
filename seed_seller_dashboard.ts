import { PrismaClient } from './db/generated/prisma';

const prisma = new PrismaClient();

async function seedSellerDashboard() {
  console.log('🌱 Seeding Seller Dashboard data...');

  try {
    // 1. Create users first (required for seller foreign keys)
    console.log('👥 Creating users...');
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'seller1@example.com' },
        update: {},
        create: {
          email: 'seller1@example.com',
          password: 'hashedpassword123',
          name: 'John Seller',
          phone: '+1-555-0101',
          role: 'seller',
          latitude: 40.7128,
          longitude: -74.0060
        }
      }),
      prisma.user.upsert({
        where: { email: 'seller2@example.com' },
        update: {},
        create: {
          email: 'seller2@example.com',
          password: 'hashedpassword456',
          name: 'Jane Merchant',
          phone: '+1-555-0102',
          role: 'seller',
          latitude: 34.0522,
          longitude: -118.2437
        }
      }),
      prisma.user.upsert({
        where: { email: 'seller3@example.com' },
        update: {},
        create: {
          email: 'seller3@example.com',
          password: 'hashedpassword789',
          name: 'Mike Store',
          phone: '+1-555-0103',
          role: 'seller',
          latitude: 41.8781,
          longitude: -87.6298
        }
      })
    ]);
    
    console.log(`✅ Created ${users.length} users`);

    // 2. Create sellers
    console.log('📊 Creating sellers...');    const sellers = await Promise.all([
      prisma.seller.upsert({
        where: { user_id: users[0].id },
        update: {},
        create: {
          user_id: users[0].id,
          phone: '+1-555-0101',
          business_license: 'BL-2024-001',
          tax_id: 'TAX-001-2024',
          is_verified: true,
          verification_date: new Date('2024-01-15T10:30:00Z')
        }
      }),
      prisma.seller.upsert({
        where: { user_id: users[1].id },
        update: {},
        create: {
          user_id: users[1].id,
          phone: '+1-555-0102',
          business_license: 'BL-2024-002',
          tax_id: 'TAX-002-2024',
          is_verified: true,
          verification_date: new Date('2024-02-20T14:45:00Z')
        }
      }),
      prisma.seller.upsert({
        where: { user_id: users[2].id },
        update: {},
        create: {
          user_id: users[2].id,
          phone: '+1-555-0103',
          business_license: 'BL-2024-003',
          tax_id: 'TAX-003-2024',
          is_verified: false,
          verification_date: null
        }
      })
    ]);    
    console.log(`✅ Created ${sellers.length} sellers`);

    // 3. Create stores (required for analytics and other data)
    console.log('🏪 Creating stores...');
    const stores = await Promise.all([
      prisma.store.upsert({
        where: { email: 'store1@example.com' },
        update: {},
        create: {
          name: 'Tech Electronics Store',
          address: '123 Main St, New York, NY 10001',
          phone: '+1-555-0201',
          email: 'store1@example.com',
          pan_number: 'PAN001TECH',
          adhar_number: 'ADHAR001TECH',
          gst_number: 'GST001TECH',
          store_type: 'retail',
          user_id: users[0].id,
          latitude: 40.7128,
          longitude: -74.0060
        }
      }),
      prisma.store.upsert({
        where: { email: 'store2@example.com' },
        update: {},
        create: {
          name: 'Gaming Gear Hub',
          address: '456 Market St, Los Angeles, CA 90001',
          phone: '+1-555-0202',
          email: 'store2@example.com',
          pan_number: 'PAN002GAME',
          adhar_number: 'ADHAR002GAME',
          gst_number: 'GST002GAME',
          store_type: 'online',
          user_id: users[1].id,
          latitude: 34.0522,
          longitude: -118.2437
        }
      })
    ]);
    
    console.log(`✅ Created ${stores.length} stores`);

    // 4. Create some basic products (required for alerts and reports)
    console.log('📦 Creating products...');
    const products = await Promise.all([
      prisma.product.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          product_name: 'Premium Headphones',
          price: 299,
          product_img: ['headphones1.jpg', 'headphones2.jpg'],
          quantity: 50,
          category: 'Electronics',
          stock: 3, // Low stock for testing alerts
          store_id: stores[0].id,
          latitude: 40.7128
        }
      }),
      prisma.product.upsert({
        where: { id: 2 },
        update: {},
        create: {
          id: 2,
          product_name: 'Bluetooth Speaker',
          price: 149,
          product_img: ['speaker1.jpg', 'speaker2.jpg'],
          quantity: 30,
          category: 'Electronics',
          stock: 0, // Out of stock for testing alerts
          store_id: stores[0].id,
          latitude: 40.7128
        }
      }),
      prisma.product.upsert({
        where: { id: 3 },
        update: {},
        create: {
          id: 3,
          product_name: 'Wireless Earbuds',
          price: 199,
          product_img: ['earbuds1.jpg', 'earbuds2.jpg'],
          quantity: 100,
          category: 'Electronics',
          stock: 78,
          store_id: stores[0].id,
          latitude: 40.7128
        }
      }),
      prisma.product.upsert({
        where: { id: 4 },
        update: {},
        create: {
          id: 4,
          product_name: 'Gaming Mouse',
          price: 79,
          product_img: ['mouse1.jpg', 'mouse2.jpg'],
          quantity: 75,
          category: 'Gaming',
          stock: 8, // Low stock for testing alerts
          store_id: stores[1].id,
          latitude: 34.0522
        }
      }),
      prisma.product.upsert({
        where: { id: 5 },
        update: {},
        create: {
          id: 5,
          product_name: 'Mechanical Keyboard',
          price: 159,
          product_img: ['keyboard1.jpg', 'keyboard2.jpg'],
          quantity: 40,
          category: 'Gaming',
          stock: 20,
          store_id: stores[1].id,
          latitude: 34.0522
        }
      })
    ]);
    
    console.log(`✅ Created ${products.length} products`);

    // 5. Create some test users for reviews and orders
    console.log('👤 Creating customer users...');
    const customerUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'customer1@example.com' },
        update: {},
        create: {
          email: 'customer1@example.com',
          password: 'hashedpassword123',
          name: 'Alice Customer',
          phone: '+1-555-1001',
          role: 'customer',
          latitude: 40.7589,
          longitude: -73.9851
        }
      }),
      prisma.user.upsert({
        where: { email: 'customer2@example.com' },
        update: {},
        create: {
          email: 'customer2@example.com',
          password: 'hashedpassword456',
          name: 'Bob Buyer',
          phone: '+1-555-1002',
          role: 'customer',
          latitude: 34.0522,
          longitude: -118.2437
        }
      }),
      prisma.user.upsert({
        where: { email: 'customer3@example.com' },
        update: {},
        create: {
          email: 'customer3@example.com',
          password: 'hashedpassword789',
          name: 'Carol Client',
          phone: '+1-555-1003',
          role: 'customer',
          latitude: 41.8781,
          longitude: -87.6298
        }
      })
    ]);
    
    console.log(`✅ Created ${customerUsers.length} customer users`);

    // 6. Create some test orders
    console.log('📋 Creating test orders...');
    const orders = await Promise.all([
      prisma.orders.create({
        data: {
          user_id: customerUsers[0].id,
          store_id: stores[0].id,
          total_amount: 299,
          status: 'DELIVERED'
        }
      }),
      prisma.orders.create({
        data: {
          user_id: customerUsers[1].id,
          store_id: stores[0].id,
          total_amount: 149,
          status: 'DELIVERED'
        }
      }),
      prisma.orders.create({
        data: {
          user_id: customerUsers[2].id,
          store_id: stores[1].id,
          total_amount: 79,
          status: 'DELIVERED'
        }
      })
    ]);
    
    console.log(`✅ Created ${orders.length} test orders`);    // 7. Create seller analytics
    console.log('📈 Creating seller analytics...');
    const analyticsData = [
      {
        seller_id: sellers[0].id,
        store_id: stores[0].id,
        date: new Date('2024-06-24T00:00:00Z'),
        daily_sales_amount: 12500,
        daily_orders_count: 25,
        daily_revenue: 10000,
        total_products_sold: 78,
        total_customers_served: 23,
        average_order_value: 500.0,
        inventory_count: 245
      },
      {
        seller_id: sellers[0].id,
        store_id: stores[0].id,
        date: new Date('2024-06-23T00:00:00Z'),
        daily_sales_amount: 8750,
        daily_orders_count: 18,
        daily_revenue: 7000,
        total_products_sold: 52,
        total_customers_served: 16,
        average_order_value: 486.11,
        inventory_count: 250
      },
      {
        seller_id: sellers[1].id,
        store_id: stores[1].id,
        date: new Date('2024-06-24T00:00:00Z'),
        daily_sales_amount: 15600,
        daily_orders_count: 32,
        daily_revenue: 12480,
        total_products_sold: 95,
        total_customers_served: 28,
        average_order_value: 487.5,
        inventory_count: 180
      },
      {
        seller_id: sellers[0].id,
        store_id: stores[0].id,
        date: new Date('2024-06-22T00:00:00Z'),
        daily_sales_amount: 9200,
        daily_orders_count: 21,
        daily_revenue: 7360,
        total_products_sold: 63,
        total_customers_served: 19,
        average_order_value: 438.1,
        inventory_count: 255
      }
    ];

    await prisma.seller_analytics.createMany({
      data: analyticsData,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${analyticsData.length} analytics records`);

    // 3. Create sales reports
    console.log('📋 Creating sales reports...');
    const salesReports = await Promise.all([
      prisma.sales_report.create({        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          report_type: 'DAILY',
          start_date: new Date('2024-06-24T00:00:00Z'),
          end_date: new Date('2024-06-24T23:59:59Z'),
          total_sales_amount: 12500,
          total_orders: 25,
          total_products_sold: 78,
          total_customers: 23,
          best_selling_product_id: 1,
          worst_selling_product_id: 2,
          profit_margin: 80.0,
          return_rate: 2.5,
          customer_satisfaction_score: 4.7,
          peak_sales_hour: '14:00',
          slowest_sales_hour: '03:00',
          report_data: {
            hourly_sales: {
              '09:00': 850,
              '10:00': 1200,
              '11:00': 1450,
              '12:00': 1800,
              '13:00': 1650,
              '14:00': 2100,
              '15:00': 1750,
              '16:00': 1400,
              '17:00': 1250
            },
            product_performance: [
              {
                product: { id: 1, product_name: 'Premium Headphones', price: 299 },
                quantity: 15
              },
              {
                product: { id: 2, product_name: 'Bluetooth Speaker', price: 149 },
                quantity: 12
              }
            ],
            custom_data: {
              weather: 'sunny',
              special_events: ['weekend_sale']
            }
          }
        }
      }),
      prisma.sales_report.create({        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          report_type: 'WEEKLY',
          start_date: new Date('2024-06-17T00:00:00Z'),
          end_date: new Date('2024-06-24T23:59:59Z'),
          total_sales_amount: 78500,
          total_orders: 156,
          total_products_sold: 485,
          total_customers: 134,
          best_selling_product_id: 1,
          worst_selling_product_id: 5,
          profit_margin: 78.5,
          return_rate: 3.2,
          customer_satisfaction_score: 4.6,
          peak_sales_hour: '15:00',
          slowest_sales_hour: '02:00',
          report_data: {
            daily_breakdown: {
              monday: 8900,
              tuesday: 10200,
              wednesday: 11800,
              thursday: 12600,
              friday: 13500,
              saturday: 15200,
              sunday: 6300
            }
          }
        }
      })
    ]);
    
    console.log(`✅ Created ${salesReports.length} sales reports`);

    // 4. Create store performance records
    console.log('🏪 Creating store performance records...');
    const storePerformance = await Promise.all([      prisma.store_performance.upsert({
        where: { store_id: stores[0].id },
        update: {},
        create: {
          store_id: stores[0].id,
          total_lifetime_sales: 1250000,
          total_lifetime_orders: 2847,
          total_customers: 1523,
          average_rating: 4.7,
          total_reviews: 342,
          inventory_turnover_rate: 12.5,
          last_sale_date: new Date('2024-06-24T18:45:00Z'),
          peak_hours: {
            monday: ['10:00-12:00', '14:00-16:00'],
            tuesday: ['11:00-13:00', '15:00-17:00'],
            wednesday: ['10:00-12:00', '14:00-16:00'],
            thursday: ['11:00-13:00', '15:00-17:00'],
            friday: ['12:00-14:00', '16:00-18:00'],
            saturday: ['10:00-18:00'],
            sunday: ['12:00-16:00']
          },
          monthly_growth_rate: 15.8,
          customer_retention_rate: 68.5
        }
      }),      prisma.store_performance.upsert({
        where: { store_id: stores[1].id },
        update: {},
        create: {
          store_id: stores[1].id,
          total_lifetime_sales: 890000,
          total_lifetime_orders: 1967,
          total_customers: 1145,
          average_rating: 4.5,
          total_reviews: 278,
          inventory_turnover_rate: 10.2,
          last_sale_date: new Date('2024-06-24T19:20:00Z'),
          peak_hours: {
            monday: ['09:00-11:00', '13:00-15:00'],
            tuesday: ['10:00-12:00', '14:00-16:00'],
            wednesday: ['09:00-11:00', '13:00-15:00'],
            thursday: ['10:00-12:00', '14:00-16:00'],
            friday: ['11:00-13:00', '15:00-17:00'],
            saturday: ['09:00-17:00'],
            sunday: ['11:00-15:00']
          },
          monthly_growth_rate: 12.3,
          customer_retention_rate: 72.1
        }
      })
    ]);
    
    console.log(`✅ Created ${storePerformance.length} store performance records`);

    // 5. Create store hours
    console.log('🕐 Creating store hours...');    const storeHoursData = [
      // Store 1 hours (closed Sunday)
      { store_id: stores[0].id, day_of_week: 0, is_open: false, opening_time: null, closing_time: null },
      { store_id: stores[0].id, day_of_week: 1, is_open: true, opening_time: '09:00', closing_time: '18:00', break_start_time: '13:00', break_end_time: '14:00' },
      { store_id: stores[0].id, day_of_week: 2, is_open: true, opening_time: '09:00', closing_time: '18:00', break_start_time: '13:00', break_end_time: '14:00' },
      { store_id: stores[0].id, day_of_week: 3, is_open: true, opening_time: '09:00', closing_time: '18:00', break_start_time: '13:00', break_end_time: '14:00' },
      { store_id: stores[0].id, day_of_week: 4, is_open: true, opening_time: '09:00', closing_time: '18:00', break_start_time: '13:00', break_end_time: '14:00' },
      { store_id: stores[0].id, day_of_week: 5, is_open: true, opening_time: '09:00', closing_time: '20:00' },
      { store_id: stores[0].id, day_of_week: 6, is_open: true, opening_time: '10:00', closing_time: '20:00' },
      
      // Store 2 hours (open all days)
      { store_id: stores[1].id, day_of_week: 0, is_open: true, opening_time: '11:00', closing_time: '17:00' },
      { store_id: stores[1].id, day_of_week: 1, is_open: true, opening_time: '08:00', closing_time: '19:00', break_start_time: '12:30', break_end_time: '13:30' },
      { store_id: stores[1].id, day_of_week: 2, is_open: true, opening_time: '08:00', closing_time: '19:00', break_start_time: '12:30', break_end_time: '13:30' },
      { store_id: stores[1].id, day_of_week: 3, is_open: true, opening_time: '08:00', closing_time: '19:00', break_start_time: '12:30', break_end_time: '13:30' },
      { store_id: stores[1].id, day_of_week: 4, is_open: true, opening_time: '08:00', closing_time: '19:00', break_start_time: '12:30', break_end_time: '13:30' },
      { store_id: stores[1].id, day_of_week: 5, is_open: true, opening_time: '08:00', closing_time: '21:00' },
      { store_id: stores[1].id, day_of_week: 6, is_open: true, opening_time: '09:00', closing_time: '21:00' }
    ];

    await prisma.store_hours.createMany({
      data: storeHoursData,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${storeHoursData.length} store hours records`);    // 6. Create inventory alerts
    console.log('🚨 Creating inventory alerts...');
    const inventoryAlerts = await Promise.all([
      prisma.inventory_alert.create({
        data: {
          store_id: stores[0].id,
          product_id: 1,
          alert_type: 'LOW_STOCK',
          threshold_value: 10,
          current_value: 3,
          is_resolved: false,
          message: 'Premium Headphones running low on stock',
          priority: 'HIGH'
        }
      }),
      prisma.inventory_alert.create({
        data: {
          store_id: stores[0].id,
          product_id: 2,
          alert_type: 'OUT_OF_STOCK',
          threshold_value: 0,
          current_value: 0,
          is_resolved: false,
          message: 'Bluetooth Speaker is out of stock',
          priority: 'CRITICAL'
        }
      }),
      prisma.inventory_alert.create({
        data: {
          store_id: stores[1].id,
          product_id: 4,
          alert_type: 'LOW_STOCK',
          threshold_value: 15,
          current_value: 8,
          is_resolved: false,
          message: 'Gaming Mouse running low',
          priority: 'HIGH'
        }
      })
    ]);
    
    console.log(`✅ Created ${inventoryAlerts.length} inventory alerts`);    // 7. Create store reviews
    console.log('⭐ Creating store reviews...');
    const storeReviews = await Promise.all([
      prisma.store_review.create({
        data: {
          store_id: stores[0].id,
          user_id: customerUsers[0].id,
          order_id: orders[0].id,
          rating: 5,
          review_text: 'Excellent service and fast delivery! The headphones work perfectly.',
          is_verified: true,
          is_featured: true,
          helpful_count: 12
        }
      }),
      prisma.store_review.create({
        data: {
          store_id: stores[0].id,
          user_id: customerUsers[1].id,
          order_id: orders[1].id,
          rating: 4,
          review_text: 'Good quality products, but could improve packaging.',
          is_verified: true,
          is_featured: false,
          helpful_count: 8
        }
      }),
      prisma.store_review.create({
        data: {
          store_id: stores[1].id,
          user_id: customerUsers[2].id,
          order_id: orders[2].id,
          rating: 4,
          review_text: 'Fast shipping and good prices. Will order again.',
          is_verified: true,
          is_featured: false,
          helpful_count: 6
        }
      })
    ]);
    
    console.log(`✅ Created ${storeReviews.length} store reviews`);    // 8. Create dashboard notifications
    console.log('🔔 Creating dashboard notifications...');
    const notifications = await Promise.all([
      prisma.dashboard_notification.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          title: 'Low Stock Alert',
          message: 'Premium Headphones stock is running low (3 units remaining)',
          notification_type: 'INVENTORY_ALERT',
          is_read: false,
          is_urgent: true,
          action_url: '/inventory/product/1',
          action_text: 'Restock Now'
        }
      }),
      prisma.dashboard_notification.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          title: 'New Order Received',
          message: 'You have received a new order #ORD-2024-156 worth $299',
          notification_type: 'ORDER_UPDATE',
          is_read: false,
          is_urgent: false,
          action_url: '/orders/ORD-2024-156',
          action_text: 'View Order'
        }
      }),
      prisma.dashboard_notification.create({
        data: {
          seller_id: sellers[1].id,
          store_id: stores[1].id,
          title: 'Critical Stock Alert',
          message: 'Gaming Mouse is completely out of stock',
          notification_type: 'INVENTORY_ALERT',
          is_read: false,
          is_urgent: true,
          action_url: '/inventory/product/4',
          action_text: 'Restock Immediately'
        }
      })
    ]);
    
    console.log(`✅ Created ${notifications.length} notifications`);    // 9. Create dashboard action logs
    console.log('📋 Creating action logs...');
    const actionLogs = await Promise.all([
      prisma.dashboard_action_log.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          action_type: 'DASHBOARD_VIEWED',
          action_description: 'Seller viewed dashboard analytics',
          metadata: {
            page: 'analytics',
            duration_seconds: 45,
            filters_applied: ['date_range', 'store_1']
          },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      prisma.dashboard_action_log.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          action_type: 'PRODUCT_UPDATED',
          action_description: 'Updated Premium Headphones price from $299 to $279',
          metadata: {
            product_id: 1,
            old_price: 299,
            new_price: 279,
            reason: 'competitive_pricing'
          },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      prisma.dashboard_action_log.create({
        data: {
          seller_id: sellers[1].id,
          store_id: stores[1].id,
          action_type: 'ORDER_STATUS_CHANGED',
          action_description: 'Changed order #ORD-2024-145 status from PENDING to ACCEPTED',
          metadata: {
            order_id: 'ORD-2024-145',
            old_status: 'PENDING',
            new_status: 'ACCEPTED',
            processing_time_minutes: 12
          },
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      })
    ]);
    
    console.log(`✅ Created ${actionLogs.length} action logs`);

    console.log('🎉 Seller Dashboard seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Sellers: ${sellers.length}`);
    console.log(`- Analytics Records: ${analyticsData.length}`);
    console.log(`- Sales Reports: ${salesReports.length}`);
    console.log(`- Store Performance: ${storePerformance.length}`);
    console.log(`- Store Hours: ${storeHoursData.length}`);
    console.log(`- Inventory Alerts: ${inventoryAlerts.length}`);
    console.log(`- Store Reviews: ${storeReviews.length}`);
    console.log(`- Notifications: ${notifications.length}`);
    console.log(`- Action Logs: ${actionLogs.length}`);

  } catch (error) {
    console.error('❌ Error seeding seller dashboard data:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedSellerDashboard();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedSellerDashboard };
