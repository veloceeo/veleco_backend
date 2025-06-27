# Support Ticket API Endpoints - Quick Start Guide

## 🚀 Overview

The Support Ticket API provides comprehensive endpoints for managing customer support tickets, email notifications, and response templates. This guide shows you how to integrate and use all the endpoints.

## 📋 Available Endpoints

### Base URL: `/api/support`

| Method | Endpoint | Description | Access Level |
|--------|----------|-------------|--------------|
| `POST` | `/tickets` | Create new support ticket | Public |
| `GET` | `/tickets` | List tickets (with filtering) | Private |
| `GET` | `/tickets/:id` | Get specific ticket | Private |
| `POST` | `/tickets/:ticketId/responses` | Add response to ticket | Private |
| `PATCH` | `/tickets/:ticketId/status` | Update ticket status | Private |
| `GET` | `/tickets/:ticketId/email-logs` | Get email logs for ticket | Private |
| `GET` | `/stats` | Get ticket statistics | Private |
| `GET` | `/templates` | Get response templates | Private |
| `POST` | `/templates` | Create response template | Private |
| `GET` | `/health` | Health check | Public |
| `GET` | `/` | API information | Public |

## 🛠️ Integration Steps

### 1. Add to Your Express Server

```typescript
// In your main server file (index.ts or app.ts)
import express from 'express';
import supportTicketRoutes from './support_ticket_routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount support ticket routes
app.use('/api/support', supportTicketRoutes);

app.listen(3000, () => {
  console.log('Server running with Support Ticket API');
});
```

### 2. Environment Variables

Make sure you have these environment variables set for email functionality:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SUPPORT_EMAIL="support@yourcompany.com"
```

### 3. Run Database Migrations

```bash
# Generate Prisma client
npm run generate

# Run migrations
npm run db

# Seed sample data
npm run seed:support-tickets
```

## 📝 API Usage Examples

### Create a Support Ticket

```bash
curl -X POST http://localhost:3000/api/support/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Payment issue with order",
    "description": "I am unable to complete my payment. The page shows an error.",
    "category": "PAYMENT",
    "priority": "HIGH",
    "contact_name": "John Doe",
    "contact_email": "john@example.com",
    "contact_phone": "+1-555-0123",
    "browser_info": "Chrome 120.0.0.0",
    "device_info": "Desktop - Windows 11",
    "page_url": "https://yourstore.com/checkout"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "ticket": {
    "id": 1,
    "ticket_number": "TKT-2024-ABC123",
    "subject": "Payment issue with order",
    "category": "PAYMENT",
    "priority": "HIGH",
    "status": "OPEN",
    "created_at": "2024-01-15T10:30:00Z",
    "contact_email": "john@example.com"
  }
}
```

### Get All Tickets (with filtering)

```bash
# Get all tickets
curl http://localhost:3000/api/support/tickets

# Get tickets with filters
curl "http://localhost:3000/api/support/tickets?status=OPEN&category=PAYMENT&page=1&limit=10"

