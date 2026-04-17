import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Project } from '../models/Project';
import { AuthRequest, requireRole } from '../middleware/auth';
import { io } from '../index';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Generate project number
const generateProjectNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const count = await Project.countDocuments({
    projectNumber: { $regex: `^PR${year}${month}` },
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `PR${year}${month}${sequence}`;
};

// Middleware to filter projects by user role
const filterByUserRole = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Admins and managers see all projects
  if (req.user.roles?.includes('admin')) {
    return next();
  }
  
  // Sales reps only see their assigned projects
  if (req.user.roles?.includes('sales') || req.user.roles?.includes('bdc')) {
    // Add filter to query - user can only see projects where they're assigned
    (req as any).roleFilter = {
      $or: [
        { assignedSalesId: req.user._id },
        { 'commission.bdcRepId': req.user._id },
        { 'commission.salesReps.userId': req.user._id },
        { 'tasks.assignedTo': req.user._id },
      ],
    };
  }
  
  // Contractors see projects where they have tasks assigned
  if (req.user.roles?.includes('contractor')) {
    (req as any).roleFilter = {
      'tasks.assignedTo': req.user._id,
    };
  }
  
  next();
};

const auditMiddleware = (handler: (req: AuthRequest, res: Response) => Promise<void>) => async (req: AuthRequest, res: Response) => {
  let oldData = null;
  const projectId = req.params.id;
  try {
    if (projectId) {
      const oldProject = await Project.findById(projectId);
      oldData = oldProject ? oldProject.toObject() : null;
    }

    await handler(req, res);

    let newProject;
    if (projectId) {
      newProject = await Project.findById(projectId);
    } else if ((req as any).newProject) {
      newProject = (req as any).newProject;
    } else {
      return;
    }

    if (newProject && req.user) {
      const newData = newProject.toObject();
      const changes = simpleDiff(oldData || {}, newData);

      if (changes.length > 0) {
        const auditEntry = {
          timestamp: new Date(),
          userId: req.user._id,
          action: projectId ? `${req.method} ${req.path}` : 'create',
          changes,
        };
        newProject.auditLogs.push(auditEntry);
        await newProject.save();
        io.to(`project:${newProject._id}`).emit('project:updated', newProject);
      }
    }
  } catch (error) {
    console.error('Audit error:', error);
  }
};

const simpleDiff = (oldObj: any, newObj: any): { field: string; oldValue: any; newValue: any }[] => {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  for (const key of allKeys) {
    const oldVal = oldObj ? oldObj[key] : undefined;
    const newVal = newObj ? newObj[key] : undefined;
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
};

// Get projects by customer ID
router.get('/customer/:customerId', async (req: AuthRequest, res) => {
  try {
    const projects = await Project.find({ customerId: req.params.customerId })
      .populate('assignedSalesId', 'firstName lastName email')
      .populate('commission.bdcRepId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer projects' });
  }
});

