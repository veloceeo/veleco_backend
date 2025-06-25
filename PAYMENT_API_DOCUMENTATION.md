# Payment API Documentation

This document provides comprehensive documentation for all payment-related API endpoints in the E-Commerce seller dashboard system.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Settlement Endpoints](#settlement-endpoints)
5. [Settlement Detail Endpoints](#settlement-detail-endpoints)
6. [Payment Endpoints](#payment-endpoints)
7. [Balance Endpoints](#balance-endpoints)
8. [Analytics Endpoints](#analytics-endpoints)
9. [Data Models](#data-models)
10. [Usage Examples](#usage-examples)

## Overview

The Payment API provides comprehensive endpoints for managing:
- **Seller Settlements**: Periodic settlement calculations and processing
- **Settlement Details**: Individual order breakdowns within settlements
- **Seller Payments**: Payment records and transaction management
- **Seller Balances**: Account balance tracking and withdrawal processing
- **Payment Analytics**: Reporting and analytics for payment data

All endpoints are RESTful and return JSON responses. The API supports pagination, filtering, and comprehensive error handling.

## Authentication

All API endpoints require appropriate authentication. Include authentication headers as required by your system.

## Error Handling

All endpoints use consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (for deletions)
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Settlement Endpoints

### Create Settlement
**POST** `/api/payments/settlements`

Creates a new settlement record for a seller/store.

**Request Body:**
```json
{
  "seller_id": 1,
  "store_id": 1,
  "settlement_period_start": "2024-01-01T00:00:00Z",
  "settlement_period_end": "2024-01-31T23:59:59Z",
  "total_sales_amount": 10000,
  "platform_commission": 500,
  "tax_deduction": 200,
  "other_deductions": 50,
  "payment_method": "BANK_TRANSFER",
  "transaction_reference": "TXN123456"
}
```

**Response:**
```json
{
  "id": 1,
  "seller_id": 1,
  "store_id": 1,
  "net_settlement_amount": 9250,
  "status": "PENDING",
  "created_at": "2024-01-01T10:00:00Z",
  "seller": {...},
  "store": {...}
}
```

### Get All Settlements
**GET** `/api/payments/settlements`

Retrieves settlements with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `seller_id` (optional): Filter by seller ID
- `store_id` (optional): Filter by store ID
- `status` (optional): Filter by status (PENDING, PROCESSING, COMPLETED, FAILED, DISPUTED)
- `start_date` (optional): Filter by settlement period start date
- `end_date` (optional): Filter by settlement period end date

**Response:**
```json
{
  "settlements": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Get Settlement by ID
**GET** `/api/payments/settlements/:id`

Retrieves a specific settlement by ID.

### Update Settlement Status
**PUT** `/api/payments/settlements/:id/status`

Updates the status of a settlement.

**Request Body:**
```json
{
  "status": "COMPLETED",
  "transaction_reference": "TXN123456",
  "settled_at": "2024-01-02T10:00:00Z"
}
```

### Delete Settlement
**DELETE** `/api/payments/settlements/:id`

Deletes a settlement record.

## Settlement Detail Endpoints

### Create Settlement Detail
**POST** `/api/payments/settlement-details`

Creates a detailed breakdown for a specific order within a settlement.

**Request Body:**
```json
{
  "settlement_id": 1,
  "order_id": 100,
  "order_amount": 500,
  "commission_rate": 5.0,
  "tax_amount": 10
}
```

### Get Settlement Details
**GET** `/api/payments/settlements/:settlementId/details`

Retrieves all detail records for a specific settlement.

## Payment Endpoints

### Create Payment
**POST** `/api/payments/payments`

Creates a new payment record.

**Request Body:**
```json
{
  "seller_id": 1,
  "store_id": 1,
  "settlement_id": 1,
  "amount": 9250,
  "payment_method": "BANK_TRANSFER",
  "due_date": "2024-01-15T00:00:00Z",
  "description": "Settlement payment",
  "metadata": {}
}
```

### Get All Payments
**GET** `/api/payments/payments`

Retrieves payments with pagination and filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `seller_id`, `store_id`: Filter by seller/store
- `status`: Filter by payment status
- `payment_method`: Filter by payment method
- `start_date`, `end_date`: Filter by payment date range

### Get Payment by ID
**GET** `/api/payments/payments/:id`

Retrieves a specific payment by ID.

### Update Payment Status
**PUT** `/api/payments/payments/:id/status`

Updates payment status and related information.

**Request Body:**
```json
{
  "status": "COMPLETED",
  "transaction_reference": "TXN789",
  "payment_date": "2024-01-02T10:00:00Z",
  "failure_reason": null
}
```

### Bulk Update Payment Status
**PUT** `/api/payments/payments/bulk-status`

Updates multiple payments at once.

**Request Body:**
```json
{
  "payment_ids": [1, 2, 3],
  "status": "COMPLETED",
  "transaction_reference": "BULK_TXN123"
}
```

### Delete Payment
**DELETE** `/api/payments/payments/:id`

Deletes a payment record.

## Balance Endpoints

### Get Seller Balance
**GET** `/api/payments/sellers/:sellerId/stores/:storeId/balance`

Retrieves current balance information for a seller/store.

**Response:**
```json
{
  "id": 1,
  "seller_id": 1,
  "store_id": 1,
  "pending_amount": 5000,
  "available_amount": 15000,
  "total_lifetime_earnings": 50000,
  "total_withdrawals": 30000,
  "commission_rate": 5.0,
  "last_settlement_date": "2024-01-01T00:00:00Z",
  "next_settlement_date": "2024-02-01T00:00:00Z"
}
```

### Process Withdrawal
**POST** `/api/payments/sellers/:sellerId/stores/:storeId/withdraw`

Processes a withdrawal request from available balance.

**Request Body:**
```json
{
  "amount": 1000,
  "payment_method": "BANK_TRANSFER",
  "description": "Monthly withdrawal"
}
```

### Get Balance History
**GET** `/api/payments/sellers/:sellerId/stores/:storeId/balance/history`

Retrieves transaction history for balance changes.

**Query Parameters:**
- `page`, `limit`: Pagination

## Analytics Endpoints

### Get Payment Analytics
**GET** `/api/payments/sellers/:sellerId/analytics`
**GET** `/api/payments/sellers/:sellerId/stores/:storeId/analytics`

Retrieves payment analytics for a seller or specific store.

**Query Parameters:**
- `period`: Time period ('7d', '30d', '90d')

**Response:**
```json
{
  "period": "30d",
  "total_payments": 100,
  "completed_payments": 95,
  "pending_payments": 3,
  "failed_payments": 2,
  "total_amount": 50000,
  "average_amount": 500,
  "success_rate": 95.0
}
```

### Get Payment Summary by Method
**GET** `/api/payments/sellers/:sellerId/summary/by-method`
**GET** `/api/payments/sellers/:sellerId/stores/:storeId/summary/by-method`

Retrieves payment summary grouped by payment method.

**Response:**
```json
[
  {
    "payment_method": "BANK_TRANSFER",
    "_count": { "id": 80 },
    "_sum": { "amount": 40000 }
  },
  {
    "payment_method": "UPI",
    "_count": { "id": 15 },
    "_sum": { "amount": 7500 }
  }
]
```

## Data Models

### Payment Status Enum
- `PENDING`: Payment is pending processing
- `PROCESSING`: Payment is being processed
- `COMPLETED`: Payment has been completed successfully
- `FAILED`: Payment has failed
- `CANCELLED`: Payment has been cancelled
- `REFUNDED`: Payment has been refunded

### Settlement Status Enum
- `PENDING`: Settlement is pending
- `PROCESSING`: Settlement is being processed
- `COMPLETED`: Settlement has been completed
- `FAILED`: Settlement has failed
- `DISPUTED`: Settlement is under dispute

### Payment Method Enum
- `BANK_TRANSFER`: Bank transfer
- `UPI`: UPI payment
- `WALLET`: Digital wallet
- `CARD`: Credit/Debit card
- `CHEQUE`: Cheque payment

## Usage Examples

### Complete Settlement Workflow

1. **Create Settlement:**
```bash
curl -X POST /api/payments/settlements \\
  -H "Content-Type: application/json" \\
  -d '{
    "seller_id": 1,
    "store_id": 1,
    "settlement_period_start": "2024-01-01T00:00:00Z",
    "settlement_period_end": "2024-01-31T23:59:59Z",
    "total_sales_amount": 10000,
    "platform_commission": 500,
    "tax_deduction": 200,
    "payment_method": "BANK_TRANSFER"
  }'
```

2. **Add Settlement Details:**
```bash
curl -X POST /api/payments/settlement-details \\
  -H "Content-Type: application/json" \\
  -d '{
    "settlement_id": 1,
    "order_id": 100,
    "order_amount": 500,
    "commission_rate": 5.0
  }'
```

3. **Create Payment:**
```bash
curl -X POST /api/payments/payments \\
  -H "Content-Type: application/json" \\
  -d '{
    "seller_id": 1,
    "store_id": 1,
    "settlement_id": 1,
    "amount": 9250,
    "payment_method": "BANK_TRANSFER",
    "due_date": "2024-01-15T00:00:00Z"
  }'
```

4. **Update Payment Status:**
```bash
curl -X PUT /api/payments/payments/1/status \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "COMPLETED",
    "transaction_reference": "TXN123456",
    "payment_date": "2024-01-02T10:00:00Z"
  }'
```

### Balance Management

1. **Check Balance:**
```bash
curl -X GET /api/payments/sellers/1/stores/1/balance
```

2. **Process Withdrawal:**
```bash
curl -X POST /api/payments/sellers/1/stores/1/withdraw \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000,
    "payment_method": "BANK_TRANSFER",
    "description": "Monthly withdrawal"
  }'
```

3. **View Balance History:**
```bash
curl -X GET /api/payments/sellers/1/stores/1/balance/history?page=1&limit=10
```

### Analytics and Reporting

1. **Get Payment Analytics:**
```bash
curl -X GET /api/payments/sellers/1/analytics?period=30d
```

2. **Get Payment Summary by Method:**
```bash
curl -X GET /api/payments/sellers/1/summary/by-method
```

## Health Check

**GET** `/api/payments/health`

Returns API health status and version information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00Z",
  "service": "Payment API",
  "version": "1.0.0"
}
```

## Integration Notes

1. **Route Integration**: Mount the payment router in your main Express app:
```typescript
import paymentRoutes from './payment_routes';
app.use('/api/payments', paymentRoutes);
```

2. **Database**: Ensure your Prisma schema is up to date and migrations are applied.

3. **Error Handling**: The API includes comprehensive error handling for common scenarios.

4. **Validation**: Consider adding request validation middleware for enhanced security.

5. **Authentication**: Implement appropriate authentication middleware before mounting routes.

6. **Rate Limiting**: Consider implementing rate limiting for production use.

## Support

For additional support or questions about the Payment API, please refer to the main project documentation or contact the development team.
