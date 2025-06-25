import { PrismaClient, PaymentStatus, SettlementStatus, PaymentMethod } from '../db/generated/prisma';
import type { Request, Response } from 'express';

const prisma = new PrismaClient();

// Error handling utility
const handleError = (error: unknown, res: Response) => {
  console.error('API Error:', error);
  
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

// ============ SELLER SETTLEMENT ENDPOINTS ============

// Create a new settlement
export const createSettlement = async (req: Request, res: Response) => {
  try {
    const {
      seller_id,
      store_id,
      settlement_period_start,
      settlement_period_end,
      total_sales_amount,
      platform_commission,
      tax_deduction,
      other_deductions = 0,
      payment_method,
      transaction_reference
    } = req.body;

    // Calculate net settlement amount
    const net_settlement_amount = total_sales_amount - platform_commission - tax_deduction - other_deductions;

    const settlement = await prisma.seller_settlement.create({
      data: {
        seller_id,
        store_id,
        settlement_period_start: new Date(settlement_period_start),
        settlement_period_end: new Date(settlement_period_end),
        total_sales_amount,
        platform_commission,
        tax_deduction,
        other_deductions,
        net_settlement_amount,
        payment_method,
        transaction_reference,
        status: SettlementStatus.PENDING
      },
      include: {
        seller: true,
        store: true,
        settlement_details: true,
        seller_payments: true
      }
    });

    return res.status(201).json(settlement);
  } catch (error) {
    return handleError(error, res);
  }
};

// Get all settlements with pagination and filtering
export const getSettlements = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      seller_id,
      store_id,
      status,
      start_date,
      end_date
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (seller_id) where.seller_id = Number(seller_id);
    if (store_id) where.store_id = Number(store_id);
    if (status) where.status = status;
    if (start_date && end_date) {
      where.settlement_period_start = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const [settlements, total] = await Promise.all([
      prisma.seller_settlement.findMany({
        where,
        skip,
        take,
        include: {
          seller: true,
          store: true,
          settlement_details: true,
          seller_payments: true
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.seller_settlement.count({ where })
    ]);

    return res.json({
      settlements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Get settlement by ID
export const getSettlementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Settlement ID is required' });
    }
    
    const settlement = await prisma.seller_settlement.findUnique({
      where: { id: Number(id) },
      include: {
        seller: true,
        store: true,
        settlement_details: {
          include: {
            order: true
          }
        },
        seller_payments: true
      }
    });

    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    return res.json(settlement);
  } catch (error) {
    return handleError(error, res);
  }
};

// Update settlement status
export const updateSettlementStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, transaction_reference, settled_at } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Settlement ID is required' });
    }

    const settlement = await prisma.seller_settlement.update({
      where: { id: Number(id) },
      data: {
        status,
        transaction_reference,
        settled_at: settled_at ? new Date(settled_at) : null
      },
      include: {
        seller: true,
        store: true,
        settlement_details: true,
        seller_payments: true
      }
    });

    // Update seller balance if settlement is completed
    if (status === SettlementStatus.COMPLETED) {
      await updateSellerBalance(settlement.seller_id, settlement.store_id, settlement.net_settlement_amount);
    }

    return res.json(settlement);
  } catch (error) {
    return handleError(error, res);
  }
};

// Delete settlement
export const deleteSettlement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Settlement ID is required' });
    }

    await prisma.seller_settlement.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

// ============ SETTLEMENT DETAIL ENDPOINTS ============

// Create settlement detail
export const createSettlementDetail = async (req: Request, res: Response) => {
  try {
    const {
      settlement_id,
      order_id,
      order_amount,
      commission_rate,
      tax_amount = 0
    } = req.body;

    const commission_amount = order_amount * (commission_rate / 100);
    const net_amount = order_amount - commission_amount - tax_amount;

    const settlementDetail = await prisma.settlement_detail.create({
      data: {
        settlement_id,
        order_id,
        order_amount,
        commission_rate,
        commission_amount,
        tax_amount,
        net_amount
      },
      include: {
        settlement: true,
        order: true
      }
    });

    return res.status(201).json(settlementDetail);
  } catch (error) {
    return handleError(error, res);
  }
};