// Get all projects with role-based filtering
router.get('/', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const { status, assignedTo, type, search, customerId } = req.query;
    let query: any = { ...(req as any).roleFilter || {} };
    
    if (status) query.status = status;
    if (assignedTo) query.assignedSalesId = assignedTo;
    if (type) query.type = type;
    if (customerId) query.customerId = customerId;
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { projectNumber: { $regex: search, $options: 'i' } },
        ],
      });
    }
    
    const projects = await Project.find(query)
      .populate('customerId', 'firstName lastName contacts')
      .populate('assignedSalesId', 'firstName lastName email phone')
      .populate('commission.bdcRepId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);
      
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID with role check
router.get('/:id', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    let query: any = { _id: req.params.id };
    const roleFilter = (req as any).roleFilter;
    
    // Apply role filter if not admin
    if (roleFilter && Object.keys(roleFilter).length > 0) {
      query = { ...query, ...roleFilter };
    }
    
    const project = await Project.findOne(query)
      .populate('customerId')
      .populate('assignedSalesId', 'firstName lastName email phone avatar')
      .populate('commission.bdcRepId', 'firstName lastName email avatar')
      .populate('commission.salesReps.userId', 'firstName lastName email avatar')
      .populate('lineItems.productId')
      .populate('tasks.assignedTo', 'firstName lastName avatar')
      .populate('activities.userId', 'firstName lastName email avatar')
      .populate('expenses.vendorId', 'name')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('updatedBy', 'firstName lastName email avatar')
      .populate('changeOrders.requestedBy', 'firstName lastName avatar')
      .populate('changeOrders.respondedBy', 'firstName lastName avatar')
      .populate('payments.recordedBy', 'firstName lastName avatar')
.populate('attachments.uploadedBy', 'firstName lastName avatar');
      
    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get project audit logs with pagination and filters
router.get('/:id/audit-logs', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const roleFilter = (req as any).roleFilter || {};
    const project = await Project.findOne({ _id: req.params.id, ...roleFilter }).select('auditLogs');

    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied' });
      return;
    }

    let logs = project.auditLogs;

    const { startDate, endDate, action, page = 1, limit = 20 } = req.query;
    if (startDate) {
      logs = logs.filter(l => l.timestamp >= new Date(startDate as string));
    }
    if (endDate) {
      logs = logs.filter(l => l.timestamp <= new Date(endDate as string));
    }
    if (action) {
      logs = logs.filter(l => l.action === action as string);
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedLogs = logs.slice(startIndex, endIndex);

    const populatedLogs = await Project.populate(paginatedLogs, {
      path: 'userId',
      select: 'firstName lastName email avatar'
    });

    res.json({
      logs: populatedLogs,
      total: logs.length,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Create project
router.post(
  '/',
  [
    body('customerId').notEmpty(),
    body('title').trim().notEmpty(),
    body('type').isIn(['renovation', 'service', 'warranty', 'retail']),
    body('address.street').notEmpty(),
    body('address.city').notEmpty(),
    body('address.state').notEmpty(),
    body('address.zip').notEmpty(),
  ],
  auditMiddleware(async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const projectNumber = await generateProjectNumber();
      
      // Set createdBy from authenticated user
      const projectData = {
        ...req.body,
        projectNumber,
        status: 'lead',
        createdBy: req.user?._id,
        activities: [{
          type: 'status_change',
          content: 'Project created',
          userId: req.user?._id,
          timestamp: new Date(),
        }],
      };
      
      const project = new Project(projectData);
      await project.save();
      
      const populatedProject = await Project.findById(project._id)
        .populate('customerId', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .populate('assignedSalesId', 'firstName lastName');
        
      req.newProject = populatedProject;
      res.status(201).json(populatedProject);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  })
);

// Update project with audit
router.put('/:id', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Check access for non-admins
    if (!req.user?.roles?.includes('admin')) {
      const hasAccess = 
        oldProject.assignedSalesId?.toString() === req.user?._id.toString() ||
        oldProject.commission?.bdcRepId?.toString() === req.user?._id.toString() ||
        oldProject.commission?.salesReps?.some((sr: any) => sr.userId.toString() === req.user?._id.toString());
      
      if (!hasAccess) {
        res.status(403).json({ error: 'Forbidden: Not assigned to this project' });
        return;
      }
    }
    
    const newStatus = req.body.status;
    
    // Handle commission subdocument specially - merge instead of replace
    const updateData: any = { ...req.body };
    if (updateData.commission && oldProject.commission) {
      updateData.commission = { ...(oldProject.commission as any).toObject(), ...updateData.commission };
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...updateData,
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName')
     .populate('updatedBy', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Add activity if status changed
    if (oldProject.status !== newStatus) {
      project.activities.push({
        type: 'status_change',
        content: `Status changed from ${oldProject.status} to ${newStatus}`,
        userId: req.user?._id,
        timestamp: new Date(),
      });
      await project.save();
    }
    
    // Emit update to connected clients
    io.to(`project:${req.params.id}`).emit('project:updated', project);
    
    res.json(project);
  } catch (error: any) {
    console.error('Failed to update project:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
})); 

// Add activity/note with audit
router.post('/:id/activities', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { type, content } = req.body;
    
    // Set updatedBy on project when activity is added
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          activities: {
            type,
            content,
            userId: req.user?._id,
            timestamp: new Date(),
          },
        },
        updatedBy: req.user?._id,
      },
      { new: true }
    ).populate('activities.userId', 'firstName lastName email');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Emit to connected clients
    const newActivity = project.activities[project.activities.length - 1];
    io.to(`project:${req.params.id}`).emit('project:activity', newActivity);
    
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add activity' });
  }
})); 

