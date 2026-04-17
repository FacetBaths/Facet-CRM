import { Router, Response, NextFunction } from 'express';
import { Subscription } from '../models/Subscription';
import { AuthRequest, requireRole } from '../middleware/auth';

import { Project } from '../models/Project';
import { Customer } from '../models/Customer';


const router = Router();

const filterByUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.roles?.includes('admin')) {
    return next();
  }

  let allowedCustomerIds: string[] = [];

  if (req.user.roles?.includes('sales') || req.user.roles?.includes('bdc')) {
    const assignedCustomers = await Customer.find({ assignedSalesId: req.user._id }).select('_id');
    allowedCustomerIds = assignedCustomers.map(c => c._id.toString());

    const projects = await Project.find({
      $or: [
        { assignedSalesId: req.user._id },
        { 'commission.bdcRepId': req.user._id },
        { 'commission.salesReps.userId': req.user._id },
      ],
    }).select('customerId');

    const projectCustomerIds = projects.map(p => p.customerId.toString());
    allowedCustomerIds = [...new Set([...allowedCustomerIds, ...projectCustomerIds])];
  }

  (req as any).roleFilter = { customerId: { $in: allowedCustomerIds } };
  next();
};

// Get all subscriptions
router.get('/', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const { status, plan, customerId } = req.query;
    let query: any = { ...(req as any).roleFilter || {} };
    
    if (status) query.status = status;
    if (plan) query.plan = plan;
    if (customerId) query.customerId = customerId;
    
    const subscriptions = await Subscription.find(query)
      .populate('customerId', 'firstName lastName contacts')
      .sort({ nextBillDate: 1 });
      
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get subscription by ID
router.get('/:id', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const query = { _id: req.params.id, ...(req as any).roleFilter || {} };

const subscription = await Subscription.findOne(query)
      .populate('customerId')
      .populate('services.assignedTo', 'firstName lastName')
      .populate('payments.recordedBy', 'firstName lastName');
      
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found or access denied' });
      return;
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create subscription
router.post('/', requireRole('admin', 'sales', 'bdc'), async (req: AuthRequest, res) => {
  try {
    const { customerId, plan, billingFrequency } = req.body;
    
    const monthlyAmount = plan === 'edge' ? 49 : 89;
    const annualAmount = plan === 'edge' ? 499 : 899;
    
    const subscription = new Subscription({
      customerId,
      plan,
      billingFrequency,
      monthlyAmount,
      annualAmount,
      status: 'active',
      nextBillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      services: [],
      payments: [],
    });
    
    await subscription.save();
    
    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('customerId', 'firstName lastName');
      
    res.status(201).json(populatedSubscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/:id', requireRole('admin', 'sales', 'bdc'), async (req: AuthRequest, res) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName');
    
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found or access denied' });
      return;
    }
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Add payment
router.post('/:id/payments', requireRole('admin', 'sales', 'bdc'), async (req: AuthRequest, res) => {
  try {
    const { amount, method } = req.body;
    
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          payments: {
            amount,
            date: new Date(),
            method,
            status: 'paid',
            recordedBy: req.user?._id,
          },
        },
        // Extend next bill date
        $inc: { nextBillDate: 30 * 24 * 60 * 60 * 1000 },
      },
      { new: true }
    );
    
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found or access denied' });
      return;
    }
    
    res.status(201).json(subscription.payments[subscription.payments.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add payment' });
  }
});

// Add service
router.post('/:id/services', requireRole('admin', 'sales', 'bdc'), async (req: AuthRequest, res) => {
  try {
    const { type, season, scheduledDate } = req.body;
    
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          services: {
            type,
            season,
            scheduledDate,
            status: 'scheduled',
          },
        },
      },
      { new: true }
    );
    
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found or access denied' });
      return;
    }
    
    res.status(201).json(subscription.services[subscription.services.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// Get upcoming renewals (for dashboard)
router.get('/dashboard/upcoming', filterByUserRole, async (req: AuthRequest, res) => {
  try {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const upcoming = await Subscription.find({
      ...(req as any).roleFilter || {},
      status: 'active',
      nextBillDate: { $lte: nextWeek },
    })
      .populate('customerId', 'firstName lastName contacts')
      .sort({ nextBillDate: 1 });
      
    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming renewals' });
  }
});

export default router;