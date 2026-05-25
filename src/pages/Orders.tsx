import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp, 
  doc, 
  updateDoc,
  increment,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { 
  ShoppingCart, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  X,
  Filter,
  CreditCard,
  User as UserIcon,
  Phone,
  Package
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order } from '../types';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Order Form state
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    items: [] as any[]
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'orders'), where('sellerId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      const fetchedOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort in-memory to prevent missing composite index errors
      fetchedOrders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setOrders(fetchedOrders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!auth.currentUser) return;
    const snap = await getDocs(query(collection(db, 'products'), where('sellerId', '==', auth.currentUser.uid)));
    setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
  };

  const calculateTotal = (items: any[]) => items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || newOrder.items.length === 0) return;

    try {
      const batch = writeBatch(db);
      const sellerId = auth.currentUser.uid;
      const totalAmount = calculateTotal(newOrder.items);

      // 1. Create the order
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        ...newOrder,
        sellerId,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Deduct inventory
      for (const item of newOrder.items) {
        const prodRef = doc(db, 'products', item.productId);
        const product = products.find(p => p.id === item.productId);
        
        let deduction = item.quantity;
        if (item.unitType === 'pack') deduction *= (product?.packSize || 1);
        if (item.unitType === 'carton') deduction *= (product?.cartonSize || 1);

        batch.update(prodRef, {
          stockQuantity: increment(-deduction),
          updatedAt: new Date().toISOString()
        });

        // 3. Create a Sale record
        const saleRef = doc(collection(db, 'sales'));
        batch.set(saleRef, {
          sellerId,
          productId: item.productId,
          productName: item.productName,
          quantity: deduction,
          unitSold: item.unitType,
          unitQuantity: item.quantity,
          totalAmount: item.price * item.quantity,
          timestamp: Timestamp.now()
        });
      }

      await batch.commit();
      toast.success('Sale processed');
      setIsAddModalOpen(false);
      setNewOrder({ customerName: '', customerPhone: '', items: [] });
      fetchOrders();
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const addItemToOrder = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setNewOrder(prev => {
      const existingIdx = prev.items.findIndex(i => i.productId === productId && i.unitType === 'item');
      if (existingIdx > -1) {
        const newItems = [...prev.items];
        newItems[existingIdx].quantity += 1;
        return { ...prev, items: newItems };
      }
      return {
        ...prev,
        items: [...prev.items, { 
          productId: product.id, 
          productName: product.name, 
          price: product.price, 
          quantity: 1, 
          unitType: 'item' 
        }]
      };
    });
  };

  const updateItemInOrder = (index: number, updates: any) => {
    setNewOrder(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  };

  const removeItemFromOrder = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: new Date().toISOString() });
      toast.success(`Marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Sales & Orders</h2>
          <p className="text-gray-500 font-medium text-sm">Track your transactions and shop performance.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-primary text-black px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(62,207,142,0.2)]"
        >
          <Plus size={18} />
          Record New Sale
        </button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <motion.div 
            layout
            key={order.id}
            className="GlassCard p-6 space-y-4 bg-[#1c1c1c]"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-base tracking-tight">{order.customerName || 'Walk-in Customer'}</h4>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                  <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                order.status === 'completed' ? "bg-brand-primary/10 text-brand-primary" : 
                order.status === 'cancelled' ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
              )}>
                {order.status}
              </span>
            </div>

            <div className="py-4 border-y border-brand-border space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs font-medium">
                  <span className="text-gray-400">{item.productName} <span className="text-gray-600">x{item.quantity}</span></span>
                  <span className="font-bold text-white">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 text-sm font-bold border-t border-brand-border/10">
                <span className="text-gray-600">TOTAL</span>
                <span className="text-brand-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="flex-1 py-1.5 bg-brand-primary/10 text-brand-primary rounded-md text-[10px] font-bold hover:bg-brand-primary/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={14} /> Mark Paid
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="flex-1 py-1.5 bg-red-500/10 text-red-500 rounded-md text-[10px] font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-full py-20 GlassCard border-dashed border-gray-800 text-center flex flex-col items-center">
            <ShoppingCart className="text-gray-800 mb-4" size={48} />
            <p className="text-gray-600 text-sm italic">No sales recorded yet.</p>
          </div>
        )}
      </div>

      {/* New Sale Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-[#1c1c1c] border border-brand-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-brand-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">New Sale Transaction</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Customer Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                        <input
                          type="text"
                          value={newOrder.customerName}
                          onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                          placeholder="Walk-in Customer"
                          className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-brand-border rounded-md text-white text-sm outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Catalog</label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {products.map(p => (
                         <button 
                           key={p.id}
                           onClick={() => addItemToOrder(p.id)}
                           className="w-full flex items-center justify-between p-3 bg-[#111111] hover:bg-[#1c1c1c] rounded-md border border-brand-border transition-all group"
                         >
                           <div className="flex items-center gap-3 text-left">
                             <div className="w-8 h-8 rounded-md bg-[#2e2e2e] text-brand-primary flex items-center justify-center font-bold text-xs">
                               {p.name.charAt(0)}
                             </div>
                             <div>
                               <span className="font-bold text-white text-xs block">{p.name}</span>
                               <span className="text-[10px] font-bold text-gray-600 uppercase">{p.stockQuantity} Left</span>
                             </div>
                           </div>
                           <span className="font-bold text-brand-primary text-xs">{formatCurrency(p.price)}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#111111] rounded-xl p-6 border border-brand-border flex flex-col h-full">
                  <h4 className="font-bold text-white text-sm border-b border-brand-border pb-3 mb-4">Cart Summary</h4>
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                    {newOrder.items.map((item, idx) => (
                      <div key={idx} className="bg-[#1c1c1c] p-3 rounded-lg border border-brand-border space-y-2">
                        <div className="flex justify-between items-start">
                           <p className="font-bold text-white text-[11px] truncate w-32">{item.productName}</p>
                           <button onClick={() => removeItemFromOrder(idx)} className="text-gray-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemInOrder(idx, { quantity: Number(e.target.value) })}
                            className="w-12 px-2 py-1 bg-[#111111] border border-brand-border rounded text-center font-bold text-white text-xs"
                          />
                          <select
                            value={item.unitType}
                            onChange={(e) => updateItemInOrder(idx, { unitType: e.target.value })}
                            className="bg-transparent border-none text-gray-500 font-bold text-[10px] uppercase outline-none"
                          >
                            <option value="item">Units</option>
                            <option value="pack">Packs</option>
                            <option value="carton">Cartons</option>
                          </select>
                          <p className="font-bold text-brand-primary text-xs ml-auto">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                    {newOrder.items.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                        <ShoppingCart size={24} className="text-gray-600 mb-2" />
                        <p className="text-gray-600 text-[10px] font-bold">Cart is empty</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <div className="flex justify-between items-end mb-4">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Total Bill</span>
                       <span className="text-2xl font-bold text-brand-primary">{formatCurrency(calculateTotal(newOrder.items))}</span>
                    </div>
                    <button 
                      onClick={handleCreateOrder}
                      disabled={newOrder.items.length === 0}
                      className="w-full py-3 bg-brand-primary text-black rounded-md font-bold text-sm shadow-xl disabled:opacity-30 hover:brightness-110 transition-all uppercase"
                    >
                      Process Checkout
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
