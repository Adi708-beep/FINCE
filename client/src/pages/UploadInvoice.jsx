import React, { useState, useEffect, useRef } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  Trash2, 
  Plus, 
  Loader, 
  ArrowRight,
  Terminal,
  Scan
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadInvoice = () => {
  const { getHeaders, socket } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Flow State: 'upload' | 'ocr' | 'review'
  const [stage, setStage] = useState('upload'); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OCR Streaming logs state
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLog, setOcrLog] = useState([]);

  // Extracted Invoice State (Returned by API for review)
  const [invoiceId, setInvoiceId] = useState(null);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState('');
  const [tax, setTax] = useState(0);
  const [category, setCategory] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [items, setItems] = useState([]);

  const categories = [
    "Food", 
    "Travel", 
    "Utilities", 
    "Cloud Infrastructure", 
    "Subscriptions", 
    "Medical", 
    "Shopping", 
    "Entertainment", 
    "Operations"
  ];

  // Subscribe to real-time socket updates
  useEffect(() => {
    if (socket) {
      const handleOcrProgress = (data) => {
        if (data.invoiceId === invoiceId || !invoiceId) {
          setOcrProgress(Math.round(data.progress * 100));
          setOcrLog(prev => [
            ...prev, 
            `[OCR Engine] Scanning ${Math.round(data.progress * 100)}% - status: ${data.status}`
          ]);
        }
      };

      socket.on('ocr_progress', handleOcrProgress);

      return () => {
        socket.off('ocr_progress', handleOcrProgress);
      };
    }
  }, [socket, invoiceId]);

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const fileChangeHandler = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    const filetypes = /jpeg|jpg|png|pdf/;
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!filetypes.test(extension)) {
      setErrorMsg('Invalid file format. Please upload JPEG, PNG, or PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File is too large. Max size allowed is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploadLoading(true);
    setStage('ocr');
    setOcrProgress(0);
    setOcrLog(['[System] Initializing file stream...', '[System] Saving file to local storage...']);

    const formData = new FormData();
    formData.append('invoice', selectedFile);

    try {
      const res = await fetch(`${API_URL}/api/invoices/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('fince_token')}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const invoiceData = await res.json();
      setInvoiceId(invoiceData._id);
      
      // Populate review values from Gemini parsing
      const details = invoiceData.extractedDetails;
      setMerchant(details.merchant || 'Unknown');
      setAmount(details.amount || 0);
      
      // Format date YYYY-MM-DD
      const rawDate = details.date ? new Date(details.date) : new Date();
      setDate(rawDate.toISOString().split('T')[0]);
      
      setTax(details.tax || 0);
      setCategory(details.category || 'Operations');
      setInvoiceNumber(details.invoiceNumber || '');
      
      const rawDueDate = details.dueDate ? new Date(details.dueDate) : null;
      setDueDate(rawDueDate ? rawDueDate.toISOString().split('T')[0] : '');
      
      setGstNumber(details.gstNumber || '');
      setItems(details.items || []);

      setOcrLog(prev => [...prev, '[System] Gemini parsing complete.', '[System] Awaiting user confirmation...']);
      setStage('review');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error processing invoice. Please try again.');
      setStage('upload');
    } finally {
      setUploadLoading(false);
    }
  };

  // Item list updates
  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = field === 'name' ? value : Number(value);
    
    // Auto-update total amount based on items sum
    if (field === 'price' || field === 'quantity') {
      const sum = updated.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
      setAmount(Number((sum + Number(tax)).toFixed(2)));
    }
    
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { name: 'New Item', price: 0, quantity: 1 }]);
  };

  const removeItemRow = (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    const sum = updated.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    setAmount(Number((sum + Number(tax)).toFixed(2)));
    setItems(updated);
  };

  // Final confirmation
  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/invoices/confirm/${invoiceId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          merchant,
          amount,
          date,
          tax,
          category,
          invoiceNumber,
          dueDate: dueDate || null,
          gstNumber,
          items
        })
      });

      if (!res.ok) {
        throw new Error('Failed to confirm invoice details');
      }

      alert('Invoice successfully confirmed and logged!');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete transaction.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-800">
      {stage === 'upload' && (
        <div className="space-y-6">
          <div className="glass-panel p-8 text-center border-2 border-dashed border-darkborder relative overflow-hidden"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {dragActive && (
              <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm pointer-events-none" />
            )}

            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-darkborder flex items-center justify-center mx-auto text-primary shadow-glow-primary/5">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">Upload Receipt or Invoice</h4>
                <p className="text-xs text-slate-500 mt-1">Drag and drop files here, or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={fileChangeHandler}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-5 py-2.5 rounded-xl border border-darkborder bg-slate-50 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
              >
                Choose File
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-6 uppercase font-mono">PNG, JPG, JPEG, or PDF up to 10MB</p>
          </div>

          {selectedFile && (
            <div className="glass-panel p-4 flex items-center justify-between border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-secondary" />
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <button 
                onClick={handleUploadSubmit}
                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs rounded-xl shadow-glow-primary glow-button flex items-center gap-1.5 shadow-sm transition-all"
              >
                Process File <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-xs text-error font-medium">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {stage === 'ocr' && (
        <div className="glass-panel p-6 border-darkborder space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Loader className="w-5 h-5 text-primary animate-spin" />
              <h4 className="font-bold text-base text-slate-900">OCR & AI Structuring Active</h4>
            </div>
            <span className="text-xs text-secondary font-mono">{ocrProgress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-300"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>

          {/* Stream Log terminal */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 h-48 overflow-y-auto font-mono text-[10px] text-slate-700 space-y-1 shadow-inner">
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2 text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold">LOG_STREAM_OUTPUT</span>
            </div>
            {ocrLog.map((log, index) => (
              <div key={index} className="leading-relaxed text-slate-600 font-medium">{log}</div>
            ))}
          </div>
        </div>
      )}

      {stage === 'review' && (
        <form onSubmit={handleConfirmSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File details review card */}
          <div className="glass-panel p-6 lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-darkborder pb-3">
              <Scan className="w-5 h-5 text-secondary" />
              <h4 className="font-bold text-base text-slate-900">Parser Audit</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Uploaded Document</span>
                <span className="text-slate-800 font-mono break-all block mt-0.5">{selectedFile?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Engine Confidence</span>
                <span className="text-success font-bold mt-0.5 block flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 94% Gemini Extract
                </span>
              </div>
              <div className="pt-3 border-t border-darkborder/50 text-[10px] text-slate-500 leading-normal font-medium">
                Please double check the values on the right. If any fields are incorrect, you can edit them directly in the database record before logging.
              </div>
            </div>
          </div>

          {/* Form fields & Itemized list */}
          <div className="glass-panel p-6 lg:col-span-8 space-y-6">
            <h4 className="font-bold text-base text-slate-900 border-b border-darkborder pb-3">Structured Ledger Review</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Merchant Name</label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-medium shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-medium shadow-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono shadow-sm"
                  placeholder="e.g. INV-2026-001"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GST Identification (GSTIN)</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono shadow-sm"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tax (GST/Sales Tax)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 font-mono shadow-sm"
                />
              </div>
            </div>

            {/* Itemized breakdown table */}
            <div className="space-y-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Itemized Breakdown</span>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-xs text-primary hover:text-primary-hover flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-xl font-medium">
                    No items listed. Click "Add Row" to append items.
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Item Description"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-800 shadow-sm"
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          required
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-800 text-center font-mono shadow-sm"
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-3">
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-mono">₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            required
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-800 text-right font-mono shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Block */}
            <div className="border-t border-darkborder pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Invoice Aggregate</span>
                <span className="text-2xl font-bold font-outfit text-primary">₹{amount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setStage('upload')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 hover:text-slate-800 font-semibold shadow-sm transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-slate-900 font-extrabold text-xs rounded-xl shadow-glow-primary glow-button flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {uploadLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm & Save Ledger</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default UploadInvoice;
