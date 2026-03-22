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

export default router;
