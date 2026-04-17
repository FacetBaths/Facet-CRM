import { Router, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { Email, IEmail } from '../models/Emails';
import { Customer } from '../models/Customer';
import { Project } from '../models/Project';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

import { io } from '../index'; // Import socket.io instance

const router = Router();

// Role-based filter middleware for emails
const filterByUserRole = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const { roles, _id: userId } = req.user;
  
  if (roles?.includes('admin') || roles?.includes('manager')) {
    return next(); // Admins and managers see all
  }
  
  if (roles?.includes('sales')) {
    // Sales see emails related to their projects
    (req as any).roleFilter = { assignedSalesId: userId };
    return next();
  }
  
  // Default: no access
  return res.status(403).json({ error: 'Insufficient permissions' });
};

// List emails with role-based filtering
router.get('/', filterByUserRole, async (req: AuthRequest, res: Response) => {
  try {
    const query = { ...(req as any).roleFilter };
    const emails = await Email.find(query).sort({ receivedAt: -1 });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Send email
router.post('/send', requireRole('admin', 'manager', 'sales'), async (req: AuthRequest, res: Response) => {
  try {
    const { to, subject, bodyText, bodyHtml, attachments, projectId, customerId } = req.body;

    // Create transporter with env credentials
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: Number(process.env.EMAIL_SMTP_PORT),
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: bodyText,
      html: bodyHtml,
      attachments,
    });

    // Save to database
    const emailData: Partial<IEmail> = {
      from: process.env.EMAIL_FROM || '',
      to: Array.isArray(to) ? to : [to],
      subject,
      bodyText,
      bodyHtml,
      attachments: attachments || [],
      sentAt: new Date(),
      status: 'sent',
      projectId,
      customerId,
      createdBy: req.user?._id,
    };

    const email = new Email(emailData);
    await email.save();
io.emit('email:received', email);

    // Broadcast via Socket.io (detailed in later task)
    io.emit('email:sent', email);

    res.status(201).json({ message: 'Email sent successfully', email });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Receive/sync emails (placeholder for IMAP sync)
async function syncEmails() {
  try {
    const client = new ImapFlow({
      host: process.env.EMAIL_IMAP_HOST!,
      port: Number(process.env.EMAIL_IMAP_PORT!),
      secure: process.env.EMAIL_IMAP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_IMAP_USER!,
        pass: process.env.EMAIL_IMAP_PASS!,
      },
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      for await (let msg of client.fetch('1:*', { envelope: true, bodyStructure: true, source: true })) {
        if (!msg.envelope || !msg.envelope.from || !msg.envelope.from[0] || !msg.envelope.from[0].address || !msg.envelope.to || !msg.envelope.to.length || !msg.envelope.subject) continue;

        const emailData: Partial<IEmail> = {
          from: msg.envelope.from[0].address,
          to: msg.envelope.to.map(t => t.address || ''),
          cc: msg.envelope.cc?.map(c => c.address || '') || [],
          bcc: msg.envelope.bcc?.map(b => b.address || '') || [],
          subject: msg.envelope.subject,
          bodyText: msg.source?.toString() || '',
          attachments: (msg.bodyStructure?.childNodes || []).filter((node: any) => node.disposition?.type === 'attachment').map((node: any) => ({
            filename: node.disposition?.params?.filename || '',
            contentType: node.type || '',
            size: node.size || 0,
          })),
          receivedAt: msg.envelope.date || new Date(),
          status: 'inbox',
          threadId: msg.envelope.messageId || '',
        };

        const existing = await Email.findOne({ threadId: emailData.threadId });
        if (existing || !emailData.threadId) continue;

        const email = new Email(emailData);
        await email.save();
io.emit('email:received', email);

        const customer = await Customer.findOne({ 'contacts.email': { $in: [...(emailData.to || []), emailData.from || ''] } });
        if (customer) {
          email.customerId = customer._id;
          const project = await Project.findOne({ customerId: customer._id }).sort({ createdAt: -1 });
          if (project) {
            email.projectId = project._id;
            await Project.updateOne(
              { _id: project._id },
              {
                $push: {
                  activities: {
                    type: 'email',
                    content: `New email: ${emailData.subject}`,
                    timestamp: new Date(),
                    metadata: { emailId: email._id }
                  }
                }
              }
            );
            await email.save();
io.emit('email:received', email); // Update with projectId
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return { message: 'Emails synced successfully' };
  } catch (error) {
    console.error('Email sync error:', error);
    throw error;
  }
}

router.get('/sync', requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    console.log(`Sync initiated by user ${userId}`);
    await syncEmails();
    res.json({ message: 'Emails synced successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync emails' });
  }
});

export { syncEmails };

export default router;
