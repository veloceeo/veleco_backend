import { Router } from 'express';
import {
  createSupportTicket,
  getSupportTickets,
  getTicketById,
  addTicketResponse,
  updateTicketStatus,
  getTicketStats,
  getTicketTemplates,
  createTicketTemplate,
  getTicketEmailLogs
} from './support_ticket_api';
import { authAdminMiddleware } from './models/auth/middleware';
   
const router = Router();

// ============ SUPPORT TICKET API ROUTES ============

/**
 * @route   POST /api/support/tickets
 * @desc    Create a new support ticket
 * @access  Public
 */
router.post('/tickets', createSupportTicket as any);

/**
 * @route   GET /api/support/tickets
 * @desc    Get all tickets with filtering and pagination
 * @access  Private (Support/Admin)
 */
router.get('/tickets', getSupportTickets as any);

/**
 * @route   GET /api/support/stats
 * @desc    Get ticket statistics and analytics
 * @access  Private (Support/Admin)
 */
router.get('/stats', getTicketStats as any);

/**
 * @route   GET /api/support/templates
 * @desc    Get ticket response templates
 * @access  Private (Support/Admin)
 */
router.get('/templates', getTicketTemplates as any);

/**
 * @route   POST /api/support/templates
 * @desc    Create a new ticket template
 * @access  Private (Admin)
 */
router.post('/templates', createTicketTemplate as any);

/**
 * @route   GET /api/support/tickets/:id
 * @desc    Get ticket by ID or ticket number
 * @access  Private (Owner/Support/Admin)
 */
router.get('/tickets/:id', getTicketById as any);

/**
 * @route   POST /api/support/tickets/:ticketId/responses
 * @desc    Add response to a ticket
 * @access  Private (Owner/Support/Admin)
 */
router.post('/tickets/:ticketId/responses', addTicketResponse as any);

/**
 * @route   PATCH /api/support/tickets/:ticketId/status
 * @desc    Update ticket status
 * @access  Private (Support/Admin)
 */
router.patch('/tickets/:ticketId/status', updateTicketStatus as any);

/**
 * @route   GET /api/support/tickets/:ticketId/email-logs
 * @desc    Get email logs for a specific ticket
 * @access  Private (Support/Admin)
 */
router.get('/tickets/:ticketId/email-logs', getTicketEmailLogs as any);

// ============ HEALTH CHECK ============

/**
 * @route   GET /api/support/health
 * @desc    Health check for support ticket system
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Support Ticket System',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============ API INFO ============

/**
 * @route   GET /api/support
 * @desc    Get API information and available endpoints
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    service: 'Support Ticket API',
    version: '1.0.0',
    description: 'RESTful API for managing customer support tickets',
    endpoints: {
      tickets: {
        'POST /tickets': 'Create a new support ticket',
        'GET /tickets': 'List all tickets with filtering and pagination',
        'GET /tickets/:id': 'Get specific ticket by ID or ticket number',
        'POST /tickets/:ticketId/responses': 'Add response to a ticket',
        'PATCH /tickets/:ticketId/status': 'Update ticket status',
        'GET /tickets/:ticketId/email-logs': 'Get email logs for a ticket'
      },
      templates: {
        'GET /templates': 'Get ticket response templates',
        'POST /templates': 'Create new ticket template'
      },
      analytics: {
        'GET /stats': 'Get ticket statistics and analytics'
      },
      system: {
        'GET /': 'API information',
        'GET /health': 'Health check'
      }
    },
    categories: [
      'TECHNICAL_ISSUE', 'BILLING', 'ACCOUNT', 'PRODUCT',
      'ORDER', 'PAYMENT', 'GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT'
    ],
    priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'],
    statuses: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_RESPONSE', 'RESOLVED', 'CLOSED', 'REOPENED']
  });
});

export default router;
