import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { CalendarEvent } from '../models/CalendarEvent';
import { AuthRequest, requireRole } from '../middleware/auth';
import { io } from '../index';

const router = Router();

// Role-based filter middleware
const filterByUserRole = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.roles?.includes('admin')) {
    return next();
  }

  (req as any).roleFilter = { assignedUserIds: req.user._id };

  next();
};

router.get('/', filterByUserRole, async (req: AuthRequest, res: Response) => {
  try {
    const { start, end, userId, projectId } = req.query;
    let query: any = { ...(req as any).roleFilter || {} };

    if (start || end) {
      query.$or = [
        { startTime: { $gte: new Date(start as string), $lte: new Date(end as string) } },
        { endTime: { $gte: new Date(start as string), $lte: new Date(end as string) } },
        {
          $and: [
            { startTime: { $lte: new Date(start as string) } },
            { endTime: { $gte: new Date(end as string) } }
          ]
        }
      ];
    }

    if (userId) query.assignedUserIds = userId;
    if (projectId) query.projectId = projectId;

    const events = await CalendarEvent.find(query)
      .populate('projectId', 'title projectNumber')
      .populate('customerId', 'firstName lastName')
      .populate('assignedUserIds', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ startTime: 1 });

    return res.json(events);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/:id', filterByUserRole, async (req: AuthRequest, res: Response) => {
  try {
    let query: any = { _id: req.params.id };
    const roleFilter = (req as any).roleFilter;
    if (roleFilter) {
      query = { ...query, ...roleFilter };
    }

    const event = await CalendarEvent.findOne(query)
      .populate('projectId', 'title projectNumber')
      .populate('customerId', 'firstName lastName')
      .populate('assignedUserIds', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!event) {
      return res.status(404).json({ error: 'Event not found or access denied' });
    }

    return res.json(event);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('type').isIn(['sales_appointment', 'install_slot', 'delivery', 'other']),
    body('startTime').isISO8601().toDate(),
    body('endTime').isISO8601().toDate().custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('endTime must be after startTime');
      }
      return true;
    }),
    body('assignedUserIds').optional().isArray(),
    body('projectId').optional().isMongoId(),
    body('customerId').optional().isMongoId(),
    body('status').optional().isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
    body('source').optional().isIn(['crm_created', 'imported']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const eventData = {
        ...req.body,
        createdBy: req.user?._id,
      };

      const hasConflict = await checkConflicts(eventData);
      if (hasConflict) {
        return res.status(409).json({ error: 'Conflict with existing event' });
      }

      const event = new CalendarEvent(eventData);
      await event.save();

      const populatedEvent = await CalendarEvent.findById(event._id)
        .populate('projectId', 'title projectNumber')
        .populate('customerId', 'firstName lastName')
        .populate('assignedUserIds', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName');

      if (event.projectId) {
        io.to(`project:${event.projectId}`).emit('project:event', { action: 'created', event: populatedEvent });
      }

      return res.status(201).json(populatedEvent);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create event', details: error.message });
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('title').optional().trim().notEmpty(),
    body('type').optional().isIn(['sales_appointment', 'install_slot', 'delivery', 'other']),
    body('startTime').optional().isISO8601().toDate(),
    body('endTime').optional().isISO8601().toDate(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existingEvent = await CalendarEvent.findById(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user?._id,
      };

      const startTime = updateData.startTime || existingEvent.startTime;
      const endTime = updateData.endTime || existingEvent.endTime;
      if (new Date(endTime) <= new Date(startTime)) {
        return res.status(400).json({ error: 'endTime must be after startTime' });
      }

      const eventData = { ...existingEvent.toObject(), ...updateData };

      const hasConflict = await checkConflicts(eventData, req.params.id);
      if (hasConflict) {
        return res.status(409).json({ error: 'Conflict with existing event' });
      }

      const event = await CalendarEvent.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

      const populatedEvent = await CalendarEvent.findById(event!._id)
        .populate('projectId', 'title projectNumber')
        .populate('customerId', 'firstName lastName')
        .populate('assignedUserIds', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName');

      if (event!.projectId) {
        io.to(`project:${event!.projectId}`).emit('project:event', { action: 'updated', event: populatedEvent });
      }

      return res.json(populatedEvent);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update event', details: error.message });
    }
  }
);

async function checkConflicts(eventData: any, excludeId?: string): Promise<boolean> {
  const { assignedUserIds = [], projectId, startTime, endTime } = eventData;

  if (assignedUserIds.length === 0 && !projectId) return false;

  const overlapQuery: any = {
    $or: [],
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeId) {
    overlapQuery._id = { $ne: excludeId };
  }

  if (assignedUserIds.length > 0) {
    overlapQuery.$or.push({ assignedUserIds: { $in: assignedUserIds } });
  }

  if (projectId) {
    overlapQuery.$or.push({ projectId });
  }

  const conflictingEvent = await CalendarEvent.findOne(overlapQuery);
  return !!conflictingEvent;
}

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const event = await CalendarEvent.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.projectId) {
      io.to(`project:${event.projectId}`).emit('project:event', { action: 'deleted', eventId: req.params.id });
    }

    return res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;