// Add task with audit
router.post('/:id/tasks', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { title, description, assignedTo, dueDate } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          tasks: {
            title,
            description,
            assignedTo,
            dueDate,
            status: 'pending',
          },
        },
        updatedBy: req.user?._id,
      },
      { new: true }
    ).populate('tasks.assignedTo', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    const newTask = project.tasks[project.tasks.length - 1];
    io.to(`project:${req.params.id}`).emit('project:task', { action: 'created', task: newTask });
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add task' });
  }
})); 

// Update task with audit
router.put('/:id/tasks/:taskId', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, 'tasks._id': req.params.taskId },
      {
        $set: {
          'tasks.$.status': status,
          ...(status === 'completed' ? { 'tasks.$.completedAt': new Date() } : {}),
          updatedBy: req.user?._id,
        },
      },
      { new: true }
    ).populate('tasks.assignedTo', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project or task not found' });
      return;
    }
    
    const task = project.tasks.find(t => t._id?.toString() === req.params.taskId);
    
    // Add activity
    project.activities.push({
      type: 'task_complete',
      content: `Task completed: ${task?.title}`,
      userId: req.user?._id,
      timestamp: new Date(),
    });
    await project.save();
    
    io.to(`project:${req.params.id}`).emit('project:task', { action: 'updated', task });
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
})); 

// Add payment with audit
router.post('/:id/payments', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { amount, type, method, notes } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          payments: {
            amount,
            type,
            method,
            date: new Date(),
            notes,
            recordedBy: req.user?._id,
          },
        },
        updatedBy: req.user?._id,
      },
      { new: true }
    ).populate('payments.recordedBy', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Check milestone completion
    const totalPaid = project.payments.reduce((sum, p) => sum + p.amount, 0);
    const percentPaid = (totalPaid / project.paymentTerms.total) * 100;
    
    // Update milestones if needed
    project.paymentTerms.milestones.forEach(m => {
      if (!m.completed && percentPaid >= m.percent) {
        m.completed = true;
      }
    });
    
    // Add activity
    project.activities.push({
      type: 'payment',
      content: `Payment received: $${amount.toLocaleString()} (${type})`,
      userId: req.user?._id,
      timestamp: new Date(),
    });
    await project.save();
    
    io.to(`project:${req.params.id}`).emit('project:payment', { amount, totalPaid, percentPaid });
    
    res.status(201).json(project.payments[project.payments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add payment' });
  }
})); 

// Edit payment with audit
router.put('/:id/payments/:paymentId', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { amount, type, method, notes, correctionReason } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Find payment by id using findIndex instead of .id()
    console.log('Edit: Looking for payment:', req.params.paymentId, 'in', project.payments?.length, 'payments');
    const paymentIndex = project.payments?.findIndex((p: any) => p._id?.toString() === req.params.paymentId) ?? -1;
    if (paymentIndex === -1) {
      console.error('Edit: Payment not found. Available payments:', project.payments?.map((p: any) => p._id?.toString()));
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    
    const payment = project.payments[paymentIndex];
    
    // Store original values for audit
    const originalAmount = payment.amount;
    
    // Update payment
    if (amount !== undefined) project.payments[paymentIndex].amount = amount;
    if (type) project.payments[paymentIndex].type = type;
    if (method) project.payments[paymentIndex].method = method;
    if (notes !== undefined) project.payments[paymentIndex].notes = notes;
    project.payments[paymentIndex].updatedAt = new Date();
    project.payments[paymentIndex].updatedBy = req.user?._id;
    
    // Add correction activity
    project.activities.push({
      type: 'payment_correction',
      content: `Payment corrected: $${originalAmount.toLocaleString()} → $${project.payments[paymentIndex].amount.toLocaleString()}${correctionReason ? ` (${correctionReason})` : ''}`,
      userId: req.user?._id,
      timestamp: new Date(),
      metadata: { paymentId: req.params.paymentId, originalAmount, newAmount: project.payments[paymentIndex].amount }
    });
    
    await project.save({ validateBeforeSave: false });
    
    // Recalculate totals
    const totalPaid = project.payments.reduce((sum, p) => sum + p.amount, 0);
    const contractAmount = project.paymentTerms?.total || project.contractAmount || 1;
    const percentPaid = contractAmount > 0 ? (totalPaid / contractAmount) * 100 : 0;
    
    io.to(`project:${req.params.id}`).emit('project:payment', { amount: project.payments[paymentIndex].amount, totalPaid, percentPaid });
    
    res.json((project.payments[paymentIndex] as any).toObject());
  } catch (error) {
    console.error('Edit payment error:', error);
    res.status(500).json({ error: 'Failed to update payment', details: (error as Error).message });
  }
})); 

