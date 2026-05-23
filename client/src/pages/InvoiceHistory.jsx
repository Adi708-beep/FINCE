import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag, 
  DollarSign, 
  FileText, 
  ArrowUpDown,
  Download,
  X
} from 'lucide-react';

const InvoiceHistory = () => {
  const { getHeaders } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search / Filter / Sort State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Details Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const categories = [
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

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/invoices`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This will also remove the associated ledger transaction.')) return;
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setInvoices(prev => prev.filter(invoice => invoice._id !== id));
        if (selectedInvoice && selectedInvoice._id === id) {
          setSelectedInvoice(null);
        }
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  // Filter & Sort computation
  const processedInvoices = invoices
    .filter(inv => {
      const merchantMatch = inv.extractedDetails?.merchant?.toLowerCase().includes(search.toLowerCase());
      const filenameMatch = inv.fileName?.toLowerCase().includes(search.toLowerCase());
      const categoryMatch = categoryFilter === '' || inv.extractedDetails?.category?.toLowerCase() === categoryFilter.toLowerCase();
      return (merchantMatch || filenameMatch) && categoryMatch;
    })
    .sort((a, b) => {
      const amtA = a.extractedDetails?.amount || 0;
      const amtB = b.extractedDetails?.amount || 0;
      const dateA = new Date(a.extractedDetails?.date || a.createdAt);
      const dateB = new Date(b.extractedDetails?.date || b.createdAt);

      if (sortBy === 'date_desc') return dateB - dateA;
      if (sortBy === 'date_asc') return dateA - dateB;
      if (sortBy === 'amount_desc') return amtB - amtA;
      if (sortBy === 'amount_asc') return amtA - amtB;
      return 0;
    });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500 font-mono">Loading archive entries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filters */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search merchant or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 shadow-sm placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
          <div className="w-full sm:w-40">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 shadow-sm font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-40">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary text-slate-800 shadow-sm font-medium"
            >
              <option value="date_desc">Latest Date</option>
              <option value="date_asc">Oldest Date</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="glass-panel overflow-hidden border border-darkborder bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-darkborder bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">File Name</th>
                <th className="p-4">Merchant</th>
                <th className="p-4">Date</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkborder/50 text-xs text-slate-700">
              {processedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                    No matching invoices found in your archive.
                  </td>
                </tr>
              ) : (
                processedInvoices.map((inv) => {
                  const statusColors = {
                    pending: 'bg-warning/10 border-warning/20 text-warning',
                    processing: 'bg-primary/10 border-primary/20 text-primary',
                    completed: 'bg-success/10 border-success/20 text-success',
                    failed: 'bg-error/10 border-error/20 text-error'
                  };

                  return (
                    <tr key={inv._id} className="hover:bg-black/[0.01] transition-colors">
                      <td className="p-4 font-semibold text-slate-900 flex items-center gap-2 max-w-[180px] truncate">
                        <FileText className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                        <span className="truncate">{inv.fileName}</span>
                      </td>
                      <td className="p-4 font-outfit font-bold text-slate-800">{inv.extractedDetails?.merchant}</td>
                      <td className="p-4 text-slate-500 font-mono">
                        {new Date(inv.extractedDetails?.date || inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500">
                          {inv.extractedDetails?.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-primary font-mono">
                        ₹{(inv.extractedDetails?.amount || 0).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors"
                            title="Audit Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv._id)}
                            className="p-1.5 rounded-lg border border-error/10 bg-error/5 text-error hover:text-error hover:bg-error/15 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Slide-out/Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full p-6 border border-slate-200 rounded-2xl text-slate-800 space-y-6 max-h-[90vh] overflow-y-auto relative animate-scale-in shadow-2xl">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold font-outfit text-slate-900 mb-1">Receipt Structure Audit</h3>
              <p className="text-xs text-slate-400 font-mono">Invoice ID: {selectedInvoice._id}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-slate-100 py-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Category</span>
                <span className="text-slate-800 font-bold text-sm">{selectedInvoice.extractedDetails?.category}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Receipt Date</span>
                <span className="text-slate-800 font-bold text-sm">{new Date(selectedInvoice.extractedDetails?.date).toDateString()}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">💸 Total Charged</span>
                <span className="text-primary font-extrabold text-sm font-mono">₹{(selectedInvoice.extractedDetails?.amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Item list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itemized Line Items</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden text-xs shadow-sm">
                <div className="grid grid-cols-12 p-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-500">
                  <div className="col-span-8">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                  {selectedInvoice.extractedDetails?.items?.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 font-semibold text-xs">No items parsed.</div>
                  ) : (
                    selectedInvoice.extractedDetails.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 p-3 text-slate-700 font-mono">
                        <div className="col-span-8 truncate font-medium">{item.name}</div>
                        <div className="col-span-2 text-center font-bold">{item.quantity || 1}</div>
                        <div className="col-span-2 text-right text-slate-900 font-bold">₹{(item.price || 0).toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Raw OCR logs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Raw OCR Text Logs</h4>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-700 font-mono overflow-auto max-h-32 whitespace-pre-wrap leading-relaxed select-all shadow-inner">
                {selectedInvoice.ocrText || 'No raw OCR logs associated with this parse.'}
              </pre>
            </div>

            {/* Document link */}
            <div className="flex justify-between items-center text-xs">
              <a 
                href={`${API_URL}${selectedInvoice.filePath}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <Download className="w-4 h-4" /> View Original File
              </a>
              
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-semibold shadow-sm transition-all"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
