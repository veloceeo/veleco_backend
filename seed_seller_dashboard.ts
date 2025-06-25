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
         
          monthly_growth_rate: 12.3,
          customer_retention_rate: 72.1
        }
      })
    ]);
    
    console.log(`✅ Created ${storePerformance.length} store performance records`);

    // 5. Create store hours
    console.log('🕐 Creating store hours...');
    const storeHoursData = [
      // Store 1 hours (closed Sunday)
      { store_id: stores[0].id, day: 'Monday', open_time: '09:00', close_time: '18:00' },
      { store_id: stores[0].id, day: 'Tuesday', open_time: '09:00', close_time: '18:00' },
      { store_id: stores[0].id, day: 'Wednesday', open_time: '09:00', close_time: '18:00' },
      { store_id: stores[0].id, day: 'Thursday', open_time: '09:00', close_time: '18:00' },
      { store_id: stores[0].id, day: 'Friday', open_time: '09:00', close_time: '20:00' },
      { store_id: stores[0].id, day: 'Saturday', open_time: '10:00', close_time: '20:00' },
      
      // Store 2 hours (open all days)
      { store_id: stores[1].id, day: 'Sunday', open_time: '11:00', close_time: '17:00' },
      { store_id: stores[1].id, day: 'Monday', open_time: '08:00', close_time: '19:00' },
      { store_id: stores[1].id, day: 'Tuesday', open_time: '08:00', close_time: '19:00' },
      { store_id: stores[1].id, day: 'Wednesday', open_time: '08:00', close_time: '19:00' },
      { store_id: stores[1].id, day: 'Thursday', open_time: '08:00', close_time: '19:00' },
      { store_id: stores[1].id, day: 'Friday', open_time: '08:00', close_time: '21:00' },
      { store_id: stores[1].id, day: 'Saturday', open_time: '09:00', close_time: '21:00' }
    ];

    await prisma.store_hours.createMany({
      data: storeHoursData,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${storeHoursData.length} store hours records`);

    // 6. Create inventory alerts
    console.log('🚨 Creating inventory alerts...');
    const inventoryAlerts = await Promise.all([
      prisma.inventory_alert.create({
        data: {
          store_id: stores[0].id,
          product_id: 1,
          alert_type: 'LOW_STOCK',
          priority: 'HIGH',
          message: 'Premium Headphones running low on stock'
        }
      }),
      prisma.inventory_alert.create({
        data: {
          store_id: stores[0].id,
          product_id: 2,
          alert_type: 'OUT_OF_STOCK',
          priority: 'CRITICAL',
          message: 'Bluetooth Speaker is out of stock'
        }
      }),
      prisma.inventory_alert.create({
        data: {
          store_id: stores[1].id,
          product_id: 4,
          alert_type: 'LOW_STOCK',
          priority: 'HIGH',
          message: 'Gaming Mouse running low'
        }
      })
    ]);
    
    console.log(`✅ Created ${inventoryAlerts.length} inventory alerts`);

    // 7. Create store reviews
    console.log('⭐ Creating store reviews...');
    const storeReviews = await Promise.all([
      prisma.store_review.create({
        data: {
          store_id: stores[0].id,
          user_id: customerUsers[0].id,
          order_id: orders[0].id,
          rating: 5,
          comment: 'Excellent service and fast delivery! The headphones work perfectly.'
        }
      }),
      prisma.store_review.create({
        data: {
          store_id: stores[0].id,
          user_id: customerUsers[1].id,
          order_id: orders[1].id,
          rating: 4,
          comment: 'Good quality products, but could improve packaging.'
        }
      }),
      prisma.store_review.create({
        data: {
          store_id: stores[1].id,
          user_id: customerUsers[2].id,
          order_id: orders[2].id,
          rating: 4,
          comment: 'Fast shipping and good prices. Will order again.'
        }
      })
    ]);
    
    console.log(`✅ Created ${storeReviews.length} store reviews`);

    // 8. Create seller settlements
    console.log('💰 Creating seller settlements...');
    const settlements = await Promise.all([
      prisma.seller_settlement.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          settlement_period_start: new Date('2024-06-01T00:00:00Z'),
          settlement_period_end: new Date('2024-06-07T23:59:59Z'),
          total_sales_amount: 12500.00,
          platform_commission: 625.00, // 5% commission
          tax_deduction: 375.00, // 3% tax
          other_deductions: 50.00,
          net_settlement_amount: 11450.00,
          status: 'COMPLETED',
          payment_method: 'BANK_TRANSFER',
          transaction_reference: 'TXN-2024-001',
          settled_at: new Date('2024-06-08T10:30:00Z')
        }
      }),
      prisma.seller_settlement.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          settlement_period_start: new Date('2024-06-08T00:00:00Z'),
          settlement_period_end: new Date('2024-06-14T23:59:59Z'),
          total_sales_amount: 8750.00,
          platform_commission: 437.50,
          tax_deduction: 262.50,
          other_deductions: 25.00,
          net_settlement_amount: 8025.00,
          status: 'PENDING',
          payment_method: 'UPI'
        }
      }),
      prisma.seller_settlement.create({
        data: {
          seller_id: sellers[1].id,
          store_id: stores[1].id,
          settlement_period_start: new Date('2024-06-01T00:00:00Z'),
          settlement_period_end: new Date('2024-06-07T23:59:59Z'),
          total_sales_amount: 15600.00,
          platform_commission: 780.00,
          tax_deduction: 468.00,
          other_deductions: 75.00,
          net_settlement_amount: 14277.00,
          status: 'COMPLETED',
          payment_method: 'BANK_TRANSFER',
          transaction_reference: 'TXN-2024-002',
          settled_at: new Date('2024-06-08T14:15:00Z')
        }
      })
    ]);
    
    console.log(`✅ Created ${settlements.length} settlements`);

    // 9. Create settlement details
    console.log('📋 Creating settlement details...');
    const settlementDetails = await Promise.all([
      prisma.settlement_detail.create({
        data: {
          settlement_id: settlements[0].id,
          order_id: orders[0].id,
          order_amount: 299.00,
          commission_rate: 5.0,
          commission_amount: 14.95,
          tax_amount: 8.97,
          net_amount: 275.08
        }
      }),
      prisma.settlement_detail.create({
        data: {
          settlement_id: settlements[0].id,
          order_id: orders[1].id,
          order_amount: 149.00,
          commission_rate: 5.0,
          commission_amount: 7.45,
          tax_amount: 4.47,
          net_amount: 137.08
        }
      }),
      prisma.settlement_detail.create({
        data: {
          settlement_id: settlements[2].id,
          order_id: orders[2].id,
          order_amount: 79.00,
          commission_rate: 5.0,
          commission_amount: 3.95,
          tax_amount: 2.37,
          net_amount: 72.68
        }
      })
    ]);
    
    console.log(`✅ Created ${settlementDetails.length} settlement details`);

    // 10. Create seller payments
    console.log('💳 Creating seller payments...');
    const payments = await Promise.all([
      prisma.seller_payment.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          settlement_id: settlements[0].id,
          amount: 11450.00,
          payment_method: 'BANK_TRANSFER',
          status: 'COMPLETED',
          transaction_reference: 'PAY-TXN-2024-001',
          payment_date: new Date('2024-06-08T10:30:00Z'),
          due_date: new Date('2024-06-08T00:00:00Z'),
          description: 'Weekly settlement payment for Tech Electronics Store'
        }
      }),
      prisma.seller_payment.create({
        data: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          settlement_id: settlements[1].id,
          amount: 8025.00,
          payment_method: 'UPI',
          status: 'PENDING',
          due_date: new Date('2024-06-15T00:00:00Z'),
          description: 'Weekly settlement payment for Tech Electronics Store'
        }
      }),
      prisma.seller_payment.create({
        data: {
          seller_id: sellers[1].id,
          store_id: stores[1].id,
          settlement_id: settlements[2].id,
          amount: 14277.00,
          payment_method: 'BANK_TRANSFER',
          status: 'COMPLETED',
          transaction_reference: 'PAY-TXN-2024-002',
          payment_date: new Date('2024-06-08T14:15:00Z'),
          due_date: new Date('2024-06-08T00:00:00Z'),
          description: 'Weekly settlement payment for Gaming Gear Hub'
        }
      }),
      // Add a failed payment example
      prisma.seller_payment.create({
        data: {
          seller_id: sellers[1].id,
          store_id: stores[1].id,
          amount: 5200.00,
          payment_method: 'BANK_TRANSFER',
          status: 'FAILED',
          due_date: new Date('2024-06-10T00:00:00Z'),
          description: 'Manual settlement payment',
          failure_reason: 'Bank account details incorrect',
          metadata: {
            attempt_count: 3,
            last_attempt: '2024-06-10T15:30:00Z',
            error_code: 'INVALID_ACCOUNT'
          }
        }
      })
    ]);
    
    console.log(`✅ Created ${payments.length} payments`);    // 11. Create seller balance records
    console.log('💰 Creating seller balance records...');
    const balances = await Promise.all([
      prisma.seller_balance.upsert({
        where: {
          store_id: stores[0].id
        },
        update: {},
        create: {
          seller_id: sellers[0].id,
          store_id: stores[0].id,
          available_amount: 0.00,
          pending_amount: 8025.00,
          total_withdrawals: 114524.25,
          last_settlement_date: new Date('2024-06-08T10:30:00Z'),
          next_settlement_date: new Date('2024-06-15T00:00:00Z')
        }
      }),
      prisma.seller_balance.upsert({
        where: {
          store_id: stores[1].id
        },
        update: {},
        create: {
          seller_id: sellers[1].id,
          store_id: stores[1].id,
          available_amount: 0.00,
          pending_amount: 0.00,
          total_withdrawals: 88249.50,
          last_settlement_date: new Date('2024-06-08T14:15:00Z'),
          next_settlement_date: new Date('2024-06-15T00:00:00Z')
        }
      })
    ]);    
    console.log(`✅ Created ${balances.length} balance records`);

    console.log('🎉 Seller Dashboard seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Sellers: ${sellers.length}`);
    console.log(`- Analytics Records: ${analyticsData.length}`);
    console.log(`- Sales Reports: ${salesReports.length}`);
    console.log(`- Store Performance: ${storePerformance.length}`);
    console.log(`- Store Hours: ${storeHoursData.length}`);
    console.log(`- Inventory Alerts: ${inventoryAlerts.length}`);
    console.log(`- Store Reviews: ${storeReviews.length}`);
    console.log(`- Settlements: ${settlements.length}`);
    console.log(`- Settlement Details: ${settlementDetails.length}`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`- Balances: ${balances.length}`);

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
