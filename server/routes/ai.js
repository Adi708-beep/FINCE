import express from 'express';
import Chat from '../models/Chat.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { chatWithContext, generateFinancialReport, generateSavingsAuditReport } from '../services/gemini.js';

const router = express.Router();

// Get persistent chat history
router.get('/chat', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ createdAt: 1 });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear chat history
router.delete('/chat', authenticateToken, async (req, res) => {
  try {
    await Chat.deleteMany({ user: req.user.id });
    res.json({ message: 'Conversation history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message to Gemini assistant
router.post('/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    // 1. Save user's message
    const userChat = new Chat({
      user: userId,
      role: 'user',
      content: message
    });
    await userChat.save();

    // 2. Fetch past chat history (up to last 15 messages for context window)
    const chats = await Chat.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(15);
    
    // Reverse to chronological order
    const chatHistory = chats.reverse();

    // 3. Fetch user and context using RAG retrieval matching on user message
    const user = await User.findById(userId);
    let baseFilter = { user: userId };
    let budgetFilter = { user: userId };

    if (user && user.familyCode) {
      const familyUsers = await User.find({ familyCode: user.familyCode });
      const familyUserIds = familyUsers.map(u => u._id);
      baseFilter = { user: { $in: familyUserIds } };
      budgetFilter = {
        $or: [
          { user: userId },
          { familyCode: user.familyCode }
        ]
      };
    }

    // Explicit RAG Retrieval: Extract key financial nouns, categories, or numbers from the user's message
    const cleanMsg = message.toLowerCase();
    const categoriesList = ["groceries", "utilities", "food", "dining", "entertainment", "travel", "transport", "shopping", "health", "personal", "housing", "others"];
    
    // Parse keywords by matching words greater than 3 chars or category names
    const searchTerms = cleanMsg.split(/\s+/)
      .map(term => term.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(term => term.length > 2);

    let ragFilter = { ...baseFilter };

    if (searchTerms.length > 0) {
      // Look for terms in merchant names, categories, or description fields
      const queryTerms = searchTerms.map(term => new RegExp(term, 'i'));
      
      ragFilter.$or = [
        { merchant: { $in: queryTerms } },
        { category: { $in: queryTerms } },
        { description: { $in: queryTerms } }
      ];
    }

    // Retrieve matching records (RAG)
    let transactions = await Transaction.find(ragFilter)
      .sort({ date: -1 })
      .limit(30);

    // Fallback: If no direct records found, get latest 30 transactions as context
    if (transactions.length === 0) {
      transactions = await Transaction.find(baseFilter)
        .sort({ date: -1 })
        .limit(30);
    }

    const budgets = await Budget.find(budgetFilter);

    // 4. Send to Gemini
    const aiResponseContent = await chatWithContext({
      chatHistory,
      userMessage: message,
      transactionsContext: transactions.map(t => ({
        merchant: t.merchant,
        amount: t.amount,
        date: t.date.toISOString().split('T')[0],
        category: t.category,
        description: t.description
      })),
      budgetsContext: budgets.map(b => ({
        category: b.category,
        limit: b.limit,
        month: b.month,
        year: b.year
      }))
    });

    // 5. Save model response
    const modelChat = new Chat({
      user: userId,
      role: 'model',
      content: aiResponseContent
    });
    await modelChat.save();

    res.json({
      userMessage: userChat,
      aiResponse: modelChat
    });
  } catch (error) {
    console.error('Error in AI Chat route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate Saving Insights Report Route
router.get('/report', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const period = req.query.period || 'month';

  try {
    const user = await User.findById(userId);
    let filter = { user: userId };
    let budgetFilter = { user: userId };

    if (user && user.familyCode) {
      const familyUsers = await User.find({ familyCode: user.familyCode });
      const familyUserIds = familyUsers.map(u => u._id);
      filter = { user: { $in: familyUserIds } };
      budgetFilter = {
        $or: [
          { user: userId },
          { familyCode: user.familyCode }
        ]
      };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    const budgets = await Budget.find(budgetFilter);

    const reportContent = await generateFinancialReport({
      transactionsContext: transactions.map(t => ({
        merchant: t.merchant,
        amount: t.amount,
        date: t.date.toISOString().split('T')[0],
        category: t.category
      })),
      budgetsContext: budgets,
      period
    });

    res.json({ report: reportContent });
  } catch (error) {
    console.error('Error generating AI report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /audit - Spend Pattern Auditor comparing current vs last month spends
router.get('/audit', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let filter = { user: userId };
    if (user.familyCode) {
      const familyUsers = await User.find({ familyCode: user.familyCode });
      const familyUserIds = familyUsers.map(u => u._id);
      filter = { user: { $in: familyUserIds } };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Calculate dates for current month
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    // Calculate dates for last month
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Fetch transactions
    const currentTransactions = await Transaction.find({
      ...filter,
      date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
    });

    const lastTransactions = await Transaction.find({
      ...filter,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    // Helper to calculate category distribution map
    const calculateCategoryDistribution = (transactions) => {
      const distribution = {};
      transactions.forEach(t => {
        const cat = t.category || 'Others';
        distribution[cat] = (distribution[cat] || 0) + t.amount;
      });
      // Normalize values
      const distributionNormalized = {};
      Object.keys(distribution).forEach(cat => {
        distributionNormalized[cat] = Number(distribution[cat].toFixed(2));
      });
      return distributionNormalized;
    };

    const currentMonthData = calculateCategoryDistribution(currentTransactions);
    const lastMonthData = calculateCategoryDistribution(lastTransactions);

    // Query Gemini savings audit report
    const report = await generateSavingsAuditReport({
      currentMonthData,
      lastMonthData,
      username: user.username
    });

    res.json({ report });
  } catch (error) {
    console.error('Error generating AI audit report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