// Delete/void payment with audit
router.delete('/:id/payments/:paymentId', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { voidReason } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Find payment by id using find instead of .id()
    console.log('Looking for payment:', req.params.paymentId, 'in', project.payments?.length, 'payments');
    const paymentIndex = project.payments?.findIndex((p: any) => p._id?.toString() === req.params.paymentId) ?? -1;
    if (paymentIndex === -1) {
      console.error('Payment not found. Available payments:', project.payments?.map((p: any) => p._id?.toString()));
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    
    const payment = project.payments[paymentIndex];
    
    // Instead of deleting, mark as voided
    const originalAmount = payment.amount;
    project.payments[paymentIndex].voided = true;
    project.payments[paymentIndex].voidedAt = new Date();
    project.payments[paymentIndex].voidedBy = req.user?._id;
    project.payments[paymentIndex].voidReason = voidReason || 'No reason provided';
    
    // Add void activity
    project.activities.push({
      type: 'payment_voided',
      content: `Payment of $${originalAmount.toLocaleString()} voided${voidReason ? `: ${voidReason}` : ''}`,
      userId: req.user?._id,
      timestamp: new Date(),
      metadata: { paymentId: req.params.paymentId, amount: originalAmount }
    });
    
    await project.save({ validateBeforeSave: false });
    
    // Recalculate totals (excluding voided payments)
    const totalPaid = project.payments
      .filter((p: any) => !p.voided)
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    const contractAmount = project.paymentTerms?.total || project.contractAmount || 1;
    const percentPaid = contractAmount > 0 ? (totalPaid / contractAmount) * 100 : 0;
    
    io.to(`project:${req.params.id}`).emit('project:payment', { amount: 0, totalPaid, percentPaid, voided: true });
    
    res.json({ message: 'Payment voided', payment: (project.payments[paymentIndex] as any).toObject() });
  } catch (error) {
    console.error('Void payment error:', error);
    res.status(500).json({ error: 'Failed to void payment', details: (error as Error).message });
  }
})); 

// Add expense with audit
router.post('/:id/expenses', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const expense = {
      ...req.body,
      date: new Date(req.body.date),
    };
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $push: { expenses: expense },
        $set: { updatedBy: req.user?._id },
      },
      { new: true }
    ).populate('expenses.vendorId', 'name');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    res.status(201).json(project.expenses[project.expenses.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
})); 

// Create change order with audit
router.post('/:id/change-orders', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { description, reason, amount } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          changeOrders: {
            description,
            reason,
            amount,
            status: 'pending',
            requestedBy: req.user?._id,
            requestedAt: new Date(),
          },
        },
        $set: { updatedBy: req.user?._id },
      },
      { new: true }
    ).populate('changeOrders.requestedBy', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    const newCO = project.changeOrders[project.changeOrders.length - 1];
    io.to(`project:${req.params.id}`).emit('project:changeOrder', { action: 'created', changeOrder: newCO });
    
    res.status(201).json(newCO);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create change order' });
  }
})); 

