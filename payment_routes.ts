import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from './db/generated/prisma';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function for error handling
const handleError = (res: Response, message: string, error?: any) => {
  res.status(500).json({
    success: false,
    message,
    error: error?.message || 'Unknown error'
  });
};

// Helper function to parse ID safely
const parseId = (id: string | undefined): number => {
  if (!id) throw new Error('ID is required');
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) throw new Error('Invalid ID format');
  return parsed;
};

// ==================== SELLER SETTLEMENT ROUTES ====================

/**
 * Create a new settlement
 * POST /api/settlements
 */
router.post('/settlements', async (req: Request, res: Response) => {
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
      payment_method
    } = req.body;

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
        status: 'PENDING'
      },
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true,
        settlement_details: true,
        seller_payments: true
      }
    });

    res.status(201).json({
      success: true,
      data: settlement,
      message: 'Settlement created successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error creating settlement', error);
  }
});

/**
 * Get all settlements
 * GET /api/settlements
 */
router.get('/settlements', async (req: Request, res: Response) => {
  try {
    const { 
      seller_id, 
      store_id, 
      status, 
      page = '1', 
      limit = '10',
      start_date,
      end_date
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause: any = {};

    if (seller_id) whereClause.seller_id = parseInt(seller_id as string);
    if (store_id) whereClause.store_id = parseInt(store_id as string);
    if (status) whereClause.status = status;
    
    if (start_date && end_date) {
      whereClause.settlement_period_start = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const [settlements, total] = await Promise.all([
      prisma.seller_settlement.findMany({
        where: whereClause,
        include: {
          seller: {
            include: {
              user: true
            }
          },
          store: true,
          settlement_details: {
            include: {
              order: true
            }
          },
          seller_payments: true
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.seller_settlement.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        settlements,
        pagination: {
          current_page: parseInt(page as string),
          total_pages: Math.ceil(total / parseInt(limit as string)),
          total_records: total,
          per_page: parseInt(limit as string)
        }
      }
    });
  } catch (error: any) {
    handleError(res, 'Error fetching settlements', error);
  }
});

/**
 * Get settlement by ID
 * GET /api/settlements/:id
 */
router.get('/settlements/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    const settlement = await prisma.seller_settlement.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true,
        settlement_details: {
          include: {
            order: {
              include: {
                user: true,
                order_items: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        },
        seller_payments: true
      }
    });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    res.json({
      success: true,
      data: settlement
    });
  } catch (error: any) {
    handleError(res, 'Error fetching settlement', error);
  }
});

/**
 * Update settlement status
 * PUT /api/settlements/:id/status
 */
router.put('/settlements/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const { status, transaction_reference } = req.body;

    const updateData: any = { status };
    
    if (status === 'COMPLETED') {
      updateData.settled_at = new Date();
    }

    if (transaction_reference) {
      updateData.transaction_reference = transaction_reference;
    }

    const settlement = await prisma.seller_settlement.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true,
        settlement_details: true
      }
    });

    res.json({
      success: true,
      data: settlement,
      message: 'Settlement status updated successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error updating settlement status', error);
  }
});

/**
 * Delete settlement
 * DELETE /api/settlements/:id
 */
router.delete('/settlements/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    const settlement = await prisma.seller_settlement.findUnique({
      where: { id },
      include: {
        settlement_details: true,
        seller_payments: true
      }
    });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    if (settlement.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed settlement'
      });
    }

    await prisma.seller_settlement.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Settlement deleted successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error deleting settlement', error);
  }
});

// ==================== SETTLEMENT DETAILS ROUTES ====================

/**
 * Create settlement detail
 * POST /api/settlement-details
 */
