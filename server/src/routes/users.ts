import { Router } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-passwordHash')
      .sort({ lastName: 1, firstName: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