// Respond to change order with audit
router.put('/:id/change-orders/:coId', requireRole('admin'), auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, 'changeOrders._id': req.params.coId },
      {
        $set: {
          'changeOrders.$.status': status,
          'changeOrders.$.respondedBy': req.user?._id,
          'changeOrders.$.respondedAt': new Date(),
          updatedBy: req.user?._id,
        },
      },
      { new: true }
    ).populate('changeOrders.requestedBy', 'firstName lastName')
     .populate('changeOrders.respondedBy', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project or change order not found' });
      return;
    }
    
    const co = project.changeOrders.find(c => c._id?.toString() === req.params.coId);
    
    // Add activity
    project.activities.push({
      type: 'status_change',
      content: `Change order ${status}: ${co?.description}`,
      userId: req.user?._id,
      timestamp: new Date(),
    });
    await project.save();
    
    io.to(`project:${req.params.id}`).emit('project:changeOrder', { action: 'updated', changeOrder: co });
    
    res.json(co);
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond to change order' });
  }
})); 

// Calculate commission with audit
router.post('/:id/calculate-commission', requireRole('admin'), auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { salesRepIds = [], useFlatRate = false, splitPercentages = [] } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Validate sales reps are provided
    if (!salesRepIds || salesRepIds.length === 0) {
      res.status(400).json({ error: 'No sales representatives assigned. Please assign at least one sales rep to the project before calculating commission.' });
      return;
    }
    
    const contractAmount = project.contractAmount || 0;
    const commissionData: any = {
      calculatedAt: new Date(),
      salesReps: [],
      spiffs: project.commission?.spiffs || [], // preserve existing spiffs
    };
    
    // Calculate sales commission - supports split
    if (salesRepIds.length > 0) {
      const totalPercent = splitPercentages.reduce((sum: number, p: number) => sum + p, 0);
      const normalizedPercentages = totalPercent === 100 
        ? splitPercentages 
        : salesRepIds.map(() => 100 / salesRepIds.length);
      
      // Determine base amount (flat or percentage)
      let baseAmount = 0;
      let calcMethod: 'flat' | 'percentage' = 'percentage';
      
      if (useFlatRate) {
        baseAmount = 400; // flat rate
        calcMethod = 'flat';
      } else {
        baseAmount = contractAmount * 0.10; // 10%
        calcMethod = 'percentage';
      }
      
      commissionData.calcMethod = calcMethod;
      
      // Split among reps
      for (let i = 0; i < salesRepIds.length; i++) {
        const userId = salesRepIds[i];
        const splitPercent = normalizedPercentages[i] || (100 / salesRepIds.length);
        const amount = Math.round(baseAmount * (splitPercent / 100) * 100) / 100;
        
        commissionData.salesReps.push({
          userId,
          splitPercent,
          amount,
          paid: false,
        });
      }
    }
    
    // Calculate BDC commission (1% of contract)
    if (project.commission?.bdcRepId) {
      commissionData.bdcRepId = project.commission.bdcRepId;
      commissionData.bdcAmount = Math.round(contractAmount * 0.01 * 100) / 100; // 1%
      commissionData.bdcPaid = project.commission.bdcPaid || false;
    }
    
    // Update project with calculated commission
    // Handle case where commission is undefined (Mongoose subdocument) or plain object
    const existingCommission = project.commission 
      ? (typeof (project.commission as any).toObject === 'function' ? (project.commission as any).toObject() : project.commission)
      : {};
    project.commission = { ...existingCommission, ...commissionData };
    project.updatedBy = req.user?._id;
    await project.save();
    
    res.json(project.commission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate commission' });
  }
})); 

// Add spiff/bonus with audit
router.post('/:id/spiffs', auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { description, amount, awardedTo } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          'commission.spiffs': {
            description,
            amount,
            awardedTo,
            paid: false,
          },
        },
        $set: { updatedBy: req.user?._id },
      },
      { new: true }
    ).populate('commission.spiffs.awardedTo', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    const newSpiff = project.commission.spiffs[project.commission.spiffs.length - 1];
    res.status(201).json(newSpiff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add spiff' });
  }
})); 

