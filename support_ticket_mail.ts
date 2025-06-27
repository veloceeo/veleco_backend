import mailer from "nodemailer";
import { PrismaClient } from './db/generated/prisma';

const prisma = new PrismaClient();

// Email transporter configuration
const transport = mailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "credential",
        pass: "credential",
    }
});

// Support team configuration
const SUPPORT_CONFIG = {
    supportEmail: "ecom@gmail.com",
    supportName: "E-Commerce Support Team",
    fromEmail: "user1@gmail.com",
    fromName: "E-Commerce Platform"
};

// Email templates
const EMAIL_TEMPLATES = {
    ticketCreated: {
        subject: (ticketNumber: string) => `[${ticketNumber}] Your support ticket has been created`,
        customerBody: (data: any) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Support Ticket Created</h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #007bff; margin-bottom: 15px;">Ticket Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #555;">Ticket Number:</td>
                                <td style="padding: 8px; color: #333;">${data.ticket_number}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #555;">Subject:</td>
                                <td style="padding: 8px; color: #333;">${data.subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #555;">Category:</td>
                                <td style="padding: 8px; color: #333;">${data.category}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #555;">Priority:</td>
                                <td style="padding: 8px; color: #333;">
                                    <span style="background-color: ${data.priority === 'HIGH' ? '#dc3545' : data.priority === 'MEDIUM' ? '#ffc107' : '#28a745'}; 
                                                 color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                        ${data.priority}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #555;">Status:</td>
                                <td style="padding: 8px; color: #333;">
                                    <span style="background-color: #17a2b8; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                        ${data.status}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #555;">Created:</td>
                                <td style="padding: 8px; color: #333;">${new Date(data.created_at).toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h4 style="color: #333; margin-bottom: 10px;">Your Message:</h4>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; line-height: 1.6;">
                            ${data.description.replace(/\n/g, '<br>')}
                        </div>
                    </div>

                    <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
                        <h4 style="color: #0056b3; margin-bottom: 10px;">📞 What's Next?</h4>
                        <ul style="color: #0056b3; margin: 0; padding-left: 20px;">
                            <li>Our support team will review your ticket within 24 hours</li>
                            <li>You'll receive email updates when there are responses</li>
                            <li>Reply to this email to add more information to your ticket</li>
                            <li>Keep your ticket number <strong>${data.ticket_number}</strong> for reference</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="color: #6c757d; margin-bottom: 10px;">Need immediate assistance?</p>
                        <p style="color: #6c757d; margin: 0;">
                            Email: <a href="mailto:${SUPPORT_CONFIG.supportEmail}" style="color: #007bff;">${SUPPORT_CONFIG.supportEmail}</a> | 
                            Phone: +91-1234567890
                        </p>
                    </div>
                </div>
            </div>
        `,
        supportBody: (data: any) => `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <h2 style="color: #856404; margin-bottom: 20px;">🎫 New Support Ticket Created</h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #856404; margin-bottom: 15px;">Ticket Information</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Ticket Number:</td>
                                <td style="padding: 8px; font-family: monospace; font-weight: bold; color: #dc3545;">${data.ticket_number}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Subject:</td>
                                <td style="padding: 8px;">${data.subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Category:</td>
                                <td style="padding: 8px;">${data.category}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Priority:</td>
                                <td style="padding: 8px;">
                                    <span style="background-color: ${data.priority === 'CRITICAL' || data.priority === 'URGENT' ? '#dc3545' : 
                                                                      data.priority === 'HIGH' ? '#fd7e14' : 
                                                                      data.priority === 'MEDIUM' ? '#ffc107' : '#28a745'}; 
                                                 color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                                        ${data.priority}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Customer Name:</td>
                                <td style="padding: 8px;">${data.contact_name || 'Anonymous'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Customer Email:</td>
                                <td style="padding: 8px;"><a href="mailto:${data.contact_email}">${data.contact_email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Customer Phone:</td>
                                <td style="padding: 8px;">${data.contact_phone || 'Not provided'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">User Type:</td>
                                <td style="padding: 8px;">${data.user_id ? 'Registered User' : 'Guest'} ${data.seller_id ? '(Seller)' : ''}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa;">Created:</td>
                                <td style="padding: 8px;">${new Date(data.created_at).toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h4 style="color: #856404; margin-bottom: 10px;">Customer Message:</h4>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; line-height: 1.6; border-left: 3px solid #007bff;">
                            ${data.description.replace(/\n/g, '<br>')}
                        </div>
                    </div>

                    ${data.page_url ? `
                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h4 style="color: #856404; margin-bottom: 10px;">Technical Information:</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr>
                                <td style="padding: 5px; font-weight: bold; background-color: #f8f9fa;">Page URL:</td>
                                <td style="padding: 5px;"><a href="${data.page_url}" target="_blank">${data.page_url}</a></td>
                            </tr>
                            ${data.browser_info ? `
                            <tr>
                                <td style="padding: 5px; font-weight: bold; background-color: #f8f9fa;">Browser:</td>
                                <td style="padding: 5px; font-family: monospace; font-size: 12px;">${data.browser_info}</td>
                            </tr>` : ''}
                            ${data.ip_address ? `
                            <tr>
                                <td style="padding: 5px; font-weight: bold; background-color: #f8f9fa;">IP Address:</td>
                                <td style="padding: 5px; font-family: monospace;">${data.ip_address}</td>
                            </tr>` : ''}
                        </table>
                    </div>
                    ` : ''}

                    <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
                        <h4 style="color: #0c5460; margin-bottom: 10px;">⚡ Action Required</h4>
                        <p style="color: #0c5460; margin: 0;">
                            Please review this ticket and respond within our SLA timeframe.<br>
                            ${data.priority === 'CRITICAL' ? 'CRITICAL Priority - Response required within 1 hour' : 
                              data.priority === 'URGENT' ? 'URGENT Priority - Response required within 4 hours' :
                              data.priority === 'HIGH' ? 'HIGH Priority - Response required within 24 hours' :
                              'Response required within 48 hours'}
                        </p>
                    </div>
                </div>
            </div>
        `
    },

    ticketResponse: {
        subject: (ticketNumber: string) => `[${ticketNumber}] New response to your support ticket`,
        customerBody: (data: any) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 20px;">💬 Response to Your Ticket</h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #007bff;">Ticket: ${data.ticket_number}</h3>
                        <p style="color: #666; margin: 5px 0;"><strong>Subject:</strong> ${data.subject}</p>
                        <p style="color: #666; margin: 5px 0;"><strong>Status:</strong> 
                            <span style="background-color: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">
                                ${data.status}
                            </span>
                        </p>
                    </div>

                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h4 style="color: #333; margin-bottom: 15px;">Response from ${data.author_name || 'Support Team'}:</h4>
                        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 4px; border-left: 3px solid #007bff; line-height: 1.6;">
                            ${data.message.replace(/\n/g, '<br>')}
                        </div>
                        <p style="color: #666; font-size: 12px; margin-top: 10px;">
                            Responded on: ${new Date(data.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div style="background-color: #d4edda; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
                        <h4 style="color: #155724; margin-bottom: 10px;">💡 Need to Reply?</h4>
                        <p style="color: #155724; margin: 0;">
                            Simply reply to this email to continue the conversation. Your response will be added to ticket ${data.ticket_number}.
                        </p>
                    </div>
                </div>
            </div>
        `
    },

    ticketStatusChange: {
        subject: (ticketNumber: string, status: string) => `[${ticketNumber}] Ticket status updated to ${status}`,
        customerBody: (data: any) => `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333; margin-bottom: 20px;">📋 Ticket Status Update</h2>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #007bff;">Ticket: ${data.ticket_number}</h3>
                        <p style="color: #666; margin: 5px 0;"><strong>Subject:</strong> ${data.subject}</p>
                        <p style="color: #666; margin: 5px 0;"><strong>New Status:</strong> 
                            <span style="background-color: ${data.status === 'RESOLVED' ? '#28a745' : 
                                                             data.status === 'CLOSED' ? '#6c757d' : 
                                                             data.status === 'IN_PROGRESS' ? '#007bff' : '#17a2b8'}; 
                                         color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                                ${data.status}
                            </span>
                        </p>
                    </div>

                    ${data.resolution ? `
                    <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                        <h4 style="color: #333; margin-bottom: 10px;">Resolution Details:</h4>
                        <div style="background-color: #d4edda; padding: 15px; border-radius: 4px; border-left: 3px solid #28a745; line-height: 1.6;">
                            ${data.resolution.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="color: #6c757d; margin: 0;">
                            If you need further assistance, please reply to this email or create a new ticket.
                        </p>
                    </div>
                </div>
            </div>
        `
    }
};

// Send email function with logging
export const sendTicketEmail = async (
    emailType: string,
    ticketData: any,
    recipientEmail: string,
    recipientName?: string,
    responseData?: any
) => {
    let subject = '';
    let htmlBody = '';
    try {

        switch (emailType) {
            case 'ticket_created':
                subject = EMAIL_TEMPLATES.ticketCreated.subject(ticketData.ticket_number);
                htmlBody = EMAIL_TEMPLATES.ticketCreated.customerBody(ticketData);
                break;

            case 'ticket_created_support':
                subject = `🎫 [${ticketData.ticket_number}] New Support Ticket - ${ticketData.category} - ${ticketData.priority} Priority`;
                htmlBody = EMAIL_TEMPLATES.ticketCreated.supportBody(ticketData);
                break;

            case 'ticket_response':
                subject = EMAIL_TEMPLATES.ticketResponse.subject(ticketData.ticket_number);
                htmlBody = EMAIL_TEMPLATES.ticketResponse.customerBody({
                    ...ticketData,
                    ...responseData
                });
                break;

            case 'ticket_status_change':
                subject = EMAIL_TEMPLATES.ticketStatusChange.subject(ticketData.ticket_number, ticketData.status);
                htmlBody = EMAIL_TEMPLATES.ticketStatusChange.customerBody(ticketData);
                break;

            default:
                throw new Error(`Unknown email type: ${emailType}`);
        }

        // Send email
        const info = await transport.sendMail({
            from: `"${SUPPORT_CONFIG.fromName}" <${SUPPORT_CONFIG.fromEmail}>`,
            to: recipientEmail,
            subject: subject,
            html: htmlBody,
        });

        // Log email in database
        await prisma.ticket_email_log.create({
            data: {
                ticket_id: ticketData.id,
                email_type: emailType,
                recipient_email: recipientEmail,
                recipient_name: recipientName || null,
                subject: subject,
                body: htmlBody,
                status: 'sent',
                sent_at: new Date(),
                message_id: info.messageId,
                provider: 'nodemailer'
            }
        });

        console.log(`✅ Email sent successfully: ${emailType} to ${recipientEmail}`);
        return { success: true, messageId: info.messageId };

    } catch (error: any) {
        console.error(`❌ Failed to send email: ${emailType} to ${recipientEmail}`, error);
        
        const errorMessage = error?.message || 'Unknown error';
        
        // Log failed email
        try {
            await prisma.ticket_email_log.create({
                data: {
                    ticket_id: ticketData.id,
                    email_type: emailType,
                    recipient_email: recipientEmail,
                    recipient_name: recipientName || null,
                    subject: subject || 'Failed to generate subject',
                    body: htmlBody || 'Failed to generate body',
                    status: 'failed',
                    error_message: errorMessage,
                    provider: 'nodemailer'
                }
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return { success: false, error: errorMessage };
    }
};

// Send notification emails for new tickets
export const sendNewTicketEmails = async (ticketData: any) => {
    const results = [];

    // Send confirmation email to customer
    if (ticketData.contact_email) {
        const customerResult = await sendTicketEmail(
            'ticket_created',
            ticketData,
            ticketData.contact_email,
            ticketData.contact_name
        );
        results.push({ type: 'customer', ...customerResult });
    }

    // Send notification email to support team
    const supportResult = await sendTicketEmail(
        'ticket_created_support',
        ticketData,
        SUPPORT_CONFIG.supportEmail,
        SUPPORT_CONFIG.supportName
    );
    results.push({ type: 'support', ...supportResult });

    return results;
};

// Send response notification email
export const sendResponseEmail = async (ticketData: any, responseData: any) => {
    if (ticketData.contact_email && !responseData.is_from_customer) {
        return await sendTicketEmail(
            'ticket_response',
            ticketData,
            ticketData.contact_email,
            ticketData.contact_name,
            responseData
        );
    }
    return { success: true, message: 'No email needed' };
};

// Send status change notification
export const sendStatusChangeEmail = async (ticketData: any) => {
    if (ticketData.contact_email) {
        return await sendTicketEmail(
            'ticket_status_change',
            ticketData,
            ticketData.contact_email,
            ticketData.contact_name
        );
    }
    return { success: true, message: 'No email needed' };
};

export default {
    sendTicketEmail,
    sendNewTicketEmails,
    sendResponseEmail,
    sendStatusChangeEmail
};
