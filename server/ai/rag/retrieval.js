import Transaction from '../../models/Transaction.js';
import Invoice from '../../models/Invoice.js';
import Budget from '../../models/Budget.js';
import { indexDocument, searchVectorStore, clearStore } from '../embeddings/vectorStore.js';

/**
 * Syncs the MongoDB collection items into the Vector Store in-memory cache
 * @param {string} userId - User ID
 */
export async function syncUserKnowledgeBase(userId) {
  try {
    clearStore();

    // Index Transactions
    const txs = await Transaction.find({ user: userId });
    for (const t of txs) {
      const text = `Transaction of ₹${t.amount} at ${t.merchant || 'Unknown'} under category ${t.category || 'Others'} on ${t.date.toISOString().split('T')[0]}. description: ${t.description || ''}`;
      await indexDocument(t._id.toString(), text, { type: 'transaction', data: t });
    }

    // Index Invoices
    const invoices = await Invoice.find({ user: userId });
    for (const inv of invoices) {
      const text = `Invoice from merchant ${inv.merchantName || 'Unknown'} with total bill ₹${inv.totalAmount} issued on ${inv.invoiceDate ? inv.invoiceDate.toISOString().split('T')[0] : 'Unknown'}. ocr: ${inv.rawOcrText || ''}`;
      await indexDocument(inv._id.toString(), text, { type: 'invoice', data: inv });
    }

    // Index Budgets
    const budgets = await Budget.find({ user: userId });
    for (const b of budgets) {
      const text = `Budget category limit for ${b.category} set to ₹${b.limit} for cycle ${b.month}/${b.year}`;
      await indexDocument(b._id.toString(), text, { type: 'budget', data: b });
    }
  } catch (error) {
    console.error("Failed to sync user knowledge base in RAG layer:", error);
  }
}
