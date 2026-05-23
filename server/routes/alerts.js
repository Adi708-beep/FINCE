import express from 'express';
import Alert from '../models/Alert.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get unread alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Alert.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear alerts
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await Alert.deleteMany({ user: req.user.id });
    res.json({ message: 'Alerts cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