router.post('/settlement-details', async (req: Request, res: Response) => {
  try {
    const {
      settlement_id,
      order_id,
      order_amount,
      commission_rate,
      tax_rate = 3.0
    } = req.body;

    const commission_amount = (order_amount * commission_rate) / 100;
    const tax_amount = (order_amount * tax_rate) / 100;
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
        order: {
          include: {
            user: true,
            order_items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: settlementDetail,
      message: 'Settlement detail created successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error creating settlement detail', error);
  }
});

/**
 * Get settlement details
 * GET /api/settlements/:settlementId/details
 */
router.get('/settlements/:settlementId/details', async (req: Request, res: Response) => {
  try {
    const settlementId = parseId(req.params.settlementId);
    const { page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [details, total] = await Promise.all([
      prisma.settlement_detail.findMany({
        where: { settlement_id: settlementId },
        include: {
          settlement: true,
          order: {
            include: {
              user: true,
              order_items: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.settlement_detail.count({
        where: { settlement_id: settlementId }
      })
    ]);

    res.json({
      success: true,
      data: {
        details,
        pagination: {
          current_page: parseInt(page as string),
          total_pages: Math.ceil(total / parseInt(limit as string)),
          total_records: total,
          per_page: parseInt(limit as string)
        }
      }
    });
  } catch (error: any) {
    handleError(res, 'Error fetching settlement details', error);
  }
});

/**
 * Update settlement detail
 * PUT /api/settlement-details/:id
 */
router.put('/settlement-details/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const {
      order_amount,
      commission_rate,
      tax_rate = 3.0
    } = req.body;

    const commission_amount = (order_amount * commission_rate) / 100;
    const tax_amount = (order_amount * tax_rate) / 100;
    const net_amount = order_amount - commission_amount - tax_amount;

    const settlementDetail = await prisma.settlement_detail.update({
      where: { id },
      data: {
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

    res.json({
      success: true,
      data: settlementDetail,
      message: 'Settlement detail updated successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error updating settlement detail', error);
  }
});

// ==================== SELLER PAYMENT ROUTES ====================

/**
 * Create seller payment
 * POST /api/seller-payments
 */
router.post('/seller-payments', async (req: Request, res: Response) => {
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
        status: 'PENDING'
      },
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true,
        settlement: true
      }
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Seller payment created successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error creating seller payment', error);
  }
});

/**
 * Get all seller payments
 * GET /api/seller-payments
 */
router.get('/seller-payments', async (req: Request, res: Response) => {
  try {
    const {
      seller_id,
      store_id,
      status,
      payment_method,
      page = '1',
      limit = '10',
      start_date,
      end_date
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause: any = {};

    if (seller_id) whereClause.seller_id = parseInt(seller_id as string);
    if (store_id) whereClause.store_id = parseInt(store_id as string);
    if (status) whereClause.status = status;
    if (payment_method) whereClause.payment_method = payment_method;

    if (start_date && end_date) {
      whereClause.created_at = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const [payments, total] = await Promise.all([
      prisma.seller_payment.findMany({
        where: whereClause,
        include: {
          seller: {
            include: {
              user: true
            }
          },
          store: true,
          settlement: true
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.seller_payment.count({ where: whereClause })
    ]);

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const statusCounts = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          total_amount: totalAmount,
          status_breakdown: statusCounts
        },
        pagination: {
          current_page: parseInt(page as string),
          total_pages: Math.ceil(total / parseInt(limit as string)),
          total_records: total,
          per_page: parseInt(limit as string)
        }
      }
    });
  } catch (error: any) {
    handleError(res, 'Error fetching seller payments', error);
  }
});

/**
 * Get seller payment by ID
 * GET /api/seller-payments/:id
 */
router.get('/seller-payments/:id', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);

    const payment = await prisma.seller_payment.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true,
        settlement: {
          include: {
            settlement_details: {
              include: {
                order: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    handleError(res, 'Error fetching payment', error);
  }
});

/**
 * Update seller payment status
 * PUT /api/seller-payments/:id/status
 */
router.put('/seller-payments/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    const { status, transaction_reference, failure_reason, metadata } = req.body;

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.payment_date = new Date();
    }

    if (transaction_reference) {
      updateData.transaction_reference = transaction_reference;
    }

    if (failure_reason) {
      updateData.failure_reason = failure_reason;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const payment = await prisma.seller_payment.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true,
        settlement: true
      }
    });

    // Update seller balance if payment is completed
    if (status === 'COMPLETED' && payment.amount > 0) {
      await updateSellerBalanceAfterPayment(payment.seller_id, payment.store_id, payment.amount);
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment status updated successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error updating payment status', error);
  }
});

/**
 * Process bulk payments
 * POST /api/seller-payments/bulk-process
 */
router.post('/seller-payments/bulk-process', async (req: Request, res: Response) => {
  try {
    const { payment_ids, status, transaction_reference_prefix } = req.body;

    const payments = await prisma.seller_payment.findMany({
      where: {
        id: { in: payment_ids },
        status: 'PENDING'
      }
    });

    if (payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending payments found for the provided IDs'
      });
    }

    const updatePromises = payments.map((payment) => 
      prisma.seller_payment.update({
        where: { id: payment.id },
        data: {
          status,
          payment_date: status === 'COMPLETED' ? new Date() : undefined,
          transaction_reference: `${transaction_reference_prefix}-${payment.id}`
        }
      })
    );

    const updatedPayments = await Promise.all(updatePromises);

    if (status === 'COMPLETED') {
      const balanceUpdates = updatedPayments
        .filter(payment => payment.amount > 0)
        .map(payment => 
          updateSellerBalanceAfterPayment(payment.seller_id, payment.store_id, payment.amount)
        );
      await Promise.all(balanceUpdates);
    }

    res.json({
      success: true,
      data: updatedPayments,
      message: `${updatedPayments.length} payments processed successfully`
    });
  } catch (error: any) {
    handleError(res, 'Error processing bulk payments', error);
  }
});

// ==================== SELLER BALANCE ROUTES ====================

/**
 * Get seller balance
 * GET /api/seller-balance/:sellerId
 */
router.get('/seller-balance/:sellerId', async (req: Request, res: Response) => {
  try {
    const sellerId = parseId(req.params.sellerId);
    const { store_id } = req.query;

    let whereClause: any = { seller_id: sellerId };
    
    if (store_id) {
      whereClause.store_id = parseInt(store_id as string);
    }

    const balances = await prisma.seller_balance.findMany({
      where: whereClause,
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true
      }
    });

    const totalBalance = balances.reduce((acc, balance) => {
      acc.total_pending += balance.pending_amount;
      acc.total_available += balance.available_amount;
      acc.total_lifetime_earnings += balance.total_lifetime_earnings;
      acc.total_withdrawals += balance.total_withdrawals;
      return acc;
    }, {
      total_pending: 0,
      total_available: 0,
      total_lifetime_earnings: 0,
      total_withdrawals: 0
    });

    res.json({
      success: true,
      data: {
        balances,
        summary: totalBalance
      }
    });
  } catch (error: any) {
    handleError(res, 'Error fetching seller balance', error);
  }
});

