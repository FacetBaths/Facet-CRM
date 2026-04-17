import { Router } from 'express';
import { Project } from '../models/Project';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Commission rules constants
const COMMISSION_RULES = {
  sales: {
    percentage: 10,
    flatAmount: 400,
  },
  bdc: {
    percentage: 1, // 1% of contract
  },
  admin: {
    owner: 3, // 3% for owners
    standard: 2, // 2% for other admins
  },
};

// Get commission dashboard for all users
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
    
    // Get all commission-eligible users
    const users = await User.find({
      status: 'active',
      roles: { $in: ['sales', 'design_consultant', 'bdc', 'admin'] },
    });
    
    // Get all projects with commission data in date range
    const projectFilter: any = {
      'commission.calculatedAt': { $exists: true },
    };
    if (startDate || endDate) {
      projectFilter['commission.calculatedAt'] = dateFilter;
    }
    
    const projects = await Project.find(projectFilter)
      .populate('commission.salesReps.userId', 'firstName lastName role')
      .populate('commission.bdcRepId', 'firstName lastName role');
    
    // Build report by user
    const userCommissions = users.map((user: any) => {
      const userId = user._id.toString();
      const isOwner = user.commissionSettings?.isOwner || false;
      
      let earned = 0;
      let paid = 0;
      let unpaid = 0;
      let projectCount = 0;
      
      projects.forEach((project: any) => {
        // Sales commission (split commissions supported)
        if (project.commission?.salesReps) {
          const mySalesRep = project.commission.salesReps.find(
            (sr: any) => sr.userId?._id?.toString() === userId || sr.userId?.toString() === userId
          );
          if (mySalesRep) {
            earned += mySalesRep.amount || 0;
            projectCount++;
            if (mySalesRep.paid) {
              paid += mySalesRep.amount || 0;
            } else {
              unpaid += mySalesRep.amount || 0;
            }
          }
        }
        
        // BDC commission
        if (project.commission?.bdcRepId?.toString() === userId) {
          const amount = project.commission.bdcAmount || 0;
          earned += amount;
          projectCount++;
          if (project.commission.bdcPaid) {
            paid += amount;
          } else {
            unpaid += amount;
          }
        }
        
        // Spiffs/bonuses
        if (project.commission?.spiffs) {
          project.commission.spiffs.forEach((spiff: any) => {
            if (spiff.awardedTo?.toString() === userId) {
              earned += spiff.amount || 0;
              if (spiff.paid) {
                paid += spiff.amount || 0;
              } else {
                unpaid += spiff.amount || 0;
              }
            }
          });
        }
        
        // Admin commission (calculated on every project)
        if (user.roles?.includes('admin')) {
          const adminRate = isOwner ? COMMISSION_RULES.admin.owner : COMMISSION_RULES.admin.standard;
          const contractAmount = project.contractAmount || 0;
          const amount = contractAmount * (adminRate / 100);
          earned += amount;
          if (project.commission?.adminPaid) {
            paid += amount;
          } else {
            unpaid += amount;
          }
        }
      });
      
      return {
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles,
        isOwner: user.roles?.includes('admin') ? isOwner : undefined,
        commissionSettings: user.commissionSettings,
        earned,
        paid,
        unpaid,
        projectCount,
      };
    });
    
    // Calculate totals
    const totals = {
      earned: userCommissions.reduce((sum: number, u: any) => sum + u.earned, 0),
      paid: userCommissions.reduce((sum: number, u: any) => sum + u.paid, 0),
      unpaid: userCommissions.reduce((sum: number, u: any) => sum + u.unpaid, 0),
    };
    
    res.json({
      users: userCommissions,
      totals,
      rules: COMMISSION_RULES,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate commission dashboard' });
  }
});