// Mark commission as paid with audit
router.put('/:id/commission/pay', requireRole('admin'), auditMiddleware(async (req: AuthRequest, res) => {
  try {
    const { type, userId, spiffIndex } = req.body;
    
    const updateField: any = {};
    
    if (type === 'bdc') {
      updateField['commission.bdcPaid'] = true;
      updateField['commission.bdcPaidDate'] = new Date();
    } else if (type === 'admin') {
      updateField['commission.adminPaid'] = true;
      updateField['commission.adminPaidDate'] = new Date();
    } else if (type === 'spiff' && spiffIndex !== undefined) {
      updateField[`commission.spiffs.${spiffIndex}.paid`] = true;
      updateField[`commission.spiffs.${spiffIndex}.paidDate`] = new Date();
    } else if (type === 'sales' && userId) {
      // Find the specific sales rep in the array
      const project = await Project.findById(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      
      const salesRepIndex = project.commission.salesReps.findIndex(
        (sr: any) => sr.userId.toString() === userId
      );
      
      if (salesRepIndex === -1) {
        res.status(404).json({ error: 'Sales rep not found in commission' });
        return;
      }
      
      updateField[`commission.salesReps.${salesRepIndex}.paid`] = true;
      updateField[`commission.salesReps.${salesRepIndex}.paidDate`] = new Date();
    }
    
    updateField['updatedBy'] = req.user?._id;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateField },
      { new: true }
    );
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    res.json({ success: true, commission: project.commission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark commission as paid' });
  }
})); 

// Get commission report (admin only)
router.get('/commissions/report', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, userId, role } = req.query;
    
    let dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter['commission.calculatedAt'] = {};
      if (startDate) dateFilter['commission.calculatedAt'].$gte = new Date(startDate as string);
      if (endDate) dateFilter['commission.calculatedAt'].$lte = new Date(endDate as string);
    }
    
    let userFilter: any = {};
    if (userId) {
      if (role === 'bdc') {
        userFilter['commission.bdcRepId'] = userId;
      } else {
        userFilter['commission.salesReps.userId'] = userId;
      }
    }
    
    const projects = await Project.find({
      ...dateFilter,
      ...userFilter,
      'commission.calculatedAt': { $exists: true },
    }).populate('customerId', 'firstName lastName')
      .populate('commission.salesReps.userId', 'firstName lastName')
      .populate('commission.bdcRepId', 'firstName lastName')
      .sort({ 'commission.calculatedAt': -1 });
    
    // Calculate totals
    const report = {
      projects,
      totals: {
        salesCommission: projects.reduce((sum, p) => sum + (p.commission?.salesReps?.reduce((s: number, sr: any) => s + (sr.amount || 0), 0) || 0), 0),
        bdcCommission: projects.reduce((sum, p) => sum + (p.commission?.bdcAmount || 0), 0),
        total: 0,
        paid: 0,
        unpaid: 0,
      },
    };
    
    report.totals.total = report.totals.salesCommission + report.totals.bdcCommission;
    
    // Calculate paid/unpaid
    projects.forEach(p => {
      p.commission?.salesReps?.forEach((sr: any) => {
        if (sr.paid) report.totals.paid += sr.amount || 0;
        else report.totals.unpaid += sr.amount || 0;
      });
      
      if (p.commission?.bdcPaid) report.totals.paid += p.commission.bdcAmount || 0;
      else report.totals.unpaid += p.commission?.bdcAmount || 0;
    });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate commission report' });
  }
});

