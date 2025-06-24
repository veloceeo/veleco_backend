# Seller Dashboard API Testing Guide

## Setup Instructions

### 1. Prerequisites
- Node.js and npm/bun installed
- PostgreSQL database running
- Environment variables configured
- Authentication token available

### 2. Database Migration & Seeding
```bash
# Run Prisma migration
npx prisma migrate dev --name seller_dashboard

# Generate Prisma client
npx prisma generate

# Seed the database with test data
npx ts-node seed_seller_dashboard.ts
```

### 3. Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"
JWT_SECRET="your_jwt_secret_here"
PORT=3000
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

## API Endpoints Testing

### 1. SELLER MANAGEMENT

#### Create Seller Profile
```bash
curl -X POST http://localhost:3000/api/seller-dashboard/seller/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+1-555-9999",
    "business_license": "BL-2024-TEST",
    "tax_id": "TAX-TEST-2024"
  }'
```

**Expected Response:**
```json
{
  "message": "Seller profile created successfully",
  "seller": {
    "id": 1,
    "user_id": 1,
    "phone": "+1-555-9999",
    "business_license": "BL-2024-TEST",
    "tax_id": "TAX-TEST-2024",
    "is_verified": false,
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### Get Seller Profile
```bash
curl -X GET http://localhost:3000/api/seller-dashboard/seller/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Seller Profile
```bash
curl -X PUT http://localhost:3000/api/seller-dashboard/seller/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+1-555-0000",
    "is_verified": true
  }'
```

### 2. ANALYTICS

#### Get Dashboard Analytics
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard/analytics/dashboard?store_id=1&date=2024-06-24" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Dashboard analytics fetched successfully",
  "analytics": {
    "id": 1,
    "seller_id": 1,
    "store_id": 1,
    "date": "2024-06-24T00:00:00.000Z",
    "daily_sales_amount": 12500,
    "daily_orders_count": 25,
    "daily_revenue": 10000,
    "total_products_sold": 78,
    "total_customers_served": 23,
    "average_order_value": 500.0,
    "inventory_count": 245
  }
}
```

#### Get Analytics Range
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard/analytics/range?store_id=1&start_date=2024-06-17&end_date=2024-06-24" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. SALES REPORTS

#### Generate Daily Report
```bash
curl -X POST http://localhost:3000/api/seller-dashboard/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "store_id": 1,
    "report_type": "DAILY",
    "custom_data": {
      "include_charts": true,
      "weather_impact": "sunny"
    }
  }'
```

#### Generate Custom Report
```bash
curl -X POST http://localhost:3000/api/seller-dashboard/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "store_id": 1,
    "report_type": "CUSTOM",
    "start_date": "2024-06-01",
    "end_date": "2024-06-24",
    "custom_data": {
      "comparison_period": "previous_month"
    }
  }'
```

#### Get All Reports
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard/reports?store_id=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. STORE PERFORMANCE

#### Get Store Performance
```bash
curl -X GET http://localhost:3000/api/seller-dashboard/performance/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Store performance fetched successfully",
  "performance": {
    "id": 1,
    "store_id": 1,
    "total_lifetime_sales": 1250000,
    "total_lifetime_orders": 2847,
    "total_customers": 1523,
    "average_rating": 4.7,
    "total_reviews": 342,
    "inventory_turnover_rate": 12.5,
    "monthly_growth_rate": 15.8,
    "customer_retention_rate": 68.5
  }
}
```

#### Update Store Performance
```bash
curl -X PUT http://localhost:3000/api/seller-dashboard/performance/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "monthly_growth_rate": 18.5,
    "customer_retention_rate": 75.2
  }'
```

### 5. STORE HOURS

#### Get Store Hours
```bash
curl -X GET http://localhost:3000/api/seller-dashboard-extended/store-hours/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Store Hours
```bash
curl -X PUT http://localhost:3000/api/seller-dashboard-extended/store-hours/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "hours": [
      {
        "day_of_week": 1,
        "is_open": true,
        "opening_time": "08:00",
        "closing_time": "20:00",
        "break_start_time": "12:00",
        "break_end_time": "13:00"
      },
      {
        "day_of_week": 0,
        "is_open": false
      }
    ]
  }'
```

### 6. INVENTORY ALERTS

#### Get All Alerts
```bash
curl -X GET http://localhost:3000/api/seller-dashboard-extended/alerts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Critical Alerts Only
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard-extended/alerts/1?priority=CRITICAL&is_resolved=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Alert
```bash
curl -X POST http://localhost:3000/api/seller-dashboard-extended/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "store_id": 1,
    "product_id": 1,
    "alert_type": "LOW_STOCK",
    "threshold_value": 5,
    "message": "Product running low on stock",
    "priority": "HIGH"
  }'
```

#### Resolve Alert
```bash
curl -X PUT http://localhost:3000/api/seller-dashboard-extended/alerts/1/resolve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. STORE REVIEWS