// Get detailed commission breakdown for a user
router.get('/user/:userId', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const userIdStr = user._id.toString();
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
    
    // Get all projects with commission data
    const projects = await Project.find({
      'commission.calculatedAt': { $exists: true, ...dateFilter },
    }).populate('customerId', 'firstName lastName')
      .populate('commission.salesReps.userId', 'firstName lastName')
      .populate('commission.bdcRepId', 'firstName lastName')
      .sort({ 'commission.calculatedAt': -1 });
    
    // Filter commissions for this user
    const commissions: any[] = [];
    
    projects.forEach((project: any) => {
      // Sales commissions
      if (project.commission?.salesReps) {
        const mySales = project.commission.salesReps.find(
          (sr: any) => sr.userId?._id?.toString() === userIdStr || sr.userId?.toString() === userIdStr
        );
        if (mySales) {
          commissions.push({
            projectId: project._id,
            projectNumber: project.projectNumber,
            customerName: project.customerId ? `${(project.customerId as any).firstName} ${(project.customerId as any).lastName}` : 'Unknown',
            contractAmount: project.contractAmount,
            amount: mySales.amount,
            splitPercent: mySales.splitPercent,
            paid: mySales.paid,
            paidDate: mySales.paidDate,
            type: 'sales',
            calculatedAt: project.commission.calculatedAt,
          });
        }
      }
      
      // BDC commission
      if (project.commission?.bdcRepId?.toString() === userIdStr) {
        commissions.push({
          projectId: project._id,
          projectNumber: project.projectNumber,
          customerName: project.customerId ? `${(project.customerId as any).firstName} ${(project.customerId as any).lastName}` : 'Unknown',
          contractAmount: project.contractAmount,
          amount: project.commission.bdcAmount,
          paid: project.commission.bdcPaid,
          paidDate: project.commission.bdcPaidDate,
          type: 'bdc',
          calculatedAt: project.commission.calculatedAt,
        });
      }
      
      // Spiffs
      if (project.commission?.spiffs) {
        project.commission.spiffs.forEach((spiff: any) => {
          if (spiff.awardedTo?.toString() === userIdStr) {
            commissions.push({
              projectId: project._id,
              projectNumber: project.projectNumber,
              customerName: project.customerId ? `${(project.customerId as any).firstName} ${(project.customerId as any).lastName}` : 'Unknown',
              contractAmount: project.contractAmount,
              amount: spiff.amount,
              description: spiff.description,
              paid: spiff.paid,
              paidDate: spiff.paidDate,
              type: 'spiff',
              calculatedAt: project.commission.calculatedAt,
            });
          }
        });
      }
    });
    
    // Filter by status if requested
    let filteredCommissions = commissions;
    if (status === 'paid') {
      filteredCommissions = commissions.filter(c => c.paid);
    } else if (status === 'unpaid') {
      filteredCommissions = commissions.filter(c => !c.paid);
    }
    
    const totals = {
      earned: commissions.reduce((sum, c) => sum + (c.amount || 0), 0),
      paid: commissions.filter(c => c.paid).reduce((sum, c) => sum + (c.amount || 0), 0),
      unpaid: commissions.filter(c => !c.paid).reduce((sum, c) => sum + (c.amount || 0), 0),
    };
    
    res.json({
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles,
      },
      commissions: filteredCommissions,
      totals,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user commissions' });
  }
});

// Update commission settings for a user
router.put('/settings/:userId', async (req: AuthRequest, res) => {
  try {
    const { commissionSettings } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { commissionSettings },
      { new: true }
    );
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user.commissionSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update commission settings' });
  }
});

// Get global commission rules
router.get('/rules', async (_req: AuthRequest, res) => {
  res.json(COMMISSION_RULES);
});

// Update global commission rules (admin only)
router.put('/rules', async (req: AuthRequest, res) => {
  try {
    // Check if admin
    const user = await User.findById(req.user?._id);
    if (!user || !user.roles?.includes('admin')) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    
    const { sales, bdc, admin } = req.body;
    
    // Update rules (in a real app, this would persist to DB)
    // For now, we just return success
    res.json({
      message: 'Rules updated',
      rules: {
        sales: { ...COMMISSION_RULES.sales, ...sales },
        bdc: { ...COMMISSION_RULES.bdc, ...bdc },
        admin: { ...COMMISSION_RULES.admin, ...admin },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update commission rules' });
  }
});

// Bulk mark commissions as paid
router.post('/pay', async (req: AuthRequest, res) => {
  try {
    const { commissions } = req.body; // Array of { projectId, type, userId, spiffIndex }
    
    const updates = [];
    
    for (const { projectId, type, userId, spiffIndex } of commissions) {
      const update: any = {};
      if (type === 'bdc') {
        update['commission.bdcPaid'] = true;
        update['commission.bdcPaidDate'] = new Date();
      } else if (type === 'admin') {
        update['commission.adminPaid'] = true;
        update['commission.adminPaidDate'] = new Date();
      } else if (type === 'spiff' && spiffIndex !== undefined) {
        update[`commission.spiffs.${spiffIndex}.paid`] = true;
        update[`commission.spiffs.${spiffIndex}.paidDate`] = new Date();
      } else if (type === 'sales' && userId) {
        // Find the specific sales rep in the array
        const project = await Project.findById(projectId);
        if (project) {
          const salesRepIndex = project.commission.salesReps.findIndex(
            (sr: any) => sr.userId.toString() === userId
          );
          if (salesRepIndex !== -1) {
            update[`commission.salesReps.${salesRepIndex}.paid`] = true;
            update[`commission.salesReps.${salesRepIndex}.paidDate`] = new Date();
          }
        }
      }
      
      updates.push(
        Project.findByIdAndUpdate(projectId, { $set: update })
      );
    }
    
    await Promise.all(updates);
    
    res.json({ message: `${commissions.length} commissions marked as paid` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process commission payments' });
  }
});

export default router;
