import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  writeBatch,
  increment,
  Timestamp
} from 'firebase/firestore';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft,
  Package,
  FileText,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface Expense {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

interface StockOutgoing {
  id: string;
  sellerId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'damaged' | 'wastage' | 'sample' | 'personal_use' | 'expired' | 'other';
  description: string;
  date: string;
  createdAt: string;
}

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  timestamp: any;
  unitSold?: string;
}

export default function Transactions() {
  const [activeTab, setActiveTab] = useState<'history' | 'expenses' | 'outgoing'>('history');
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [outgoingLogs, setOutgoingLogs] = useState<StockOutgoing[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isOutgoingModalOpen, setIsOutgoingModalOpen] = useState(false);

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Raw Materials', // Raw Materials, Transport, Rent, Utilities, Salaries, Other
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Outgoing Form State
  const [outgoingForm, setOutgoingForm] = useState({
    productId: '',
    quantity: '',
    reason: 'wastage', // damaged, wastage, sample, personal_use, expired, other
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [savingExpense, setSavingExpense] = useState(false);
  const [savingOutgoing, setSavingOutgoing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const sellerId = auth.currentUser.uid;

      // 1. Fetch Sales
      const salesQuery = query(collection(db, 'sales'), where('sellerId', '==', sellerId));
      const salesSnap = await getDocs(salesQuery);
      const fetchedSales = salesSnap.docs.map(doc => {
        const data = doc.data();
        let formattedDate = '';
        if (data.timestamp) {
          if (typeof data.timestamp.toDate === 'function') {
            formattedDate = data.timestamp.toDate().toISOString();
          } else if (data.timestamp.seconds) {
            formattedDate = new Date(data.timestamp.seconds * 1000).toISOString();
          } else {
            formattedDate = new Date(data.timestamp).toISOString();
          }
        } else {
          formattedDate = new Date().toISOString();
        }
        return {
          id: doc.id,
          productId: data.productId || '',
          productName: data.productName || 'Product',
          quantity: data.quantity || 0,
          totalAmount: data.totalAmount || 0,
          timestamp: formattedDate,
          unitSold: data.unitSold || 'item'
        } as unknown as Sale;
      });

      // 2. Fetch Expenses
      const expensesQuery = query(collection(db, 'expenses'), where('sellerId', '==', sellerId));
      const expensesSnap = await getDocs(expensesQuery);
      const fetchedExpenses = expensesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expense));

      // 3. Fetch Stock Outgoing Logs
      const outgoingQuery = query(collection(db, 'stock_outgoing'), where('sellerId', '==', sellerId));
      const outgoingSnap = await getDocs(outgoingQuery);
      const fetchedOutgoing = outgoingSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StockOutgoing));

      // 4. Fetch Products (for drop-down lookup)
      const productsQuery = query(collection(db, 'products'), where('sellerId', '==', sellerId));
      const productsSnap = await getDocs(productsQuery);
      const fetchedProducts = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      // Sort chronological descending
      setSales(fetchedSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setExpenses(fetchedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setOutgoingLogs(fetchedOutgoing.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Error loading finance details:", err);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  // Compile combined chronological transactions for 'history'
  const combinedTransactions = [
    ...sales.map(s => ({
      id: s.id,
      type: 'sale' as const,
      title: `Sale: ${s.productName}`,
      detail: `${s.quantity} ${s.unitSold || 'units'} sold`,
      amount: s.totalAmount,
      date: s.timestamp.split('T')[0],
      rawDate: new Date(s.timestamp),
      category: 'Inflow'
    })),
    ...expenses.map(e => ({
      id: e.id,
      type: 'expense' as const,
      title: e.title,
      detail: e.description || e.category,
      amount: e.amount,
      date: e.date,
      rawDate: new Date(e.date),
      category: e.category
    }))
  ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  // Log Expense Submit
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!expenseForm.title || !expenseForm.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    setSavingExpense(true);
    try {
      const expenseData = {
        sellerId: auth.currentUser.uid,
        title: expenseForm.title,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        date: expenseForm.date,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'expenses'), expenseData);
      toast.success("Expense recorded successfully");
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'Raw Materials',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save expense");
    } finally {
      setSavingExpense(false);
    }
  };

  // Log Outgoing Stock Submit
  const handleSaveOutgoing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!outgoingForm.productId || !outgoingForm.quantity) {
      toast.error("Please select a product and quantity");
      return;
    }

    const qtyToDeduct = Number(outgoingForm.quantity);
    if (qtyToDeduct <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    const selectedProd = products.find(p => p.id === outgoingForm.productId);
    if (!selectedProd) {
      toast.error("Invalid product selected");
      return;
    }

    if (selectedProd.stockQuantity < qtyToDeduct) {
      toast.error(`Insufficient stock! Currently available: ${selectedProd.stockQuantity}`);
      return;
    }

    setSavingOutgoing(true);
    try {
      const batch = writeBatch(db);

      // 1. Create Stock Outgoing Record
      const outgoingRef = doc(collection(db, 'stock_outgoing'));
      batch.set(outgoingRef, {
        sellerId: auth.currentUser.uid,
        productId: outgoingForm.productId,
        productName: selectedProd.name,
        quantity: qtyToDeduct,
        reason: outgoingForm.reason,
        description: outgoingForm.description,
        date: outgoingForm.date,
        createdAt: new Date().toISOString()
      });

      // 2. Deduct Live Product Stock level
      const productRef = doc(db, 'products', outgoingForm.productId);
      batch.update(productRef, {
        stockQuantity: increment(-qtyToDeduct),
        updatedAt: new Date().toISOString()
      });

      await batch.commit();

      toast.success(`Deducted ${qtyToDeduct} ${selectedProd.name} from stock`);
      setIsOutgoingModalOpen(false);
      setOutgoingForm({
        productId: '',
        quantity: '',
        reason: 'wastage',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      console.error("Error logging outgoing stock:", error);
      toast.error("Failed to log inventory deduction");
    } finally {
      setSavingOutgoing(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success("Expense details deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleDeleteOutgoing = async (log: StockOutgoing) => {
    if (!window.confirm("Cancel this outgoing log? This will refund stock items back into inventory.")) return;
    try {
      const batch = writeBatch(db);

      // Refund the inventory
      const productRef = doc(db, 'products', log.productId);
      batch.update(productRef, {
        stockQuantity: increment(log.quantity),
        updatedAt: new Date().toISOString()
      });

      // Delete log
      const logRef = doc(db, 'stock_outgoing', log.id);
      batch.delete(logRef);

      await batch.commit();
      toast.success("Record cancelled and inventory restored.");
      fetchData();
    } catch (error) {
      toast.error("Failed to cancel log");
    }
  };

  // Metrics
  const totalSalesVal = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalExpensesVal = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalWastageItems = outgoingLogs.reduce((acc, o) => acc + o.quantity, 0);
  const netCashFlow = totalSalesVal - totalExpensesVal;

  return (
    <div className="space-y-8 max-w-7xl mx-auto custom-scrollbar">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Finances & Outgoings</h2>
          <p className="text-gray-500 font-medium text-sm">Track sales, expenses, and non-sale stock reductions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-[#1c1c1c] text-[#3ecf8e] border border-[#3ecf8e]/20 px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#3ecf8e]/10 transition-all"
          >
            <DollarSign size={14} />
            Log Expense
          </button>
          
          <button 
            onClick={() => setIsOutgoingModalOpen(true)}
            className="bg-brand-primary text-black px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(62,207,142,0.2)]"
          >
            <Package size={14} />
            Record Outgoing Stock
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Inflow */}
        <div className="GlassCard p-6 border border-brand-border/40 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#9e9e9e] uppercase">Total Inflow (Sales)</span>
            <p className="text-2xl font-black text-[#ededed] tracking-tight mt-0.5">{formatCurrency(totalSalesVal)}</p>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="GlassCard p-6 border border-brand-border/40 relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 border border-red-500/20 shrink-0">
            <TrendingDown size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#9e9e9e] uppercase">Total Outflow (Expenses)</span>
            <p className="text-2xl font-black text-[#ededed] tracking-tight mt-0.5">{formatCurrency(totalExpensesVal)}</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="GlassCard p-6 border border-brand-border/40 relative overflow-hidden flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border",
            netCashFlow >= 0 
              ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" 
              : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#9e9e9e] uppercase">Net Cash flow</span>
            <p className={cn(
              "text-2xl font-black tracking-tight mt-0.5",
              netCashFlow >= 0 ? "text-brand-primary" : "text-red-400"
            )}>{formatCurrency(netCashFlow)}</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-brand-border bg-[#161616]/50 p-1 rounded-lg max-w-md">
        {[
          { id: 'history', label: 'All Transactions' },
          { id: 'expenses', label: 'Expenses Book' },
          { id: 'outgoing', label: 'Inventory Outgoings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchTerm('');
              setFilterCategory('All');
            }}
            className={cn(
              "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              activeTab === tab.id 
                ? "bg-[#252525] text-brand-primary shadow-sm" 
                : "text-gray-500 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN LOG PANEL */}
      <div className="GlassCard overflow-hidden">
        
        {/* INNER TAB: Combined Transaction Ledger */}
        {activeTab === 'history' && (
          <div>
            <div className="p-6 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Query ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111111] text-xs font-semibold py-2.5 pl-10 pr-4 border border-brand-border rounded-md text-white placeholder:text-gray-600 outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="flex items-center gap-3">
                <Filter size={14} className="text-gray-500" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-[#111111] text-xs font-bold border border-brand-border rounded-md px-3 py-2 text-white outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Inflow">Sales / Inflows Only</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Transport">Transport</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-brand-border/60">
              {combinedTransactions
                .filter(tx => {
                  const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        tx.detail.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCat = filterCategory === 'All' || 
                                     (filterCategory === 'Inflow' && tx.type === 'sale') ||
                                     tx.category === filterCategory;
                  return matchesSearch && matchesCat;
                })
                .map((tx, idx) => (
                  <div key={tx.id || idx} className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center border shrink-0",
                        tx.type === 'sale' 
                          ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20" 
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {tx.type === 'sale' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#ededed]">{tx.title}</h4>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                            tx.type === 'sale' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          )}>{tx.category}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{tx.detail}</p>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className={cn(
                          "text-sm font-bold",
                          tx.type === 'sale' ? "text-brand-primary" : "text-red-400"
                        )}>
                          {tx.type === 'sale' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </div>
                        <div className="flex items-center gap-1 justify-end text-[10px] text-gray-600 font-medium mt-1">
                          <Calendar size={10} />
                          {tx.date}
                        </div>
                      </div>
                      {tx.type === 'expense' && (
                        <button 
                          onClick={() => handleDeleteExpense(tx.id)}
                          className="p-1.5 bg-[#111111] text-gray-500 hover:text-red-400 border border-brand-border rounded-md transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

              {combinedTransactions.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <FileText className="text-gray-800 mb-4" size={48} />
                  <p className="text-gray-600 text-xs italic">No transactions recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INNER TAB: Expenses Book */}
        {activeTab === 'expenses' && (
          <div>
            <div className="p-6 border-b border-brand-border flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Expenses Ledger</h4>
                <p className="text-[11px] text-gray-600 mt-0.5">Separate accounting and cost items.</p>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-[#1c1c1c] text-[#3ecf8e] border border-[#3ecf8e]/20 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#3ecf8e]/10 transition-colors"
              >
                <Plus size={12} />
                Log Cost
              </button>
            </div>

            <div className="divide-y divide-brand-border/60">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#ededed]">{expense.title}</h4>
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20">{expense.category}</span>
                    </div>
                    {expense.description && (
                      <p className="text-[11px] text-gray-500 mt-1.5">{expense.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-400">-{formatCurrency(expense.amount)}</div>
                      <p className="text-[10px] text-gray-600 mt-1">{expense.date}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-1.5 bg-[#111111] text-gray-500 hover:text-red-400 border border-brand-border rounded-md transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <DollarSign className="text-gray-800 mb-4" size={48} />
                  <p className="text-gray-600 text-xs italic">No expenses reported yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INNER TAB: Inventory Outgoings (Products Going Out) */}
        {activeTab === 'outgoing' && (
          <div>
            {/* Header info */}
            <div className="p-6 border-b border-brand-border flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Stock Loss & Wastage Logs</h4>
                <p className="text-[11px] text-gray-600 mt-0.5">Audits products going out other than customer sales.</p>
              </div>
              <button 
                onClick={() => setIsOutgoingModalOpen(true)}
                className="bg-brand-primary text-black px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
              >
                <Plus size={12} />
                Deduct Stock
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-brand-border/60">
              {outgoingLogs.map((log) => (
                <div key={log.id} className="p-5 flex items-center justify-between hover:bg-white/[0.01]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{log.productName}</h4>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border",
                        log.reason === 'damaged' && "bg-red-500/10 text-red-400 border-red-500/20",
                        log.reason === 'wastage' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                        log.reason === 'personal_use' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        log.reason === 'sample' && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                        log.reason === 'expired' && "bg-[#ffa259]/10 text-[#ffa259] border-[#ffa259]/20"
                      )}>{log.reason}</span>
                    </div>
                    {log.description && (
                      <p className="text-[11px] text-gray-500 mt-1">${log.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black text-[#ffa259]">
                        -{log.quantity} units
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1">{log.date}</p>
                    </div>

                    <button 
                      onClick={() => handleDeleteOutgoing(log)}
                      className="p-1.5 bg-[#111111] text-gray-500 hover:text-red-400 border border-brand-border rounded-md transition-colors"
                      title="Restore stock quantity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {outgoingLogs.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <Package className="text-gray-800 mb-4" size={48} />
                  <p className="text-gray-600 text-xs italic">No manual inventory deductions logged.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Expense Register */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExpenseModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-[#1c1c1c] border border-brand-border rounded-xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveExpense} className="p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Log Business Expense</h3>
                  <p className="text-xs text-gray-500 mt-1">Keep track of operational costs for accurate profit margins.</p>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Expense Title / Item</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Gas Cylinder Refill, Market Transport"
                      value={expenseForm.title}
                      onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                      className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                    />
                  </div>

                  {/* Row: Category + Amount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Category</label>
                      <select
                        value={expenseForm.category}
                        onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                        className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                      >
                        <option value="Raw Materials">Raw Materials</option>
                        <option value="Transport">Transport</option>
                        <option value="Rent">Rent</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Amount (₦)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="0"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                        className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Expense Date</label>
                      <input 
                        type="date" 
                        required
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                        className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Description (Optional)</label>
                    <textarea 
                      placeholder="Enter more context..."
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                      className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md h-20 focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="flex-1 py-3 bg-[#2a2a2a] hover:bg-[#3e3e3e] text-white text-xs font-bold rounded-md uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingExpense}
                    className="flex-1 py-3 bg-brand-primary text-black text-xs font-bold rounded-md uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {savingExpense ? 'Logging...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Outgoing inventory / wastage ledger */}
      <AnimatePresence>
        {isOutgoingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOutgoingModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-[#1c1c1c] border border-brand-border rounded-xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveOutgoing} className="p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Log Outgoing Stock</h3>
                  <p className="text-xs text-gray-500 mt-1">Deduct stock items damaged, wasted, shared as samples, or used for personal consumption.</p>
                </div>

                <div className="space-y-4">
                  {/* Select Product */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Select Product</label>
                    <select
                      value={outgoingForm.productId}
                      required
                      onChange={(e) => setOutgoingForm({...outgoingForm, productId: e.target.value})}
                      className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                    >
                      <option value="">Choose item...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.stockQuantity} in stock)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity to deduct + Reason */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Quantity (Units)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="0"
                        value={outgoingForm.quantity}
                        onChange={(e) => setOutgoingForm({...outgoingForm, quantity: e.target.value})}
                        className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Reason</label>
                      <select
                        value={outgoingForm.reason}
                        onChange={(e) => setOutgoingForm({...outgoingForm, reason: e.target.value as any})}
                        className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                      >
                        <option value="wastage">Wastage / Spill</option>
                        <option value="damaged">Damaged Goods</option>
                        <option value="sample">Free Sample</option>
                        <option value="personal_use">Personal Use</option>
                        <option value="expired">Expired Stock</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Deduction Date</label>
                    <input 
                      type="date" 
                      required
                      value={outgoingForm.date}
                      onChange={(e) => setOutgoingForm({...outgoingForm, date: e.target.value})}
                      className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Comments / Notes</label>
                    <textarea 
                      placeholder="Describe what occurred (e.g. spillage during packaging)"
                      value={outgoingForm.description}
                      onChange={(e) => setOutgoingForm({...outgoingForm, description: e.target.value})}
                      className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md h-20 focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsOutgoingModalOpen(false)}
                    className="flex-1 py-3 bg-[#2a2a2a] hover:bg-[#3e3e3e] text-white text-xs font-bold rounded-md uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingOutgoing}
                    className="flex-1 py-3 bg-brand-primary text-black text-xs font-bold rounded-md uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {savingOutgoing ? 'Logging...' : 'Confirm Deduction'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