# Search tickets
curl "http://localhost:3000/api/support/tickets?search=payment%20issue"
```

**Response:**
```json
{
  "tickets": [
    {
      "id": 1,
      "ticket_number": "TKT-2024-ABC123",
      "subject": "Payment issue with order",
      "category": "PAYMENT",
      "priority": "HIGH",
      "status": "OPEN",
      "contact_email": "john@example.com",
      "created_at": "2024-01-15T10:30:00Z",
      "responses": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Get Specific Ticket

```bash
# By ID
curl http://localhost:3000/api/support/tickets/1

# By ticket number
curl http://localhost:3000/api/support/tickets/TKT-2024-ABC123
```

### Add Response to Ticket

```bash
curl -X POST http://localhost:3000/api/support/tickets/1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Thank you for contacting us. We are looking into your payment issue and will respond within 24 hours.",
    "is_internal": false,
    "is_from_customer": false,
    "author_type": "support",
    "author_name": "Support Agent",
    "author_email": "support@yourstore.com"
  }'
```

### Update Ticket Status

```bash
curl -X PATCH http://localhost:3000/api/support/tickets/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED",
    "resolution": "Payment issue resolved by updating payment processor settings",
    "assigned_to": "support@yourstore.com"
  }'
```

### Get Ticket Statistics

```bash
curl http://localhost:3000/api/support/stats
```

**Response:**
```json
{
  "total_tickets": 25,
  "status_breakdown": {
    "open": 8,
    "in_progress": 5,
    "resolved": 10,
    "closed": 2
  },
  "urgent_tickets": 3,
  "category_breakdown": [
    { "category": "PAYMENT", "count": 8 },
    { "category": "TECHNICAL_ISSUE", "count": 6 },
    { "category": "PRODUCT", "count": 5 }
  ],
  "priority_breakdown": [
    { "priority": "HIGH", "count": 5 },
    { "priority": "MEDIUM", "count": 12 },
    { "priority": "LOW", "count": 8 }
  ]
}
```

## 📊 Data Models

### Ticket Categories
- `TECHNICAL_ISSUE` - Website bugs, app crashes
- `BILLING` - Billing inquiries, invoice issues
- `ACCOUNT` - Account access, password reset
- `PRODUCT` - Product defects, quality issues
- `ORDER` - Order status, delivery issues
- `PAYMENT` - Payment failures, refunds
- `GENERAL` - General inquiries
- `FEATURE_REQUEST` - New feature suggestions
- `BUG_REPORT` - Software bugs

### Priority Levels
- `LOW` - Non-urgent (response within regular business hours)
- `MEDIUM` - Standard priority (24-48 hours)
- `HIGH` - Important issues (12-24 hours)
- `URGENT` - Critical issues (4-8 hours)
- `CRITICAL` - System-breaking (1-2 hours)

### Status Types
- `OPEN` - New ticket, awaiting initial response
- `IN_PROGRESS` - Being actively worked on
- `WAITING_FOR_RESPONSE` - Awaiting customer response
- `RESOLVED` - Issue resolved, awaiting confirmation
- `CLOSED` - Completed and closed
- `REOPENED` - Previously resolved ticket reopened

## 🧪 Testing

### Run the Test Suite

```bash
# Start your server
npm start

# In another terminal, run the API tests
bun run support_ticket_api_tests.ts
```

### Manual Testing with curl

```bash
# Health check
curl http://localhost:3000/api/support/health

# API information
curl http://localhost:3000/api/support/

# Create test ticket
curl -X POST http://localhost:3000/api/support/tickets \
  -H "Content-Type: application/json" \
  -d @test_ticket_data.json
```

## 📧 Email Notifications

The system automatically sends email notifications for:

1. **Ticket Creation** - Confirmation to customer + alert to support team
2. **New Responses** - Customer notified when support responds
3. **Status Changes** - Customer notified when ticket status updates
4. **Resolution** - Customer notified when ticket is resolved

All emails are logged in the database and can be retrieved via the email logs endpoint.

## 🔐 Security Considerations

1. **Authentication** - Add authentication middleware before mounting routes
2. **Authorization** - Implement role-based access control
3. **Rate Limiting** - Add rate limiting to prevent abuse
4. **Input Validation** - All inputs are validated with Zod schemas
5. **SQL Injection** - Protected by Prisma ORM

### Example Authentication Middleware

```typescript
import { Router } from 'express';
import supportTicketRoutes from './support_ticket_routes';

const router = Router();

// Authentication middleware
const authenticateUser = (req: any, res: any, next: any) => {
  // Your authentication logic here
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // Verify token and add user to req.user
  next();
};

// Public routes (no auth required)
router.post('/tickets', supportTicketRoutes); // Ticket creation
router.get('/health', supportTicketRoutes); // Health check

// Protected routes (auth required)
router.use(authenticateUser);
router.use('/admin', supportTicketRoutes); // All other routes
```

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **Response Time** - Average time to first response
2. **Resolution Time** - Average time to resolve tickets
3. **Customer Satisfaction** - Follow-up surveys
4. **Agent Performance** - Tickets handled per agent
5. **Category Trends** - Most common issue types
6. **Email Delivery** - Success/failure rates

### Dashboard Queries

```sql
-- Average response time by category
SELECT category, AVG(EXTRACT(EPOCH FROM (last_response_at - created_at))/3600) as avg_hours
FROM support_ticket 
WHERE last_response_at IS NOT NULL 
GROUP BY category;

-- Tickets by priority and status
SELECT priority, status, COUNT(*) as count
FROM support_ticket 
GROUP BY priority, status 
ORDER BY priority DESC, status;

-- Email delivery success rate
SELECT 
  email_type,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  ROUND(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM ticket_email_log 
GROUP BY email_type;
```

## 🛠️ Customization

### Add Custom Fields

To add custom fields to tickets, update the Prisma schema:

```prisma
model support_ticket {
  // ... existing fields
  
  // Custom fields
  order_number      String?
  product_id        Int?
  urgency_level     String?
  customer_tier     String?
  source_channel    String? // web, mobile, phone, email
}
```

### Custom Email Templates

Modify templates in `support_ticket_mail.ts`:

```typescript
const EMAIL_TEMPLATES = {
  // Add your custom templates
  orderIssue: {
    subject: (orderNumber: string) => `Order Issue: ${orderNumber}`,
    customerBody: (data: any) => `
      <!-- Your custom HTML email template -->
    `
  }
};
```

## 🚨 Error Handling

The API includes comprehensive error handling:

- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Ticket not found
- **409 Conflict** - Unique constraint violation
- **500 Internal Server Error** - Server errors

All errors are logged and include helpful error messages.

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Support Ticket System Guide](./SUPPORT_TICKET_SYSTEM_GUIDE.md)

---

**🎉 Your Support Ticket API is now ready to use!**

For additional help or questions, refer to the comprehensive documentation in `SUPPORT_TICKET_SYSTEM_GUIDE.md` or check the example files in your project directory.
