import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';
import Invoice from '../models/Invoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.join(__dirname, '..');
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Alert from '../models/Alert.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeInvoiceText } from '../services/gemini.js';

const router = express.Router();

// Multer Local File Fallback Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) and PDFs are allowed'));
    }
  }
});

// Helper: Check if new expense breaches category or overall budget
async function checkBudgetAlerts(userId, amount, category, date, req) {
  try {
    const parsedDate = new Date(date);
    const month = parsedDate.getMonth() + 1;
    const year = parsedDate.getFullYear();

    // 1. Find overall budget and category budget
    const budgets = await Budget.find({
      user: userId,
      month,
      year,
      category: { $in: ['overall', category] }
    });

    const overallBudget = budgets.find(b => b.category === 'overall');
    const categoryBudget = budgets.find(b => b.category === category);

    // Calculate total spend in this month/year for this user
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const monthTransactions = await Transaction.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categorySpent = monthTransactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);

    const alerts = [];

    // Check category budget
    if (categoryBudget) {
      const catPercent = (categorySpent / categoryBudget.limit) * 100;
      if (catPercent >= 100) {
        alerts.push({
          type: 'budget_exceeded',
          message: `Category "${category}" budget of ₹${categoryBudget.limit} has been EXCEEDED! (Current spend: ₹${categorySpent.toFixed(2)})`,
          category
        });
      } else if (catPercent >= 85) {
        alerts.push({
          type: 'budget_warning',
          message: `Category "${category}" budget is at ${catPercent.toFixed(0)}%! (Spend: ₹${categorySpent.toFixed(2)} / ₹${categoryBudget.limit})`,
          category
        });
      }
    }

    // Check overall budget
    if (overallBudget) {
      const overallPercent = (totalSpent / overallBudget.limit) * 100;
      if (overallPercent >= 100) {
        alerts.push({
          type: 'budget_exceeded',
          message: `Overall monthly budget of ₹${overallBudget.limit} has been EXCEEDED! (Current total: ₹${totalSpent.toFixed(2)})`,
          category: 'overall'
        });
      } else if (overallPercent >= 85) {
        alerts.push({
          type: 'budget_warning',
          message: `Overall monthly budget is at ${overallPercent.toFixed(0)}%! (Total spend: ₹${totalSpent.toFixed(2)} / ₹${overallBudget.limit})`,
          category: 'overall'
        });
      }
    }

    // Save alerts and send via Socket.io
    for (const alertData of alerts) {
      const newAlert = new Alert({
        user: userId,
        type: alertData.type,
        message: alertData.message,
        category: alertData.category
      });
      await newAlert.save();

      // Emit real-time alert via socket
      if (req.io) {
        req.io.to(userId.toString()).emit('new_alert', newAlert);
      }
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
  }
}

// 1. File Upload & OCR & Gemini Extraction
router.post('/upload', authenticateToken, upload.single('invoice'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const fileSize = req.file.size;
  const mimeType = req.file.mimetype;
  const userId = req.user.id;

  // Create initial pending Invoice
  const invoice = new Invoice({
    user: userId,
    fileName,
    filePath: `/${filePath.replace(/\\/g, '/')}`, // Make URL-friendly
    fileSize,
    mimeType,
    status: 'processing'
  });
  await invoice.save();

  // Run OCR in the background, but wait for it to return response to client
  // To simulate realtime progress, we listen to tesseract's logger and emit to socket.
  try {
    const ocrResult = await Tesseract.recognize(
      filePath,
      'eng',
      {
        langPath: serverDir,
        logger: m => {
          if (m.status === 'recognizing text' && req.io) {
            req.io.to(userId.toString()).emit('ocr_progress', {
              invoiceId: invoice._id,
              progress: m.progress,
              status: m.status
            });
          }
        }
      }
    );

    const ocrText = ocrResult.data.text;
    invoice.ocrText = ocrText;
    
    // Pass extracted text to Gemini for structured extraction
    const extractedDetails = await analyzeInvoiceText(ocrText);
    
    invoice.extractedDetails = extractedDetails;
    invoice.status = 'pending'; // Stays pending until user reviews and confirms
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    console.error('Error processing upload:', error);
    invoice.status = 'failed';
    await invoice.save();
    res.status(500).json({ message: 'Error analyzing file', error: error.message });
  }
});

// 2. Confirm invoice & Create transaction
router.post('/confirm/:id', authenticateToken, async (req, res) => {
  const invoiceId = req.params.id;
  const { merchant, amount, date, tax, category, items } = req.body;
  const userId = req.user.id;

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update invoice with confirmed details
    invoice.extractedDetails = {
      merchant,
      amount: Number(amount),
      date: new Date(date),
      tax: Number(tax),
      category,
      items
    };
    invoice.status = 'completed';
    await invoice.save();

    // Create associated Transaction
    const transaction = new Transaction({
      user: userId,
      invoice: invoice._id,
      merchant,
      amount: Number(amount),
      date: new Date(date),
      category,
      type: 'expense',
      description: `Auto-generated from invoice ${invoice.fileName}`
    });
    await transaction.save();

    // Run budget verification
    await checkBudgetAlerts(userId, Number(amount), category, date, req);

    res.json({
      message: 'Invoice confirmed and transaction logged.',
      invoice,
      transaction
    });
  } catch (error) {
    console.error('Error confirming invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2.5 Log transaction manually (creates a dummy invoice and transaction)
router.post('/manual', authenticateToken, async (req, res) => {
  const { merchant, amount, date, category, description } = req.body;
  const userId = req.user.id;

  if (!merchant || !amount || !date || !category) {
    return res.status(400).json({ message: 'Merchant, amount, date and category are required.' });
  }

  try {
    // 1. Create a dummy Invoice record
    const invoice = new Invoice({
      user: userId,
      fileName: 'Manual Entry',
      filePath: '/manual', // special path indicator
      ocrText: description || 'Manual transaction entry',
      status: 'completed',
      extractedDetails: {
        merchant,
        amount: Number(amount),
        date: new Date(date),
        tax: 0,
        category,
        items: [{
          name: description || `${category} Spend`,
          price: Number(amount),
          quantity: 1
        }]
      }
    });
    await invoice.save();

    // 2. Create associated Transaction
    const transaction = new Transaction({
      user: userId,
      invoice: invoice._id,
      merchant,
      amount: Number(amount),
      date: new Date(date),
      category,
      type: 'expense',
      description: description || 'Manually logged spending'
    });
    await transaction.save();

    // 3. Run budget verification
    await checkBudgetAlerts(userId, Number(amount), category, date, req);

    res.json({
      message: 'Spending manual entry logged successfully.',
      invoice,
      transaction
    });
  } catch (error) {
    console.error('Error logging manual spending:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Get all invoices for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Delete Invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  const invoiceId = req.params.id;
  const userId = req.user.id;

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Clean up physical file if it exists
    const localPath = path.join(process.cwd(), invoice.filePath);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    // Delete associated transactions
    await Transaction.deleteMany({ invoice: invoiceId });

    // Delete invoice document
    await Invoice.findByIdAndDelete(invoiceId);

    res.json({ message: 'Invoice and associated transactions deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
