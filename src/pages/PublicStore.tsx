import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, logSafeAnalyticsEvent } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  MessageCircle, 
  Share2, 
  Package, 
  Info,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { Product } from '../types';

export default function PublicStore() {
  const { userId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState('BizNaija Shop');
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!userId) return;
      try {
        // Fetch Seller Info
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setSellerName(userData.businessName || "BizNaija Shop");
          setSellerPhone(userData.phoneNumber || null);
        }
        
        // Fetch Products
        const q = query(
          collection(db, 'products'), 
          where('sellerId', '==', userId)
        );
        const snap = await getDocs(q);
        const prods = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.isVisible !== false);
        setProducts(prods);

        // Security Guard: Log safe analytics action with full PII scrubbing
        if (prods.length > 0) {
          logSafeAnalyticsEvent('view_item_list', {
            sellerName: userSnap.exists() ? userSnap.data().businessName : 'Unknown',
            itemCount: prods.length,
            categories: [...new Set(prods.map(p => p.category))]
          });
        }
      } catch (error) {
        console.error("Error fetching public store:", error);
        toast.error("Storefront offline");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [userId]);

  const handleWhatsAppOrder = (product: Product) => {
    // Security Guard: Log purchase inquiry attempt with sanitization
    logSafeAnalyticsEvent('begin_checkout', {
      itemId: product.id,
      itemName: product.name,
      value: product.price,
      currency: 'NGN',
      category: product.category
    });

    const storeLink = window.location.href;
    const message = `Pẹlẹ o! \n\nI'm interested in: *${product.name}*\nPrice: ${formatCurrency(product.price)}\n\nSeen on your BizNaija store: ${storeLink}`;
    const encoded = encodeURIComponent(message);
    const cleanedPhone = sellerPhone ? sellerPhone.replace(/[\s\-\+\(\)]/g, '') : '';
    const whatsappUrl = cleanedPhone 
      ? `https://wa.me/${cleanedPhone}?text=${encoded}` 
      : `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareStore = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-gray-300 font-sans">
      {/* Visual Header */}
      <div className="bg-[#111111] border-b border-brand-border h-48 sm:h-64 relative overflow-hidden">
        <div className="absolute inset-0 AfricanPattern opacity-5" />
        <div className="max-w-7xl mx-auto px-6 h-full flex items-end pb-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#1c1c1c] border border-brand-border rounded-xl flex items-center justify-center text-brand-primary text-4xl sm:text-5xl font-bold shadow-2xl">
                {sellerName.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{sellerName}</h1>
                <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
                  <Package size={16} /> {products.length} Products listed
                </p>
              </div>
            </div>
            <button 
              onClick={shareStore}
              className="bg-[#1c1c1c] border border-brand-border text-white px-5 py-2 rounded-md font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#252525] transition-all self-start sm:self-auto"
            >
              <Share2 size={16} /> Share link
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-2 px-1">Curated Catalog</h2>
          <div className="w-10 h-1 bg-brand-primary border-brand-primary/20 rounded-full"></div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 GlassCard border-dashed border-gray-800 flex flex-col items-center">
             <ShoppingBag size={48} className="text-gray-800 mb-6" />
             <h3 className="text-xl font-bold text-white">Store is quiet right now</h3>
             <p className="text-gray-600 mt-2 text-sm italic">Check back later for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group GlassCard bg-[#1c1c1c] hover:border-brand-primary/30 transition-all overflow-hidden flex flex-col"
              >
                <div className="h-64 bg-[#111111] relative overflow-hidden flex items-center justify-center border-b border-brand-border">
                   {product.imageUrl ? (
                     <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   ) : (
                     <div className="text-6xl font-bold text-[#1a1a1a] select-none">{product.name.charAt(0)}</div>
                   )}
                   <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                     {product.category}
                   </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-brand-primary transition-colors">{product.name}</h3>
                    <p className="text-lg font-bold text-brand-primary">{formatCurrency(product.price)}</p>
                  </div>
                  
                  <p className="text-gray-500 text-sm font-medium line-clamp-2 mb-8 flex-1 leading-relaxed">
                    {product.description || "Authentic quality selection from our shop catalog."}
                  </p>

                  <button 
                    onClick={() => handleWhatsAppOrder(product)}
                    className="w-full py-3 bg-brand-primary text-black rounded-md font-bold flex items-center justify-center gap-3 transition-all hover:brightness-110 shadow-[0_0_20px_rgba(62,207,142,0.1)] active:scale-[0.98]"
                  >
                    <MessageCircle size={18} />
                    Inquire on WhatsApp
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-16 border-t border-brand-border flex flex-col items-center text-center gap-8 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center font-bold text-xl text-black">B</div>
          <h1 className="text-xl font-bold text-white tracking-tight">BizNaija</h1>
        </div>
        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.4em]">Optimized by BizNaija • Empowerment for Local Commerce</p>
      </footer>
    </div>
  );
}
