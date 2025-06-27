# Support Ticket & Mail System Documentation

## Overview

This document provides comprehensive information about the support ticket and mail notification system implemented for the e-commerce platform. The system allows users to create support tickets, receive email notifications, and enables support staff to manage and respond to customer inquiries effectively.

## 🗄️ Database Models

### Support Ticket Models

#### `support_ticket`
The main ticket entity with the following key fields:
- `ticket_number`: Unique identifier (format: TKT-YYYY-XXXXXX)
- `user_id`, `seller_id`, `store_id`: Optional relations to users/sellers/stores
- `subject`, `description`: Ticket content
- `category`: Enum (TECHNICAL_ISSUE, BILLING, ACCOUNT, PRODUCT, ORDER, PAYMENT, GENERAL, FEATURE_REQUEST, BUG_REPORT)
- `priority`: Enum (LOW, MEDIUM, HIGH, URGENT, CRITICAL)
- `status`: Enum (OPEN, IN_PROGRESS, WAITING_FOR_RESPONSE, RESOLVED, CLOSED, REOPENED)
- `contact_email`, `contact_name`, `contact_phone`: Contact information
- `browser_info`, `device_info`, `ip_address`, etc.: Technical metadata
- `assigned_to`: Support agent assignment
- `resolution`, `resolution_date`: Resolution information

#### `ticket_response`
Ticket responses/comments with:
- `ticket_id`: Foreign key to support_ticket
- `message`: Response content
- `is_internal`: Flag for internal notes vs customer-facing responses
- `is_from_customer`: Flag indicating if response is from customer or support
- `author_type`, `author_name`, `author_email`: Author information
- `attachments`: JSON field for file attachments

#### `ticket_email_log`
Email notification tracking with:
- `ticket_id`: Foreign key to support_ticket
- `email_type`: Type of notification (ticket_created, response_added, status_changed)
- `recipient_email`, `subject`, `body`: Email details
- `status`: Send status (pending, sent, failed)
- `error_message`: Error details if sending failed

#### `ticket_template`
Pre-defined response templates with:
- `name`: Template name
- `category`: Associated ticket category
- `subject_template`, `body_template`: Template content with placeholders
- `is_active`: Enable/disable template

## 📧 Mail System

### Features
- Automated email notifications for:
  - Ticket creation (to customer and support team)
  - New responses added
  - Status changes
  - Ticket resolution
- HTML email templates with professional styling
- Email delivery tracking and logging
- Error handling and retry logic
- Template-based notifications with variable substitution

### Configuration
Email service is configured in `support_ticket_mail.ts` using Nodemailer. Update environment variables:
```
SMTP_HOST=your.smtp.host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SUPPORT_EMAIL=support@yourcompany.com
```

## 🔧 API Endpoints

### Ticket Management
- `POST /api/support/tickets` - Create new ticket
- `GET /api/support/tickets` - List tickets (with filtering and pagination)
- `GET /api/support/tickets/:id` - Get specific ticket
- `GET /api/support/tickets/number/:ticketNumber` - Get ticket by number
- `PUT /api/support/tickets/:id/status` - Update ticket status

### Responses
- `POST /api/support/tickets/:id/responses` - Add response to ticket
- `GET /api/support/tickets/:id/responses` - Get ticket responses

### Templates and Statistics
- `GET /api/support/templates` - Get response templates
- `POST /api/support/templates` - Create template
- `GET /api/support/stats` - Get ticket statistics
- `GET /api/support/tickets/:id/email-logs` - Get email logs for ticket

## 🌱 Seed Data

### Running the Seed Script

The system includes comprehensive seed data for testing and development:

```bash
# Seed support ticket data
npm run seed:support-tickets

# Clean existing data
npm run seed:support-tickets clean

# Reset (clean + reseed)
npm run seed:support-tickets reset
```

### What Gets Seeded

1. **Ticket Templates** (6 templates):
   - Product Not Working
   - Order Delivery Issue
   - Payment Issue
   - Account Access Problem
   - Technical Issue
   - Feature Request

2. **Test Users** (3 users):
   - customer1@example.com (Alice Johnson)
   - customer2@example.com (Bob Wilson)
   - support@example.com (Support Agent)

3. **Test Store**:
   - TechWorld Electronics

4. **Sample Tickets** (5 tickets):
   - Payment failure issue (OPEN)
   - Damaged product (IN_PROGRESS)
   - Account locked (RESOLVED)
   - Website slow loading (OPEN)
   - Feature request (WAITING_FOR_RESPONSE)

5. **Ticket Responses** (7 responses):
   - Support and customer responses
   - Internal notes
   - Attachments examples

6. **Email Logs** (6 email logs):
   - Successful and failed email examples
   - Different notification types

## 📊 Ticket Categories & Priorities

