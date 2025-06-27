import { type Request, type Response } from 'express';
import { PrismaClient } from './db/generated/prisma';
import { sendNewTicketEmails, sendResponseEmail, sendStatusChangeEmail } from './support_ticket_mail';

const prisma = new PrismaClient();

// Generate unique ticket number
const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${year}-${randomSuffix}`;
};

// Error handling utility
const handleError = (error: unknown, res: Response) => {
  console.error('Support Ticket API Error:', error);
  
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

// ============ TICKET CREATION ============

/**
 * Create a new support ticket
 */
export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const {
      subject,
      description,
      category,
      priority = 'MEDIUM',
      contact_name,
      contact_email,
      contact_phone,
      user_id,
      seller_id,
      store_id,
      browser_info,
      device_info,
      page_url
    } = req.body;

    // Validation
    if (!subject || !description || !contact_email || !category) {
      return res.status(400).json({
        error: 'Subject, description, contact email, and category are required'
      });
    }

    // Validate category
    const validCategories = [
      'TECHNICAL_ISSUE', 'BILLING', 'ACCOUNT', 'PRODUCT', 
      'ORDER', 'PAYMENT', 'GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT'
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Validate priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    // Get IP address and user agent from request
    const ip_address = req.ip || req.connection.remoteAddress || 'Unknown';
    const user_agent = req.get('User-Agent') || 'Unknown';

    // Generate unique ticket number
    let ticket_number = generateTicketNumber();
    
    // Ensure uniqueness
    let existingTicket = await prisma.support_ticket.findUnique({
      where: { ticket_number }
    });
    
    while (existingTicket) {
      ticket_number = generateTicketNumber();
      existingTicket = await prisma.support_ticket.findUnique({
        where: { ticket_number }
      });
    }

    // Create the ticket
    const ticket = await prisma.support_ticket.create({
      data: {
        ticket_number,
        subject,
        description,
        category,
        priority,
        contact_name,
        contact_email,
        contact_phone,
        user_id: user_id || null,
        seller_id: seller_id || null,
        store_id: store_id || null,
        browser_info,
        device_info,
        ip_address,
        user_agent,
        page_url,
        status: 'OPEN'
      },
      include: {
        user: true,
        seller: true,
        store: true
      }
    });

    // Send notification emails
    try {
      const emailResults = await sendNewTicketEmails(ticket);
      console.log('Email notifications sent:', emailResults);
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError);
      // Don't fail the ticket creation if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        contact_email: ticket.contact_email
      }
    });

  } catch (error) {
    return handleError(error, res);
  }
};

// ============ TICKET RETRIEVAL ============

/**
 * Get all tickets with filtering and pagination
 */
export const getSupportTickets = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      user_id,
      seller_id,
      store_id,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit (must be 1-100)' });
    }

    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (user_id) where.user_id = parseInt(user_id as string);
    if (seller_id) where.seller_id = parseInt(seller_id as string);
    if (store_id) where.store_id = parseInt(store_id as string);
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ticket_number: { contains: search, mode: 'insensitive' } },
        { contact_email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.support_ticket.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          seller: {
            select: { id: true, phone: true }
          },
          store: {
            select: { id: true, name: true }
          },
          responses: {
            orderBy: { created_at: 'desc' },
            take: 1,
            select: {
              id: true,
              message: true,
              created_at: true,
              author_name: true,
              is_from_customer: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ]
      }),
      prisma.support_ticket.count({ where })
    ]);

    return res.json({
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * Get ticket by ID or ticket number
 */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Ticket ID or number is required' });
    }

    // Try to find by ID first, then by ticket number
    let ticket;
    
    if (!isNaN(parseInt(id))) {
      ticket = await prisma.support_ticket.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          },
          seller: {
            select: { id: true, phone: true }
          },
          store: {
            select: { id: true, name: true, email: true, phone: true }
          },
          responses: {
            orderBy: { created_at: 'asc' },
            include: {
              ticket: {
                select: { ticket_number: true }
              }
            }
          },
          email_logs: {
            orderBy: { created_at: 'desc' },
            take: 10
          }
        }
      });
    }

    if (!ticket) {
      ticket = await prisma.support_ticket.findUnique({
        where: { ticket_number: id },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          },
          seller: {
            select: { id: true, phone: true }
          },
          store: {
            select: { id: true, name: true, email: true, phone: true }
          },
          responses: {
            orderBy: { created_at: 'asc' },
            include: {
              ticket: {
                select: { ticket_number: true }
              }
            }
          },
          email_logs: {
            orderBy: { created_at: 'desc' },
            take: 10
          }
        }
      });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.json(ticket);

  } catch (error) {
    return handleError(error, res);
  }
};

// ============ TICKET RESPONSES ============

/**
 * Add response to ticket
 */
export const addTicketResponse = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const {
      message,
      is_internal = false,
      is_from_customer = false,
      author_name,
      author_email,
      author_id,
      author_type = 'support'
    } = req.body;

    const ticketIdNum = parseInt(ticketId as string);
    if (isNaN(ticketIdNum)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get ticket details
    const ticket = await prisma.support_ticket.findUnique({
      where: { id: ticketIdNum }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Create response
    const response = await prisma.ticket_response.create({
      data: {
        ticket_id: ticketIdNum,
        message,
        is_internal,
        is_from_customer,
        author_name,
        author_email,
        author_id,
        author_type
      }
    });

    // Update ticket's last response time
    await prisma.support_ticket.update({
      where: { id: ticketIdNum },
      data: {
        last_response_at: new Date(),
        status: is_from_customer ? 'WAITING_FOR_RESPONSE' : 
                (ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status)
      }
    });

    // Send email notification if not internal
    if (!is_internal) {
      try {
        await sendResponseEmail(ticket, response);
      } catch (emailError) {
        console.error('Failed to send response email:', emailError);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Response added successfully',
      response
    });

  } catch (error) {
    return handleError(error, res);
  }
};

// ============ TICKET STATUS MANAGEMENT ============

/**
 * Update ticket status
 */
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status, resolution, assigned_to } = req.body;

    const ticketIdNum = parseInt(ticketId as string);
    if (isNaN(ticketIdNum)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_RESPONSE', 'RESOLVED', 'CLOSED', 'REOPENED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = {
      status,
      updated_at: new Date()
    };

    if (assigned_to) updateData.assigned_to = assigned_to;
    
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolution = resolution || null;
      updateData.resolution_date = new Date();
    }

    const updatedTicket = await prisma.support_ticket.update({
      where: { id: ticketIdNum },
      data: updateData
    });

    // Send status change email
    try {
      await sendStatusChangeEmail(updatedTicket);
    } catch (emailError) {
      console.error('Failed to send status change email:', emailError);
    }

    return res.json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    return handleError(error, res);
  }
};

// ============ TICKET STATISTICS ============

/**
 * Get ticket statistics
 */
export const getTicketStats = async (req: Request, res: Response) => {
  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      categoryStats,
      priorityStats
    ] = await Promise.all([
      prisma.support_ticket.count(),
      prisma.support_ticket.count({ where: { status: 'OPEN' } }),
      prisma.support_ticket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.support_ticket.count({ where: { status: 'RESOLVED' } }),
      prisma.support_ticket.count({ where: { status: 'CLOSED' } }),
      prisma.support_ticket.count({ where: { priority: 'URGENT' } }),
      
      prisma.support_ticket.groupBy({
        by: ['category'],
        _count: { id: true }
      }),
      
      prisma.support_ticket.groupBy({
        by: ['priority'],
        _count: { id: true }
      })
    ]);

    return res.json({
      total_tickets: totalTickets,
      status_breakdown: {
        open: openTickets,
        in_progress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets
      },
      urgent_tickets: urgentTickets,
      category_breakdown: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.id
      })),
      priority_breakdown: priorityStats.map(stat => ({
        priority: stat.priority,
        count: stat._count.id
      }))
    });

  } catch (error) {
    return handleError(error, res);
  }
};

// ============ TICKET TEMPLATES ============

/**
 * Get ticket templates
 */
export const getTicketTemplates = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = { is_active: true };
    if (category) where.category = category;

    const templates = await prisma.ticket_template.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return res.json(templates);

  } catch (error) {
    return handleError(error, res);
  }
};

/**
 * Create ticket template
 */
export const createTicketTemplate = async (req: Request, res: Response) => {
  try {
    const { name, category, subject_template, body_template } = req.body;

    if (!name || !category || !subject_template || !body_template) {
      return res.status(400).json({
        error: 'Name, category, subject template, and body template are required'
      });
    }

    const template = await prisma.ticket_template.create({
      data: {
        name,
        category,
        subject_template,
        body_template
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });

  } catch (error) {
    return handleError(error, res);
  }
};

// ============ EMAIL LOGS ============

/**
 * Get email logs for a ticket
 */
export const getTicketEmailLogs = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const ticketIdNum = parseInt(ticketId as string);
    if (isNaN(ticketIdNum)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    const emailLogs = await prisma.ticket_email_log.findMany({
      where: { ticket_id: ticketIdNum },
      orderBy: { created_at: 'desc' }
    });

    return res.json(emailLogs);

  } catch (error) {
    return handleError(error, res);
  }
};
