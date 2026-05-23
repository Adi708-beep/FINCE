import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate a random 6-character alphanumeric code
const generateFamilyCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const familyCode = generateFamilyCode();
    const newUser = new User({
      username,
      email,
      password,
      familyCode
    });

    await newUser.save();
    
    // Create token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET || 'fince_secret_token_key_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        familyCode: newUser.familyCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fince_secret_token_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        familyCode: user.familyCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Link Family
router.post('/family/link', authenticateToken, async (req, res) => {
  const { familyCode } = req.body;
  try {
    if (!familyCode) {
      return res.status(400).json({ message: 'Family code is required' });
    }

    const cleanCode = familyCode.trim().toUpperCase();
    
    // Check if any user has this familyCode
    const codeExists = await User.findOne({ familyCode: cleanCode });
    if (!codeExists) {
      return res.status(404).json({ message: 'Family code not found. Ensure another member has registered it.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { familyCode: cleanCode },
      { new: true }
    ).select('-password');

    res.json({
      message: `Successfully linked to family code ${cleanCode}`,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave Family & generate own new code
router.post('/family/leave', authenticateToken, async (req, res) => {
  try {
    const newCode = generateFamilyCode();
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { familyCode: newCode },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Successfully unlinked from family group. A new private code has been generated.',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