// Get settlement details for a specific settlement
export const getSettlementDetails = async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;

    if (!settlementId) {
      return res.status(400).json({ error: 'Settlement ID is required' });
    }

    const details = await prisma.settlement_detail.findMany({
      where: { settlement_id: Number(settlementId) },
      include: {
        settlement: true,
        order: {
          include: {
            order_items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    return res.json(details);
  } catch (error) {
    return handleError(error, res);
  }
};

// ============ SELLER PAYMENT ENDPOINTS ============

// Create a new payment
export const createPayment = async (req: Request, res: Response) => {
  try {
    const {
      seller_id,
      store_id,
      settlement_id,
      amount,
      payment_method,
      due_date,
      description,
      metadata
    } = req.body;

    const payment = await prisma.seller_payment.create({
      data: {
        seller_id,
        store_id,
        settlement_id,
        amount,
        payment_method,
        due_date: new Date(due_date),
        description,
        metadata,
        status: PaymentStatus.PENDING
      },
      include: {
        seller: true,
        store: true,
        settlement: true
      }
    });

    return res.status(201).json(payment);
  } catch (error) {
    return handleError(error, res);
  }
};

// Get all payments with filtering and pagination
export const getPayments = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      seller_id,
      store_id,
      status,
      payment_method,
      start_date,
      end_date
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (seller_id) where.seller_id = Number(seller_id);
    if (store_id) where.store_id = Number(store_id);
    if (status) where.status = status;
    if (payment_method) where.payment_method = payment_method;
    if (start_date && end_date) {
      where.payment_date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const [payments, total] = await Promise.all([
      prisma.seller_payment.findMany({
        where,
        skip,
        take,
        include: {
          seller: true,
          store: true,
          settlement: true
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.seller_payment.count({ where })
    ]);

    return res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Get payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = await prisma.seller_payment.findUnique({
      where: { id: Number(id) },
      include: {
        seller: true,
        store: true,
        settlement: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.json(payment);
  } catch (error) {
    return handleError(error, res);
  }
};

// Update payment status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, transaction_reference, payment_date, failure_reason } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = await prisma.seller_payment.update({
      where: { id: Number(id) },
      data: {
        status,
        transaction_reference,
        payment_date: payment_date ? new Date(payment_date) : null,
        failure_reason
      },
      include: {
        seller: true,
        store: true,
        settlement: true
      }
    });

    // Update seller balance if payment is completed
    if (status === PaymentStatus.COMPLETED) {
      await updateSellerBalance(payment.seller_id, payment.store_id, payment.amount);
    }

    return res.json(payment);
  } catch (error) {
    return handleError(error, res);
  }
};

// Bulk update payment statuses
export const bulkUpdatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { payment_ids, status, transaction_reference } = req.body;

    if (!Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({ error: 'payment_ids must be a non-empty array' });
    }

    const payments = await prisma.seller_payment.updateMany({
      where: {
        id: { in: payment_ids.map(id => Number(id)) }
      },
      data: {
        status,
        transaction_reference,
        payment_date: status === PaymentStatus.COMPLETED ? new Date() : null
      }
    });

    return res.json({ updated_count: payments.count });
  } catch (error) {
    return handleError(error, res);
  }
};

// Delete payment
export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    await prisma.seller_payment.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};

// ============ SELLER BALANCE ENDPOINTS ============

// Get seller balance
export const getSellerBalance = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId } = req.params;

    if (!sellerId || !storeId) {
      return res.status(400).json({ error: 'Seller ID and Store ID are required' });
    }

    const balance = await prisma.seller_balance.findFirst({
      where: {
        seller_id: Number(sellerId),
        store_id: Number(storeId)
      },
      include: {
        seller: true,
        store: true
      }
    });

    if (!balance) {
      return res.status(404).json({ error: 'Balance not found' });
    }

    return res.json(balance);
  } catch (error) {
    return handleError(error, res);
  }
};