### Categories
- **TECHNICAL_ISSUE**: Website bugs, app crashes, loading issues
- **BILLING**: Billing inquiries, invoice issues, subscription problems
- **ACCOUNT**: Account access, password reset, profile issues
- **PRODUCT**: Product defects, quality issues, returns
- **ORDER**: Order status, delivery issues, order modifications
- **PAYMENT**: Payment failures, refunds, payment method issues
- **GENERAL**: General inquiries and support requests
- **FEATURE_REQUEST**: New feature suggestions and improvements
- **BUG_REPORT**: Software bugs and technical problems

### Priority Levels
- **LOW**: Non-urgent (regular business hours)
- **MEDIUM**: Standard priority (24-48 hours)
- **HIGH**: Important issues (12-24 hours)
- **URGENT**: Critical issues (4-8 hours)
- **CRITICAL**: System-breaking (1-2 hours)

### Status Types
- **OPEN**: New ticket, awaiting initial response
- **IN_PROGRESS**: Being actively worked on
- **WAITING_FOR_RESPONSE**: Awaiting customer response
- **RESOLVED**: Issue resolved, awaiting confirmation
- **CLOSED**: Completed and closed
- **REOPENED**: Previously resolved ticket reopened

## 🚀 Integration

### Adding to Main Server

To integrate the support ticket API with your main Express server:

```typescript
// In your main index.ts or app.ts
import supportTicketRoutes from './support_ticket_api';

app.use('/api/support', supportTicketRoutes);
```

### Frontend Integration

The API provides RESTful endpoints that can be consumed by any frontend framework. Example usage:

```javascript
// Create a new ticket
const response = await fetch('/api/support/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Payment Issue',
    description: 'Unable to process payment',
    category: 'PAYMENT',
    priority: 'HIGH',
    contact_email: 'customer@example.com',
    contact_name: 'John Doe'
  })
});

// Get tickets with filtering
const tickets = await fetch('/api/support/tickets?status=OPEN&category=PAYMENT&page=1&limit=10');
```

## 🔐 Security & Permissions

### Access Control
- Customers can only view their own tickets
- Support staff can view all tickets
- Admin users have full access to all functionality
- Anonymous tickets are supported for non-registered users

### Data Validation
- All inputs are validated using Zod schemas
- Email addresses are verified
- File uploads are restricted by type and size
- SQL injection protection via Prisma

## 📈 Monitoring & Analytics

### Available Statistics
- Total tickets by status
- Tickets by category and priority
- Average response time
- Resolution time metrics
- Customer satisfaction tracking
- Agent performance metrics

### Email Tracking
- Delivery status for all notifications
- Failed email alerts
- Bounce and spam tracking
- Click-through rates (if implemented)

## 🛠️ Customization

### Email Templates
Modify templates in `support_ticket_mail.ts` to match your brand:
- Update colors, fonts, and styling
- Add company logo and branding
- Customize message content
- Add additional template variables

### Ticket Fields
Extend the ticket model to include:
- Custom fields for specific business needs
- Additional metadata
- Integration with external systems
- Custom validation rules

### Automation
Implement automated workflows:
- Auto-assignment based on category
- SLA monitoring and alerts
- Escalation rules
- Auto-responses for common issues

## 📋 Testing

### Manual Testing
1. Create test tickets using the API
2. Verify email notifications are sent
3. Test response functionality
4. Validate status changes
5. Check filtering and pagination

### Automated Testing
Consider implementing:
- Unit tests for API endpoints
- Integration tests for email sending
- End-to-end tests for ticket workflows
- Performance tests for large datasets

## 🐛 Troubleshooting

### Common Issues
1. **Emails not sending**: Check SMTP configuration and credentials
2. **Database errors**: Ensure migrations are up to date
3. **Permission denied**: Verify user roles and access controls
4. **Slow queries**: Check database indexes and query optimization

### Debug Mode
Enable detailed logging by setting:
```
DEBUG=support-tickets:*
LOG_LEVEL=debug
```

## 📚 Resources

### Files
- `db/prisma/schema.prisma` - Database schema
- `support_ticket_api.ts` - API routes and controllers
- `support_ticket_mail.ts` - Email service
- `db/seed/seed_support_ticket_data.ts` - Seed script
- `support_ticket_test_data.json` - Test data reference
- `seed_support_tickets.ts` - Seed runner script

### Dependencies
- `@prisma/client` - Database ORM
- `express` - Web framework
- `nodemailer` - Email service
- `zod` - Input validation
- `jsonwebtoken` - Authentication (if applicable)

### External Services
- SMTP server for email delivery
- File storage for attachments (if implemented)
- Analytics service for metrics (optional)

---

**Note**: This system is designed to be production-ready but may require additional customization based on specific business requirements. Always test thoroughly in a staging environment before deploying to production.