#### Get All Reviews
```bash
curl -X GET http://localhost:3000/api/seller-dashboard-extended/reviews/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get 5-Star Reviews
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard-extended/reviews/1?rating=5&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Feature a Review
```bash
curl -X PUT http://localhost:3000/api/seller-dashboard-extended/reviews/1/feature \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "is_featured": true
  }'
```

### 8. NOTIFICATIONS

#### Get All Notifications
```bash
curl -X GET http://localhost:3000/api/seller-dashboard-extended/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Urgent Unread Notifications
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard-extended/notifications?is_urgent=true&is_read=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Notification
```bash
curl -X POST http://localhost:3000/api/seller-dashboard-extended/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "store_id": 1,
    "title": "Flash Sale Alert",
    "message": "Your 24-hour flash sale starts in 1 hour!",
    "notification_type": "PROMOTION",
    "is_urgent": true,
    "action_url": "/promotions/flash-sale",
    "action_text": "View Sale Details"
  }'
```

#### Mark Notification as Read
```bash
curl -X PUT http://localhost:3000/api/seller-dashboard-extended/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Mark All as Read
```bash
curl -X PUT http://localhost:3000/api/seller-dashboard-extended/notifications/read-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "store_id": 1
  }'
```

### 9. ACTION LOGS

#### Log an Action
```bash
curl -X POST http://localhost:3000/api/seller-dashboard-extended/actions/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "store_id": 1,
    "action_type": "PRODUCT_UPDATED",
    "action_description": "Updated product price for competitive advantage",
    "metadata": {
      "product_id": 1,
      "old_price": 299,
      "new_price": 279,
      "reason": "competitor_pricing"
    }
  }'
```

#### Get Action Logs
```bash
curl -X GET http://localhost:3000/api/seller-dashboard-extended/actions/logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Logs by Action Type
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard-extended/actions/logs?action_type=PRODUCT_UPDATED&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Logs by Date Range
```bash
curl -X GET "http://localhost:3000/api/seller-dashboard-extended/actions/logs?start_date=2024-06-20&end_date=2024-06-24&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Test Scenarios

### Scenario 1: New Seller Onboarding
1. Create seller profile
2. Get initial dashboard analytics (should create if not exists)
3. Set up store hours
4. Generate first daily report

### Scenario 2: Daily Operations
1. Check unread notifications
2. View dashboard analytics for today
3. Check critical inventory alerts
4. Review new customer reviews
5. Log actions performed

### Scenario 3: Weekly Review
1. Generate weekly sales report
2. Check store performance metrics
3. Review analytics for the past 7 days
4. Mark all notifications as read

### Scenario 4: Alert Management
1. Create low stock alert
2. Check all unresolved alerts
3. Resolve specific alerts
4. Create notification for resolved alerts

### Scenario 5: Performance Analysis
1. Generate monthly report
2. Compare with previous month
3. Update store performance manually
4. Feature positive reviews

## Error Testing

### Test Invalid Data
```bash
# Missing required fields
curl -X POST http://localhost:3000/api/seller-dashboard/seller/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "business_license": "BL-2024-TEST"
  }'
```

### Test Unauthorized Access
```bash
# No token
curl -X GET http://localhost:3000/api/seller-dashboard/seller/profile
```

### Test Non-existent Resources
```bash
# Non-existent store
curl -X GET "http://localhost:3000/api/seller-dashboard/analytics/dashboard?store_id=999" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Testing

### Load Testing Commands
```bash
# Concurrent dashboard views
for i in {1..10}; do
  curl -X GET "http://localhost:3000/api/seller-dashboard/analytics/dashboard?store_id=1" \
    -H "Authorization: Bearer YOUR_TOKEN" &
done
wait

# Bulk report generation
curl -X POST http://localhost:3000/api/seller-dashboard/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "store_id": 1,
    "report_type": "YEARLY"
  }'
```

## Monitoring & Debugging

### Check Database State
```sql
-- Count records in each table
SELECT 'sellers' as table_name, COUNT(*) as count FROM seller
UNION ALL
SELECT 'analytics', COUNT(*) FROM seller_analytics
UNION ALL
SELECT 'reports', COUNT(*) FROM sales_report
UNION ALL
SELECT 'alerts', COUNT(*) FROM inventory_alert
UNION ALL
SELECT 'notifications', COUNT(*) FROM dashboard_notification;
```

### View Recent Actions
```sql
SELECT * FROM dashboard_action_log 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Issues & Solutions

### 1. Prisma Client Not Found
```bash
npx prisma generate
```

### 2. Migration Issues
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### 3. Authentication Failures
- Check JWT token validity
- Verify middleware implementation
- Check user permissions

### 4. Foreign Key Constraints
- Ensure referenced records exist
- Check relationship definitions in schema
- Use appropriate IDs in requests

## Success Criteria

✅ All endpoints return expected status codes  
✅ Response formats match specifications  
✅ Authentication works correctly  
✅ Data relationships are maintained  
✅ Error handling works properly  
✅ Performance is acceptable (< 2s for most operations)  
✅ Database constraints are enforced  
✅ Pagination works for large datasets  
✅ Filtering and sorting work correctly  
✅ Analytics calculations are accurate
