import { Router } from 'express';
import { User } from '../models/User';
import { AuthRequest, requireRole } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all users (admin only)
router.get('/', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { status, marketId, teamId, role } = req.query;
    let query: any = {};
    
    if (status) query.status = status;
    if (marketId) query.marketId = marketId;
    if (teamId) query.teamIds = teamId;
    if (role) query.roles = role;
    
    const users = await User.find(query)
      .populate('marketId', 'name code')
      .populate('teamIds', 'name type')
      .select('-passwordHash -twoFactorSecret')
      .sort({ lastName: 1, firstName: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('marketId', 'name code timezone')
      .populate('teamIds', 'name type')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .select('-passwordHash -twoFactorSecret');
      
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get current user profile
router.get('/me/profile', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?._id)
      .populate('marketId', 'name code timezone')
      .populate('teamIds', 'name type')
      .select('-passwordHash -twoFactorSecret');
      
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user preferences
router.put('/me/preferences', async (req: AuthRequest, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { 
        $set: { 
          preferences: req.body,
          updatedBy: req.user?._id,
        },
      },
      { new: true }
    ).select('-passwordHash -twoFactorSecret');
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user.preferences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Create new user (admin only)
router.post('/', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { 
      email, password, firstName, lastName, roles, phone, 
      employeeId, employmentType, department, marketId, teamIds,
      commissionSettings, preferences 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !roles || !Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Check employeeId uniqueness if provided
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        res.status(400).json({ error: 'Employee ID already exists' });
        return;
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      roles,
      phone,
      employeeId,
      employmentType: employmentType || 'full_time',
      department,
      marketId,
      teamIds: teamIds || [],
      commissionSettings,
      preferences: preferences || {},
      status: 'active',
      createdBy: req.user?._id,
    });

    await user.save();

    // Return user without sensitive fields
    const userResponse = await User.findById(user._id)
      .populate('marketId', 'name code')
      .populate('teamIds', 'name type')
      .select('-passwordHash -twoFactorSecret');
      
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id?.toString();
    const currentUserRoles = req.user?.roles || [];

    // Check permissions: admin can edit anyone, users can edit themselves
    const isAdmin = currentUserRoles.includes('admin');
    if (!isAdmin && currentUserId !== id) {
      res.status(403).json({ error: 'Not authorized to update this user' });
      return;
    }

    const updateData: any = {};
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'phoneExtension', 'bio', 'avatar',
      'commissionSettings', 'preferences'
    ];
    
    // Only admin can change these fields
    if (isAdmin) {
      allowedFields.push(
        'roles', 'employeeId', 'employmentType', 'department', 
        'marketId', 'teamIds', 'commissionTier', 'status'
      );
    }

    // Build update object
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle password change (self only)
    if (req.body.password && currentUserId === id) {
      updateData.passwordHash = await bcrypt.hash(req.body.password, 10);
      updateData.passwordChangedAt = new Date();
    }

    // Always set updatedBy
    updateData.updatedBy = req.user?._id;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('marketId', 'name code')
     .populate('teamIds', 'name type')
     .select('-passwordHash -twoFactorSecret');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message 
    });
  }
});

// Update user status (admin only) - for activate/suspend/terminate
router.patch('/:id/status', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['active', 'inactive', 'suspended', 'terminated'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updateData: any = { 
      status,
      updatedBy: req.user?._id,
    };
    
    // Set termination date if terminating
    if (status === 'terminated') {
      updateData.terminationDate = new Date();
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('marketId', 'name code')
     .select('-passwordHash -twoFactorSecret');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Log the status change (could add to an audit log collection)
    console.log(`User ${user._id} status changed to ${status} by ${req.user?._id}. Reason: ${reason || 'N/A'}`);

    res.json({ 
      message: `User ${status === 'active' ? 'activated' : status} successfully`,
      user 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Deactivate user (legacy endpoint - now uses status)
router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        status: 'inactive',
        updatedBy: req.user?._id,
      },
      { new: true }
    ).select('-passwordHash -twoFactorSecret');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Get users by team
router.get('/team/:teamId', async (req: AuthRequest, res) => {
  try {
    const users = await User.find({ 
      teamIds: req.params.teamId,
      status: 'active',
    })
      .populate('marketId', 'name code')
      .select('-passwordHash -twoFactorSecret')
      .sort({ lastName: 1, firstName: 1 });
      
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team users' });
  }
});

// Get users by market
router.get('/market/:marketId', requireRole('admin', 'manager'), async (req: AuthRequest, res) => {
  try {
    // Managers can only see users in their markets
    if (!req.user?.roles?.includes('admin')) {
      const canAccess = req.user?.marketId?.toString() === req.params.marketId ||
        req.user?.markets?.some(m => m.toString() === req.params.marketId);
      
      if (!canAccess) {
        res.status(403).json({ error: 'Not authorized to view this market' });
        return;
      }
    }
    
    const users = await User.find({ 
      $or: [
        { marketId: req.params.marketId },
        { markets: req.params.marketId },
      ],
      status: 'active',
    })
      .populate('teamIds', 'name type')
      .select('-passwordHash -twoFactorSecret')
      .sort({ lastName: 1, firstName: 1 });
      
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market users' });
  }
});

export default router;
