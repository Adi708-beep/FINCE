import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  ocrText: {
    type: String,
    default: ''
  },
  extractedDetails: {
    merchant: { type: String, default: 'Unknown' },
    amount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    tax: { type: Number, default: 0 },
    category: { type: String, default: 'Uncategorized' },
    items: [
      {
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number, default: 1 }
      }
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
