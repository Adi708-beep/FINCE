import express from 'express';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';
import { allocateBudgetWithAi } from '../services/gemini.js';

const router = express.Router();

// Get budgets for a specific month and year (along with current spent amount)
router.get('/', authenticateToken, async (req, res) => {
  const month = Number(req.query.month) || (new Date().getMonth() + 1);
  const year = Number(req.query.year) || new Date().getFullYear();
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Query budgets of the user OR familyCode
    let budgetQuery = { user: userId, month, year };
    let transactionQuery = { user: userId };

    if (user.familyCode) {
      // Find all user IDs in this family
      const familyUsers = await User.find({ familyCode: user.familyCode });
      const familyUserIds = familyUsers.map(u => u._id);
      budgetQuery = {
        $or: [
          { user: userId },
          { familyCode: user.familyCode }
        ],
        month,
        year
      };
      transactionQuery = { user: { $in: familyUserIds } };
    }

    const budgets = await Budget.find(budgetQuery);

    // Calculate transaction spending for this month/year
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    
    transactionQuery.date = { $gte: startOfMonth, $lte: endOfMonth };
    const transactions = await Transaction.find(transactionQuery);

    // Build statistics for each budget category
    const budgetsWithSpent = budgets.map(budget => {
      const category = budget.category;
      let spent = 0;

      if (category === 'overall') {
        spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      } else {
        spent = transactions
          .filter(t => t.category.toLowerCase() === category.toLowerCase())
          .reduce((sum, t) => sum + t.amount, 0);
      }

      return {
        _id: budget._id,
        category,
        limit: budget.limit,
        month: budget.month,
        year: budget.year,
        spent: Number(spent.toFixed(2)),
        remaining: Number((budget.limit - spent).toFixed(2)),
        percentage: budget.limit > 0 ? Number(((spent / budget.limit) * 100).toFixed(1)) : 0
      };
    });

    // If overall budget is missing, output a placeholder budget configuration
    res.json(budgetsWithSpent);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set or Update budget
router.post('/', authenticateToken, async (req, res) => {
  const { category, limit, month, year } = req.body;
  const userId = req.user.id;

  try {
    if (!category || limit === undefined || !month || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(userId);
    const familyCode = user ? user.familyCode : null;

    // Try to find existing budget
    let budget = await Budget.findOne({
      user: userId,
      category,
      month,
      year
    });

    if (budget) {
      budget.limit = Number(limit);
      budget.familyCode = familyCode;
      await budget.save();
    } else {
      budget = new Budget({
        user: userId,
        familyCode,
        category,
        limit: Number(limit),
        month: Number(month),
        year: Number(year)
      });
      await budget.save();
    }

    res.json({ message: 'Budget saved successfully', budget });
  } catch (error) {
    console.error('Error saving budget:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete budget
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /ai-allocate - AI automatically allocates monthly budget limits across categories
router.post('/ai-allocate', authenticateToken, async (req, res) => {
  const { totalLimit, month, year } = req.body;
  const userId = req.user.id;

  if (!totalLimit || !month || !year) {
    return res.status(400).json({ message: 'Total limit, month and year are required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Fetch historical transactions (e.g. past 60 days) to build a distribution context
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let transactionFilter = { user: userId, date: { $gte: sixtyDaysAgo } };
    if (user.familyCode) {
      const familyUsers = await User.find({ familyCode: user.familyCode });
      const familyUserIds = familyUsers.map(u => u._id);
      transactionFilter = { user: { $in: familyUserIds }, date: { $gte: sixtyDaysAgo } };
    }

    const transactions = await Transaction.find(transactionFilter);

    // 2. Prepare context for Gemini
    const categoriesList = [
      "Groceries", 
      "Utilities", 
      "Food & Dining", 
      "Entertainment", 
      "Travel & Transport", 
      "Shopping", 
      "Health & Personal Care", 
      "Housing", 
      "Others"
    ];

    const categoryTotals = {};
    categoriesList.forEach(cat => categoryTotals[cat] = 0);

    let totalHistoricalSpent = 0;
    transactions.forEach(t => {
      const cat = categoriesList.find(c => c.toLowerCase() === t.category.toLowerCase()) || "Others";
      categoryTotals[cat] += t.amount;
      totalHistoricalSpent += t.amount;
    });

    const categoryPercentages = {};
    categoriesList.forEach(cat => {
      categoryPercentages[cat] = totalHistoricalSpent > 0 
        ? ((categoryTotals[cat] / totalHistoricalSpent) * 100).toFixed(1)
        : (100 / categoriesList.length).toFixed(1);
    });

    // 3. Query Gemini to allocate
    const result = await allocateBudgetWithAi({
      totalLimit: Number(totalLimit),
      categoryPercentages,
      categoriesList
    });

    const { allocations, rationale } = result;

    // 4. Save allocations to DB
    const savedBudgets = [];
    const familyCode = user.familyCode || null;

    for (const cat of Object.keys(allocations)) {
      const limitVal = Number(allocations[cat]);
      if (isNaN(limitVal) || limitVal < 0) continue;

      let budget = await Budget.findOne({
        user: userId,
        category: cat,
        month: Number(month),
        year: Number(year)
      });

      if (budget) {
        budget.limit = limitVal;
        budget.familyCode = familyCode;
        await budget.save();
      } else {
        budget = new Budget({
          user: userId,
          familyCode,
          category: cat,
          limit: limitVal,
          month: Number(month),
          year: Number(year)
        });
        await budget.save();
      }
      savedBudgets.push(budget);
    }

    // Also set or update the overall budget limit to match the totalLimit
    let overallBudget = await Budget.findOne({
      user: userId,
      category: 'overall',
      month: Number(month),
      year: Number(year)
    });

    if (overallBudget) {
      overallBudget.limit = Number(totalLimit);
      overallBudget.familyCode = familyCode;
      await overallBudget.save();
    } else {
      overallBudget = new Budget({
        user: userId,
        familyCode,
        category: 'overall',
        limit: Number(totalLimit),
        month: Number(month),
        year: Number(year)
      });
      await overallBudget.save();
    }
    savedBudgets.push(overallBudget);

    res.json({
      message: 'AI Budget Allocation complete.',
      allocations,
      rationale,
      budgets: savedBudgets
    });

  } catch (error) {
    console.error('Error in AI budget allocation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
