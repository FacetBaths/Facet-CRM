import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();

// In-memory notification store (for MVP - could be moved to MongoDB later)
const notifications: any[] = [];

// Send a ping/message to another user
router.post('/ping', async (req: AuthRequest, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message?.trim()) {
      res.status(400).json({ error: 'Missing userId or message' });
      return;
    }
    
    // Can't ping yourself
    if (userId === req.user?._id.toString()) {
      res.status(400).json({ error: 'Cannot ping yourself' });
      return;
    }
    
    const notification = {
      _id: Date.now().toString(),
      type: 'ping',
      userId,
      fromUserId: req.user?._id,
      fromUserName: `${req.user?.firstName} ${req.user?.lastName}`,
      fromUserAvatar: req.user?.avatar,
      message: message.trim(),
      read: false,
      createdAt: new Date(),
    };
    
    notifications.push(notification);
    
    // Emit real-time notification via Socket.io
    io.to(`user:${userId}`).emit('notification:new', notification);
    
    res.status(201).json({ message: 'Notification sent', notification });
  } catch (error) {
    console.error('Error sending ping:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get notifications for current user
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const userNotifications = notifications
      .filter(n => n.userId === req.user?._id.toString())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(userNotifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    const notification = notifications.find(n => n._id === req.params.id);
    
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    
    // Ensure user owns this notification
    if (notification.userId !== req.user?._id.toString()) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    
    notification.read = true;
    notification.readAt = new Date();
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?._id.toString();
    
    notifications
      .filter(n => n.userId === userId && !n.read)
      .forEach(n => {
        n.read = true;
        n.readAt = new Date();
      });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const index = notifications.findIndex(n => n._id === req.params.id);
    
    if (index === -1) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    
    // Ensure user owns this notification
    if (notifications[index].userId !== req.user?._id.toString()) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    
    notifications.splice(index, 1);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const count = notifications.filter(
      n => n.userId === req.user?._id.toString() && !n.read
    ).length;
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