// Update seller balance (for internal use)
export const updateSellerBalance = async (sellerId: number, storeId: number, amount: number) => {
  try {
    const balance = await prisma.seller_balance.upsert({
      where: {
        seller_id: sellerId
      },
      update: {
        available_amount: {
          increment: amount
        },
        total_lifetime_earnings: {
          increment: amount
        }
      },
      create: {
        seller_id: sellerId,
        store_id: storeId,
        available_amount: amount,
        total_lifetime_earnings: amount
      }
    });

    return balance;
  } catch (error) {
    console.error('Error updating seller balance:', error);
    throw error;
  }
};

// Process withdrawal
export const processWithdrawal = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId } = req.params;
    const { amount, payment_method, description } = req.body;

    if (!sellerId || !storeId) {
      return res.status(400).json({ error: 'Seller ID and Store ID are required' });
    }

    const balance = await prisma.seller_balance.findFirst({
      where: {
        seller_id: Number(sellerId),
        store_id: Number(storeId)
      }
    });

    if (!balance) {
      return res.status(404).json({ error: 'Balance not found' });
    }

    if (balance.available_amount < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal payment record
    const payment = await prisma.seller_payment.create({
      data: {
        seller_id: Number(sellerId),
        store_id: Number(storeId),
        amount: -amount, // Negative for withdrawal
        payment_method,
        description: description || 'Withdrawal',
        status: PaymentStatus.PENDING,
        due_date: new Date()
      }
    });

    // Update balance
    await prisma.seller_balance.update({
      where: { seller_id: Number(sellerId) },
      data: {
        available_amount: {
          decrement: amount
        },
        total_withdrawals: {
          increment: amount
        }
      }
    });

    return res.json(payment);
  } catch (error) {
    return handleError(error, res);
  }
};

// Get balance history
export const getBalanceHistory = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!sellerId || !storeId) {
      return res.status(400).json({ error: 'Seller ID and Store ID are required' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [payments, total] = await Promise.all([
      prisma.seller_payment.findMany({
        where: {
          seller_id: Number(sellerId),
          store_id: Number(storeId)
        },
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          settlement: true
        }
      }),
      prisma.seller_payment.count({
        where: {
          seller_id: Number(sellerId),
          store_id: Number(storeId)
        }
      })
    ]);

    return res.json({
      history: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// ============ PAYMENT ANALYTICS ENDPOINTS ============

// Get payment analytics
export const getPaymentAnalytics = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId } = req.params;
    const { period = '30d' } = req.query;

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const where: any = {
      seller_id: Number(sellerId),
      created_at: {
        gte: startDate,
        lte: endDate
      }
    };

    if (storeId) {
      where.store_id = Number(storeId);
    }

    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      averageAmount
    ] = await Promise.all([
      prisma.seller_payment.count({ where }),
      prisma.seller_payment.count({ where: { ...where, status: PaymentStatus.COMPLETED } }),
      prisma.seller_payment.count({ where: { ...where, status: PaymentStatus.PENDING } }),
      prisma.seller_payment.count({ where: { ...where, status: PaymentStatus.FAILED } }),
      prisma.seller_payment.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.seller_payment.aggregate({
        where,
        _avg: { amount: true }
      })
    ]);

    const analytics = {
      period,
      total_payments: totalPayments,
      completed_payments: completedPayments,
      pending_payments: pendingPayments,
      failed_payments: failedPayments,
      total_amount: totalAmount._sum.amount || 0,
      average_amount: averageAmount._avg.amount || 0,
      success_rate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
    };

    return res.json(analytics);
  } catch (error) {
    return handleError(error, res);
  }
};

// Get payment summary by method
export const getPaymentSummaryByMethod = async (req: Request, res: Response) => {
  try {
    const { sellerId, storeId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }

    const where: any = {
      seller_id: Number(sellerId),
      status: PaymentStatus.COMPLETED
    };

    if (storeId) {
      where.store_id = Number(storeId);
    }

    const summary = await prisma.seller_payment.groupBy({
      by: ['payment_method'],
      where,
      _count: { id: true },
      _sum: { amount: true }
    });

    return res.json(summary);
  } catch (error) {
    return handleError(error, res);
  }
};
