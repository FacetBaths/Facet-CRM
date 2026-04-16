import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Customer } from '../models/Customer';
import { Project } from '../models/Project';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to filter customers by user role
const filterByUserRole = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Admins see all customers
  if (req.user.roles?.includes('admin')) {
    return next();
  }
  
  // Sales reps see customers assigned to them OR customers with projects they're on
  if (req.user.roles?.includes('sales') || req.user.roles?.includes('bdc')) {
    // First, get all projects this user is associated with
    const projects = await Project.find({
      $or: [
        { assignedSalesId: req.user._id },
        { 'commission.bdcRepId': req.user._id },
        { 'commission.salesReps.userId': req.user._id },
      ],
    }).select('customerId');
    
    const customerIds = projects.map(p => p.customerId.toString());
    
    (req as any).roleFilter = {
      $or: [
        { assignedSalesId: req.user._id },
        { _id: { $in: customerIds } },
      ],
    };
  }
  
  next();
};

// Get all customers with role-based filtering
router.get('/', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;
    let query: any = { ...(req as any).roleFilter || {} };
    
    if (search) {
      const searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { 'contacts.email': { $regex: search, $options: 'i' } },
          { 'contacts.phone': { $regex: search, $options: 'i' } },
        ],
      };
      
      if (query.$or) {
        query = { $and: [query, searchQuery] };
      } else {
        query = { ...query, ...searchQuery };
      }
    }
    
    const customers = await Customer.find(query)
      .populate('assignedSalesId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ lastName: 1, firstName: 1 })
      .limit(100);
      
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID with role check
router.get('/:id', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    let query: any = { _id: req.params.id };
    const roleFilter = (req as any).roleFilter;
    
    if (roleFilter && Object.keys(roleFilter).length > 0) {
      query = { ...query, ...roleFilter };
    }
    
    const customer = await Customer.findOne(query)
      .populate('assignedSalesId', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName');
      
    if (!customer) {
      res.status(404).json({ error: 'Customer not found or access denied' });
      return;
    }
    
    // Get customer's projects with assignment info
    const projects = await Project.find({ customerId: customer._id })
      .populate('assignedSalesId', 'firstName lastName')
      .populate('commission.bdcRepId', 'firstName lastName')
      .select('projectNumber title status assignedSalesId commission.bdcRepId contractAmount createdAt')
      .sort({ createdAt: -1 });
    
    res.json({
      ...customer.toObject(),
      projects,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer with audit
router.post(
  '/',
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('contacts').isArray(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const customerData = {
        ...req.body,
        createdBy: req.user?._id,
        // If sales rep creates customer, assign to them by default
        assignedSalesId: req.body.assignedSalesId || (req.user?.roles?.includes('sales') ? req.user._id : undefined),
      };

      const customer = new Customer(customerData);
      await customer.save();
      
      const populatedCustomer = await Customer.findById(customer._id)
        .populate('assignedSalesId', 'firstName lastName')
        .populate('createdBy', 'firstName lastName');
      
      res.status(201).json(populatedCustomer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
);

// Update customer with audit
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    // Check access for non-admins
    if (!req.user?.roles?.includes('admin')) {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      
      // Sales reps can only update their assigned customers
      if (customer.assignedSalesId?.toString() !== req.user?._id.toString()) {
        // Also check if they have any projects with this customer
        const hasProject = await Project.exists({
          customerId: customer._id,
          $or: [
            { assignedSalesId: req.user?._id },
            { 'commission.bdcRepId': req.user?._id },
          ],
        });
        
        if (!hasProject) {
          res.status(403).json({ error: 'Forbidden: Not assigned to this customer' });
          return;
        }
      }
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    ).populate('assignedSalesId', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName');
     
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    
    // Broadcast customer update to all connected clients
    const io = (req as any).io;
    if (io) {
      // Get all projects for this customer to notify their rooms
      const projects = await Project.find({ customerId: customer._id }).select('_id');
      projects.forEach(project => {
        io.to(`project:${project._id}`).emit('customer:updated', {
          projectId: project._id,
          customer: customer.toObject(),
        });
      });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Get customer projects (separate endpoint for detailed view)
router.get('/:id/projects', async (req: AuthRequest, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    
    // Check access
    if (!req.user?.roles?.includes('admin')) {
      const hasAccess = customer.assignedSalesId?.toString() === req.user?._id.toString() ||
        await Project.exists({
          customerId: customer._id,
          $or: [
            { assignedSalesId: req.user?._id },
            { 'commission.bdcRepId': req.user?._id },
            { 'commission.salesReps.userId': req.user?._id },
          ],
        });
      
      if (!hasAccess) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }
    
    const projects = await Project.find({ customerId: req.params.id })
      .populate('assignedSalesId', 'firstName lastName email')
      .populate('commission.bdcRepId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
      
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer projects' });
  }
});

// Update customer assignment (sales rep assignment)
router.patch('/:id/assign', async (req: AuthRequest, res) => {
  try {
    const { assignedSalesId } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        assignedSalesId,
        updatedBy: req.user?._id,
      },
      { new: true }
    ).populate('assignedSalesId', 'firstName lastName email');
    
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

export default router;
