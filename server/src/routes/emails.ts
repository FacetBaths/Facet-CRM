import { Router, Response, NextFunction } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import schedule from 'node-schedule';
import { Email, IEmail } from '../models/Email';
import { EmailTemplate } from '../models/Email';
import Project, { IProject } from '../models/Project';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer';

const router = Router();

// Role filter middleware
const filterByUserRole = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.roles?.includes('admin')) return next();
  // For emails, scope to own projects/customers for sales, etc.
  (req as any).roleFilter = { createdBy: req.user._id };
  return next();
};

// Get all emails (sent/scheduled/drafts)
router.get('/', filterByUserRole, async (req: AuthRequest, res: Response) => {
  try {
    const query = { ...(req as any).roleFilter };
    const emails = await Email.find(query).sort({ createdAt: -1 });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get inbox (received emails)
router.get('/inbox', requireRole('admin', 'manager', 'sales'), async (_req: AuthRequest, res: Response) => {
  try {
    const config = {
      imap: {
        user: process.env.EMAIL_USER!,
        password: process.env.EMAIL_PASS!,
        host: process.env.EMAIL_HOST!,
        port: parseInt(process.env.EMAIL_PORT_IMAP || '993', 10),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      },
    };

    const connection: any = await imaps.connect(config);
    await connection.openBox('INBOX');
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);
    connection.end();

    // Parse, link, log, and save to DB
    const parsedMessages = [];
    for (const msg of messages) {
      const parsed = {
        subject: msg.parts[0].body.subject[0],
        from: msg.parts[0].body.from[0],
        body: msg.parts[1].body,
        to: msg.parts[0].body.to[0],
        receivedAt: new Date(),
        status: 'received',
      };

      // Try to link to customer by email
      const customer = await Customer.findOne({ 'contacts.email': parsed.from }).exec();
      let customerId, projectId;
      if (customer) {
        customerId = customer._id;
        // Optionally find related project
        const project = await Project.findOne({ customerId: customer._id }).exec();
        if (project) projectId = project._id;
      }

      const emailDoc = await Email.create({
        ...parsed,
        customerId,
        projectId,
        createdBy: null, // System
      });

      // Log activity
      if (projectId) {
        await Project.findByIdAndUpdate(projectId, {
          $push: { activities: { type: 'email', content: `Received email: ${parsed.subject} from ${parsed.from}` } },
        });
      } else if (customerId) {
        await Customer.findByIdAndUpdate(customerId, {
          $push: { activities: { type: 'email', content: `Received email: ${parsed.subject} from ${parsed.from}` } },
        });
      }

      parsedMessages.push(emailDoc);
    }

    res.json(parsedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// Send email
router.post('/send', requireRole('admin', 'manager', 'sales'), async (req: AuthRequest, res: Response) => {
  try {
    const emailData: Partial<IEmail> = req.body;
    emailData.createdBy = req.user!._id;
    emailData.status = 'sent';
    emailData.sentAt = new Date();

    // Send via nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST!,
      port: parseInt(process.env.EMAIL_PORT_SMTP || '465', 10),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: emailData.from || process.env.EMAIL_FROM,
      to: emailData.to,
      cc: emailData.cc,
      bcc: emailData.bcc,
      subject: emailData.subject,
      html: emailData.body,
    });

    const email = await Email.create(emailData);

    // Log activity if linked
    if (emailData.projectId) {
      await Project.findByIdAndUpdate(emailData.projectId, {
        $push: { activities: { type: 'email', content: `Email sent: ${email.subject}`, userId: req.user!._id } },
      });
    } else if (emailData.customerId) {
      await Customer.findByIdAndUpdate(emailData.customerId, {
        $push: { activities: { type: 'email', content: `Email sent: ${email.subject}`, userId: req.user!._id } },
      });
    }

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Schedule email
router.post('/schedule', requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const emailData: Partial<IEmail> = req.body;
    emailData.createdBy = req.user!._id;
    emailData.status = 'scheduled';

    const email = await Email.create(emailData);

    // Schedule sending
    schedule.scheduleJob(email.scheduledAt as Date, async () => {
      // Similar to send, but update status
      // ... implement sending logic
      await Email.findByIdAndUpdate(email._id, { status: 'sent', sentAt: new Date() });
      // Log activity
    });

    res.json(email);
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule email' });
  }
});

// Templates routes
router.get('/templates', requireRole('admin', 'manager'), async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await EmailTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/templates', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const template = await EmailTemplate.create(req.body);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

export default router;