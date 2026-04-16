import { Router } from 'express';
import { CompanySettings } from '../models/CompanySettings';
import { Market } from '../models/Market';
import { AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// All routes require admin
router.use(requireRole('admin'));

// Get company settings
router.get('/', async (_req: AuthRequest, res) => {
  try {
    const settings = await CompanySettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
});

// Update company settings
router.put('/', async (req: AuthRequest, res) => {
  try {
    const settings = await CompanySettings.getSettings();
    
    const updateData: any = {
      ...req.body,
      updatedBy: req.user?._id,
    };
    
    // Don't allow direct modification of lastSequence through this endpoint
    delete updateData.employeeIdConfig?.lastSequence;
    
    const updated = await CompanySettings.findByIdAndUpdate(
      settings._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ error: 'Failed to update company settings' });
  }
});

// Update employee ID config
router.put('/employee-id-config', async (req: AuthRequest, res) => {
  try {
    const { enabled, format, roleCodes, marketCodes } = req.body;
    
    const settings = await CompanySettings.getSettings();
    
    if (enabled !== undefined) settings.employeeIdConfig.enabled = enabled;
    if (format) settings.employeeIdConfig.format = format;
    if (roleCodes) {
      // Convert to Map if plain object
      settings.employeeIdConfig.roleCodes = new Map(Object.entries(roleCodes));
    }
    if (marketCodes) {
      settings.employeeIdConfig.marketCodes = new Map(Object.entries(marketCodes));
    }
    
    settings.updatedBy = req.user?._id;
    await settings.save();
    
    res.json(settings.employeeIdConfig);
  } catch (error) {
    console.error('Error updating employee ID config:', error);
    res.status(500).json({ error: 'Failed to update employee ID config' });
  }
});

// Preview employee ID (without saving)
router.post('/preview-employee-id', async (req: AuthRequest, res) => {
  try {
    const { marketId, role } = req.body;
    
    const settings = await CompanySettings.getSettings();
    
    // Only query Market if marketId is a valid ObjectId
    let market = null;
    if (marketId && marketId !== 'default' && /^[0-9a-fA-F]{24}$/.test(marketId)) {
      market = await Market.findById(marketId);
    }
    
    if (!settings.employeeIdConfig.enabled) {
      res.json({ employeeId: null, message: 'Auto-generation disabled' });
      return;
    }
    
    const marketCode = settings.employeeIdConfig.marketCodes.get(marketId) || market?.code || 'XX';
    const roleCode = settings.employeeIdConfig.roleCodes.get(role) || 'FRT';
    
    const key = `${marketCode}-${roleCode}`;
    const currentSequence = settings.employeeIdConfig.lastSequence.get(key) || 0;
    const nextSequence = currentSequence + 1;
    
    const sequenceStr = nextSequence.toString().padStart(4, '0');
    const employeeId = `${marketCode}-${roleCode}${sequenceStr}`;
    
    res.json({ 
      employeeId,
      preview: true,
      marketCode,
      roleCode,
      sequence: nextSequence 
    });
  } catch (error) {
    console.error('Error previewing employee ID:', error);
    res.status(500).json({ error: 'Failed to preview employee ID' });
  }
});

// Get all markets
router.get('/markets', async (_req: AuthRequest, res) => {
  try {
    const markets = await Market.find()
      .populate('managerId', 'firstName lastName email')
      .sort({ name: 1 });
    res.json(markets);
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

// Create market
router.post('/markets', async (req: AuthRequest, res) => {
  try {
    const market = new Market({
      ...req.body,
      createdBy: req.user?._id,
    });
    
    await market.save();
    
    // Update company settings with market code if provided
    if (req.body.code) {
      const settings = await CompanySettings.getSettings();
      settings.employeeIdConfig.marketCodes.set(market._id.toString(), req.body.code);
      await settings.save();
    }
    
    const populated = await Market.findById(market._id)
      .populate('managerId', 'firstName lastName email');
    
    res.status(201).json(populated);
  } catch (error: any) {
    console.error('Error creating market:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Market code already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create market' });
  }
});

// Update market
router.put('/markets/:id', async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const oldMarket = await Market.findById(req.params.id);
    
    const market = await Market.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    ).populate('managerId', 'firstName lastName email');
    
    if (!market) {
      res.status(404).json({ error: 'Market not found' });
      return;
    }
    
    // Update market code in settings if changed
    if (code && code !== oldMarket?.code) {
      const settings = await CompanySettings.getSettings();
      settings.employeeIdConfig.marketCodes.delete(req.params.id);
      settings.employeeIdConfig.marketCodes.set(req.params.id, code);
      await settings.save();
    }
    
    res.json(market);
  } catch (error: any) {
    console.error('Error updating market:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Market code already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to update market' });
  }
});

// Delete market
router.delete('/markets/:id', async (req: AuthRequest, res) => {
  try {
    // Check if users are assigned to this market
    const { User } = await import('../models/User');
    const userCount = await User.countDocuments({ marketId: req.params.id });
    
    if (userCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete market with assigned users',
        userCount 
      });
      return;
    }
    
    await Market.findByIdAndDelete(req.params.id);
    
    // Remove from settings
    const settings = await CompanySettings.getSettings();
    settings.employeeIdConfig.marketCodes.delete(req.params.id);
    await settings.save();
    
    res.json({ message: 'Market deleted successfully' });
  } catch (error) {
    console.error('Error deleting market:', error);
    res.status(500).json({ error: 'Failed to delete market' });
  }
});

export default router;