// Get dashboard stats (role-based)\nrouter.get('/stats/dashboard', async (req: AuthRequest, res) => {\n  try {\n    const user = req.user;\n    if (!user) {\n      res.status(401).json({ error: 'Unauthorized' });\n      return;\n    }\n    \n    let query: any = {};\n    \n    // Filter by role\n    if (!user.roles?.includes('admin')) {\n      query = {\n        $or: [\n          { assignedSalesId: user._id },\n          { 'commission.bdcRepId': user._id },\n          { 'commission.salesReps.userId': user._id },\n        ],\n      };\n    }\n    \n    const [totalProjects, activeProjects, pendingTasks, totalContractValue] = await Promise.all([\n      Project.countDocuments(query),\n      Project.countDocuments({ ...query, status: { $nin: ['completed', 'cancelled'] } }),\n      Project.aggregate([\n        { $match: query },\n        { $unwind: '$tasks' },\n        { $match: { 'tasks.status': { $in: ['pending', 'in_progress'] } } },\n        { $count: 'count' },\n      ]).then(r => r[0]?.count || 0),\n      Project.aggregate([\n        { $match: query },\n        { $group: { _id: null, total: { $sum: '$contractAmount' } } },\n      ]).then(r => r[0]?.total || 0),\n    ]);\n    \n    // Get projects by status for chart\n    const projectsByStatus = await Project.aggregate([\n      { $match: query },\n      { $group: { _id: '$status', count: { $sum: 1 } } },\n    ]);\n    \n    res.json({\n      totalProjects,\n      activeProjects,\n      pendingTasks,\n      totalContractValue,\n      projectsByStatus: projectsByStatus.reduce((acc, curr) => {\n        acc[curr._id] = curr.count;\n        return acc;\n      }, {} as Record<string, number>),\n    });\n  } catch (error) {\n    res.status(500).json({ error: 'Failed to fetch dashboard stats' });\n  }\n});\n\nrouter.get('/:id/pnl', filterByUserRole, requireRole('admin', 'manager'), async (req: AuthRequest, res: Response) => {\n  try {\n    const project = await Project.findById(req.params.id);\n    if (!project) {\n      return res.status(404).json({ error: 'Project not found' });\n    }\n\n    const approvedChanges = project.changeOrders\n      .filter(co => co.status === 'approved')\n      .reduce((sum, co) => sum + co.amount, 0);\n    const totalRevenue = project.contractAmount + approvedChanges;\n\n    const receivedPayments = project.payments\n      .filter(p => !p.voided)\n      .reduce((sum, p) => sum + p.amount, 0);\n\n    const totalExpenses = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);\n    const laborCosts = project.expenses\n      .filter(exp => exp.category === 'labor')\n      .reduce((sum, exp) => sum + exp.amount, 0);\n    const otherExpenses = totalExpenses - laborCosts;\n\n    const commissionCosts = project.commission.salesReps.reduce((sum, rep) => sum + rep.amount, 0) +\n      (project.commission.bdcAmount || 0) +\n      project.commission.spiffs.reduce((sum, spiff) => sum + spiff.amount, 0);\n\n    const totalCosts = totalExpenses + commissionCosts;\n    const profit = totalRevenue - totalCosts;\n\n    res.json({\n      totalRevenue,\n      receivedPayments,\n      totalCosts,\n      laborCosts,\n      otherExpenses,\n      commissionCosts,\n      profit\n    });\n  } catch (error) {\n    res.status(500).json({ error: 'Failed to calculate PnL' });\n  }\n});\n\n

// @ts-ignore
const storage = multer.diskStorage({
  // @ts-ignore
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/projects', req.params.id as string);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  // @ts-ignore
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  // @ts-ignore
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'));
    }
  }
});

// @ts-ignore
router.post('/:id/uploads', filterByUserRole, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file as any;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Project not found' });
    }

    const attachment = {
      filename: file.originalname,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      // @ts-ignore
      type: (req.body.type as 'contract' | 'photo' | 'other') || 'other',
      uploadedBy: req.user!._id,
      uploadedAt: new Date(),
    };

    project.attachments.push(attachment);
    project.updatedBy = req.user!._id;
    await project.save();

    const addedAttachment = project.attachments[project.attachments.length - 1];

    const activity = {
      type: 'file_upload' as const,
      content: `File uploaded: ${file.originalname}`,
      userId: req.user!._id,
      timestamp: new Date(),
      metadata: { attachmentId: addedAttachment._id }
    };
    project.activities.push(activity);
    await project.save();

    io.to(`project:${req.params.id}`).emit('project:activity', activity);
    io.to(`project:${req.params.id}`).emit('project:updated', project);

    res.json(addedAttachment);
  } catch (error: any) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

export default router;