/**
 * Update seller balance
 * PUT /api/seller-balance
 */
router.put('/seller-balance', async (req: Request, res: Response) => {
  try {
    const {
      seller_id,
      store_id,
      pending_amount,
      available_amount,
      total_lifetime_earnings,
      total_withdrawals,
      commission_rate
    } = req.body;

    const balance = await prisma.seller_balance.upsert({
      where: { store_id },
      update: {
        pending_amount,
        available_amount,
        total_lifetime_earnings,
        total_withdrawals,
        commission_rate
      },
      create: {
        seller_id,
        store_id,
        pending_amount,
        available_amount,
        total_lifetime_earnings,
        total_withdrawals,
        commission_rate
      },
      include: {
        seller: {
          include: {
            user: true
          }
        },
        store: true
      }
    });

    res.json({
      success: true,
      data: balance,
      message: 'Seller balance updated successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error updating seller balance', error);
  }
});

/**
 * Process withdrawal request
 * POST /api/seller-balance/withdraw
 */
router.post('/seller-balance/withdraw', async (req: Request, res: Response) => {
  try {
    const { seller_id, store_id, amount, payment_method } = req.body;

    const balance = await prisma.seller_balance.findUnique({
      where: { store_id }
    });

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Seller balance not found'
      });
    }

    if (balance.available_amount < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available balance'
      });
    }

    const payment = await prisma.seller_payment.create({
      data: {
        seller_id,
        store_id,
        amount: -amount,
        payment_method,
        status: 'PENDING',
        due_date: new Date(),
        description: 'Withdrawal request'
      }
    });

    await prisma.seller_balance.update({
      where: { store_id },
      data: {
        available_amount: balance.available_amount - amount,
        total_withdrawals: balance.total_withdrawals + amount
      }
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Withdrawal request processed successfully'
    });
  } catch (error: any) {
    handleError(res, 'Error processing withdrawal', error);
  }
});

