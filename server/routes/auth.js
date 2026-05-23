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
  const { username, email, password, role, fullName, phone, userMode } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Map new userMode (individual/corporate) to existing role enum (personal/business)
    const finalRole = role || (userMode === 'corporate' ? 'business' : 'personal');
    // If username is not passed, use fullName or email prefix
    const finalUsername = username || fullName || email.split('@')[0];

    const userExists = await User.findOne({ $or: [{ email }, { username: finalUsername }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const familyCode = generateFamilyCode();
    const newUser = new User({
      username: finalUsername,
      email,
      password,
      familyCode,
      role: finalRole,
      fullName,
      phone
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
        familyCode: newUser.familyCode,
        role: newUser.role,
        fullName: newUser.fullName,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
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

    if (role && user.role !== role) {
      return res.status(400).json({ 
        message: `This account is registered on the ${user.role} portal. Please log in using the correct portal.` 
      });
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
        familyCode: user.familyCode,
        role: user.role
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

// Update profile details
router.put('/update', authenticateToken, async (req, res) => {
  const { fullName, phone, email, username, password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      user.email = email.toLowerCase();
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    if (password) {
      user.password = password; // pre-save hook handles hashing automatically
    }

    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        familyCode: user.familyCode,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

export default router;
