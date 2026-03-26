import { Router } from 'express';
import { body } from 'express-validator';
import { Project } from '../models/Project';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';

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

// Get projects by customer ID
router.get('/customer/:customerId', async (req: AuthRequest, res) => {
  try {
    const projects = await Project.find({ customerId: req.params.customerId })
      .populate('assignedSalesId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer projects' });
  }
});

// Get all projects
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, assignedTo, type, search } = req.query;
    let query: any = {};
    
    if (status) query.status = status;
    if (assignedTo) query.assignedSalesId = assignedTo;
    if (type) query.type = type;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { projectNumber: { $regex: search, $options: 'i' } },
      ];
    }
    
    const projects = await Project.find(query)
      .populate('customerId', 'firstName lastName contacts')
      .populate('assignedSalesId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);
      
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('customerId')
      .populate('assignedSalesId', 'firstName lastName email phone')
      .populate('lineItems.productId')
      .populate('tasks.assignedTo', 'firstName lastName')
      .populate('activities.userId', 'firstName lastName')
      .populate('expenses.vendorId', 'name');
      
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
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
  async (req: AuthRequest, res) => {
    try {
      const projectNumber = await generateProjectNumber();
      
      const project = new Project({
        ...req.body,
        projectNumber,
        status: 'lead',
        activities: [{
          type: 'status_change',
          content: 'Project created',
          timestamp: new Date(),
        }],
      });
      
      await project.save();
      
      const populatedProject = await Project.findById(project._id)
        .populate('customerId', 'firstName lastName');
        
      res.status(201).json(populatedProject);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// Update project
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    const newStatus = req.body.status;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName');
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Add activity if status changed
    if (oldProject && oldProject.status !== newStatus) {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Add activity/note
router.post('/:id/activities', async (req: AuthRequest, res) => {
  try {
    const { type, content } = req.body;
    
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
      },
      { new: true }
    ).populate('activities.userId', 'firstName lastName');
    
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
});

// Add task
router.post('/:id/tasks', async (req: AuthRequest, res) => {
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
});

// Update task
router.put('/:id/tasks/:taskId', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, 'tasks._id': req.params.taskId },
      {
        $set: {
          'tasks.$.status': status,
          ...(status === 'completed' ? { 'tasks.$.completedAt': new Date() } : {}),
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
});

// Add payment
router.post('/:id/payments', async (req: AuthRequest, res) => {
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
      },
      { new: true }
    );
    
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
    await project.save();
    
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
});

// Add expense
router.post('/:id/expenses', async (req: AuthRequest, res) => {
  try {
    const expense = {
      ...req.body,
      date: new Date(req.body.date),
    };
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { expenses: expense } },
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
});

// Create change order
router.post('/:id/change-orders', async (req: AuthRequest, res) => {
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
});

// Calculate commission for a project
// Commission rules:
// - Sales/Design: 10% OR $400 flat (toggle-based per user)
// - BDC: 1% of contract (for setting appointment)
// - Admin (owner level): 3%
// - Admin (other): 2%
router.post('/:id/calculate-commission', async (req: AuthRequest, res) => {
  try {
    const { User } = await import('../models/User');
    const { salesRepIds = [], useFlatRate = false, splitPercentages = [] } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
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
        : splitPercentages.map(() => 100 / salesRepIds.length);
      
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
    project.commission = { ...project.commission?.toObject(), ...commissionData };
    await project.save();
    
    res.json(project.commission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate commission' });
  }
});

// Add spiff/bonus to a project
router.post('/:id/spiffs', async (req: AuthRequest, res) => {
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
      },
      { new: true }
    );
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    const newSpiff = project.commission.spiffs[project.commission.spiffs.length - 1];
    res.status(201).json(newSpiff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add spiff' });
  }
});

// Mark commission as paid (updated for split commissions)
router.put('/:id/commission/pay', async (req: AuthRequest, res) => {
  try {
    const { type, userId, spiffIndex } = req.body; 
    // type: 'sales', 'bdc', 'admin', or 'spiff'
    
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
});

// Get commission report
router.get('/commissions/report', async (req: AuthRequest, res) => {
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
        userFilter['commission.salesRepId'] = userId;
      }
    }
    
    const projects = await Project.find({
      ...dateFilter,
      ...userFilter,
      'commission.calculatedAt': { $exists: true },
    }).populate('customerId', 'firstName lastName')
      .populate('commission.salesRepId', 'firstName lastName')
      .populate('commission.bdcRepId', 'firstName lastName')
      .sort({ 'commission.calculatedAt': -1 });
    
    // Calculate totals
    const report = {
      projects,
      totals: {
        salesCommission: projects.reduce((sum, p) => sum + (p.commission?.salesAmount || 0), 0),
        bdcCommission: projects.reduce((sum, p) => sum + (p.commission?.bdcAmount || 0), 0),
        designCommission: projects.reduce((sum, p) => sum + (p.commission?.designAmount || 0), 0),
        total: 0,
        paid: 0,
        unpaid: 0,
      },
    };
    
    report.totals.total = report.totals.salesCommission + report.totals.bdcCommission + report.totals.designCommission;
    
    // Calculate paid/unpaid
    projects.forEach(p => {
      if (p.commission?.salesPaid) report.totals.paid += p.commission.salesAmount || 0;
      else report.totals.unpaid += p.commission?.salesAmount || 0;
      
      if (p.commission?.bdcPaid) report.totals.paid += p.commission.bdcAmount || 0;
      else report.totals.unpaid += p.commission?.bdcAmount || 0;
    });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate commission report' });
  }
});

export default router;
