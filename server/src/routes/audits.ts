import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest, requireRole } from '../middleware/auth';
import { Project } from '../models/Project';
import { Customer } from '../models/Customer';

const router = Router();

// Get global audit logs with filters (admin only)
router.get('/', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId, dateFrom, dateTo, userId, action } = req.query;

    const match: any = {};
    if (dateFrom) match.timestamp = { $gte: new Date(dateFrom as string) };
    if (dateTo) match.timestamp = { ...(match.timestamp || {}), $lte: new Date(dateTo as string) };
    if (userId) match.userId = new mongoose.Types.ObjectId(userId as string);
    if (action) match.action = action;

    let audits: any[] = [];

    if (!entityType || entityType === 'project') {
      const projectMatch = entityId ? { _id: new mongoose.Types.ObjectId(entityId as string) } : {};
      const projectAudits = await Project.aggregate([
        { $match: projectMatch },
        { $unwind: '$auditLogs' },
        { $match: match },
        { $sort: { 'auditLogs.timestamp': -1 } },
        { $project: {
          _id: '$auditLogs._id',
          entityType: 'project',
          entityId: '$_id',
          action: '$auditLogs.action',
          userId: '$auditLogs.userId',
          timestamp: '$auditLogs.timestamp',
          changes: '$auditLogs.changes'
        } }
      ]);
      audits = [...audits, ...projectAudits];
    }

    if (!entityType || entityType === 'customer') {
      const customerMatch = entityId ? { _id: new mongoose.Types.ObjectId(entityId as string) } : {};
      const customerAudits = await Customer.aggregate([
        { $match: customerMatch },
        { $unwind: '$auditLogs' },
        { $match: match },
        { $sort: { 'auditLogs.timestamp': -1 } },
        { $project: {
          _id: '$auditLogs._id',
          entityType: 'customer',
          entityId: '$_id',
          action: '$auditLogs.action',
          userId: '$auditLogs.userId',
          timestamp: '$auditLogs.timestamp',
          changes: '$auditLogs.changes'
        } }
      ]);
      audits = [...audits, ...customerAudits];
    }

    // Sort all audits together
    audits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(audits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

export default router;