/**
 * Get balance history
 * GET /api/seller-balance/:sellerId/history
 */
router.get('/seller-balance/:sellerId/history', async (req: Request, res: Response) => {
  try {
    const sellerId = parseId(req.params.sellerId);
    const { store_id, start_date, end_date, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause: any = { seller_id: sellerId };
    
    if (store_id) {
      whereClause.store_id = parseInt(store_id as string);
    }

    if (start_date && end_date) {
      whereClause.created_at = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const [payments, settlements] = await Promise.all([
      prisma.seller_payment.findMany({
        where: whereClause,
        include: {
          store: true,
          settlement: true
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.seller_settlement.findMany({
        where: whereClause,
        include: {
          store: true
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: parseInt(limit as string)
      })
    ]);

    const history = [...payments, ...settlements].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          current_page: parseInt(page as string),
          per_page: parseInt(limit as string)
        }
      }
    });
  } catch (error: any) {
    handleError(res, 'Error fetching balance history', error);
  }
});

/**
 * Get payment analytics
 * GET /api/payments/analytics
 */
router.get('/payments/analytics', async (req: Request, res: Response) => {
  try {
    const { seller_id, store_id, start_date, end_date } = req.query;

    let whereClause: any = {};
    
    if (seller_id) whereClause.seller_id = parseInt(seller_id as string);
    if (store_id) whereClause.store_id = parseInt(store_id as string);
    
    if (start_date && end_date) {
      whereClause.created_at = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const [payments, settlements] = await Promise.all([
      prisma.seller_payment.findMany({
        where: whereClause
      }),
      prisma.seller_settlement.findMany({
        where: whereClause
      })
    ]);

    const paymentAnalytics = {
      total_payments: payments.length,
      completed_payments: payments.filter(p => p.status === 'COMPLETED').length,
      pending_payments: payments.filter(p => p.status === 'PENDING').length,
      failed_payments: payments.filter(p => p.status === 'FAILED').length,
      total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
      average_payment_amount: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0
    };

    const settlementAnalytics = {
      total_settlements: settlements.length,
      completed_settlements: settlements.filter(s => s.status === 'COMPLETED').length,
      pending_settlements: settlements.filter(s => s.status === 'PENDING').length,
      total_sales_amount: settlements.reduce((sum, s) => sum + s.total_sales_amount, 0),
      total_commission: settlements.reduce((sum, s) => sum + s.platform_commission, 0),
      total_tax: settlements.reduce((sum, s) => sum + s.tax_deduction, 0),
      net_settlement_amount: settlements.reduce((sum, s) => sum + s.net_settlement_amount, 0)
    };

    res.json({
      success: true,
      data: {
        payment_analytics: paymentAnalytics,
        settlement_analytics: settlementAnalytics,
        period: {
          start_date,
          end_date
        }
      }
    });
  } catch (error: any) {
    handleError(res, 'Error fetching payment analytics', error);
  }
});

// ==================== UTILITY FUNCTIONS ====================

async function updateSellerBalanceAfterPayment(seller_id: number, store_id: number, amount: number) {
  try {
    const balance = await prisma.seller_balance.findUnique({
      where: { store_id }
    });

    if (balance) {
      await prisma.seller_balance.update({
        where: { store_id },
        data: {
          available_amount: balance.available_amount + amount,
          total_lifetime_earnings: balance.total_lifetime_earnings + amount,
          last_settlement_date: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error updating seller balance:', error);
  }
}

export default router;
