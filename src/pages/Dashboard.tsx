import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  ExternalLink,
  MessageCircle,
  QrCode,
  Settings,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Product, Sale } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    lowStock: 0,
    totalProducts: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Settings States & Verification Fields
  const [userProfile, setUserProfile] = useState({
    businessName: '',
    phoneNumber: '',
    businessType: 'General',
    isVerified: false,
    verificationType: ''
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Simulated KYC Verification State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [kycForm, setKycForm] = useState({
    docType: 'BVN',
    docNumber: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const sellerId = auth.currentUser.uid;

      // User Profile details
      try {
        const userRef = doc(db, 'users', sellerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setUserProfile({
            businessName: uData.businessName || '',
            phoneNumber: uData.phoneNumber || '',
            businessType: uData.businessType || 'General',
            isVerified: uData.isVerified || false,
            verificationType: uData.verificationType || ''
          });
        }
      } catch (errProfile) {
        console.warn("Could not load user profile:", errProfile);
      }

      // Products
      const productsSnap = await getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId)));
      const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Sales
      const salesSnap = await getDocs(query(
        collection(db, 'sales'), 
        where('sellerId', '==', sellerId)
      ));
      const salesRaw = salesSnap.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Sale;
      });
      // Sort in-memory to prevent missing composite index errors completely
      salesRaw.sort((a, b) => {
        const dateA = a.timestamp && typeof a.timestamp.toDate === 'function' 
          ? a.timestamp.toDate().getTime() 
          : a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp && typeof b.timestamp.toDate === 'function' 
          ? b.timestamp.toDate().getTime() 
          : b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
      const sales = salesRaw.slice(0, 50);

      // Insights with Caching
      const cachedInsights = localStorage.getItem(`biznaija_insights_${sellerId}`);
      const cacheTimestamp = localStorage.getItem(`biznaija_insights_time_${sellerId}`);
      const isCacheFresh = cacheTimestamp && (Date.now() - Number(cacheTimestamp) < 10 * 60 * 1000); // 10 mins

      if (cachedInsights && isCacheFresh) {
        setInsights(JSON.parse(cachedInsights));
      } else {
        try {
          const insightsRes = await fetch('/api/ai/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inventoryData: products.slice(0, 5), salesData: sales.slice(0, 5) })
          });
          const insightsData = await insightsRes.json();
          const newInsights = insightsData.insights || [];
          setInsights(newInsights);
          localStorage.setItem(`biznaija_insights_${sellerId}`, JSON.stringify(newInsights));
          localStorage.setItem(`biznaija_insights_time_${sellerId}`, Date.now().toString());
        } catch (err) {
          console.warn('Could not refresh insights, using old cache if available');
          if (cachedInsights) setInsights(JSON.parse(cachedInsights));
        }
      }

      // Calculate Stats
      const totalRev = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
      const lowStockCount = products.filter(p => p.stockQuantity <= p.lowStockThreshold).length;

      setStats({
        totalSales: sales.length,
        totalRevenue: totalRev,
        lowStock: lowStockCount,
        totalProducts: products.length
      });
      setRecentSales(sales.slice(0, 5));

      // Chart Data
      const mockChart = [
        { name: 'Mon', revenue: 4000 },
        { name: 'Tue', revenue: 3000 },
        { name: 'Wed', revenue: 5000 },
        { name: 'Thu', revenue: 2780 },
        { name: 'Fri', revenue: 1890 },
        { name: 'Sat', revenue: 2390 },
        { name: 'Sun', revenue: 3490 },
      ];
      setChartData(mockChart);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareStoreLink = () => {
    if (!auth.currentUser) return;
    const url = `${window.location.origin}/store/${auth.currentUser.uid}`;
    navigator.clipboard.writeText(url);
    toast.success("Store link copied!");
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSavingSettings(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        businessName: userProfile.businessName,
        phoneNumber: userProfile.phoneNumber,
        businessType: userProfile.businessType,
        updatedAt: new Date().toISOString()
      });
      toast.success('Settings updated successfully');
      setIsSettingsOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSimulateKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!kycForm.docNumber) {
      toast.error("Please enter your ID number.");
      return;
    }
    setIsVerifying(true);
    try {
      // Direct post to secure container endpoint bypassing standard Firestore user limits
      const res = await fetch("/api/verify-kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          docType: kycForm.docType,
          docNumber: kycForm.docNumber
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Biometric Match Succeeded: Trusted Profile unlocked via ${kycForm.docType}`);
        setIsKycModalOpen(false);
        fetchDashboardData();
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (err: any) {
      console.error("KYC simulation error:", err);
      toast.error("Network or verification request failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <motion.div 
      whileHover={{ y: -2 }}
      className="GlassCard p-6 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg bg-[#2e2e2e] ${color}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`text-[10px] font-bold tracking-tight px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex justify-between items-center sm:items-end gap-2">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-gray-500 font-medium text-sm text-gray-400">Real-time trust analytics & business metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          {userProfile.isVerified ? (
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Smile ID Verified ({userProfile.verificationType})</span>
            </div>
          ) : (
            <button 
              onClick={() => setIsKycModalOpen(true)}
              className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.05)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Pending Verify (Smile ID)</span>
            </button>
          )}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="bg-[#1c1c1c] border border-brand-border p-2 rounded-lg text-white hover:bg-[#2e2e2e] transition-all flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2"
            title="Business Settings"
          >
            <Settings size={14} className="text-brand-primary" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button 
            onClick={fetchDashboardData}
            className="bg-[#1c1c1c] border border-brand-border px-4 py-2 rounded-lg text-xs font-semibold text-white hover:bg-[#2e2e2e] transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KYC Warning Banner */}
      {!userProfile.isVerified && (
        <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-1 max-w-2xl">
            <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm uppercase tracking-wider">
              ⚠️ Biometric KYC Verification Required (Smile ID integration)
            </h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Your account is currently in <strong>Stage 1 (Unverified)</strong>. You can browse statistics and configure setup, but to establish local trust and protect consumers, listing active product stock is locked until biometric verification completes.
            </p>
          </div>
          <button 
            onClick={() => setIsKycModalOpen(true)}
            className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] flex-shrink-0"
          >
            Verify Biz with Smile ID
          </button>
        </div>
      )}

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Revenue" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={DollarSign} 
          trend={12} 
          color="text-brand-primary" 
        />
        <StatCard 
          title="Sales" 
          value={stats.totalSales} 
          icon={TrendingUp} 
          trend={8} 
          color="text-brand-primary" 
        />
        <StatCard 
          title="Products" 
          value={stats.totalProducts} 
          icon={Package} 
          color="text-brand-primary" 
        />
        <StatCard 
          title="Inventory Alerts" 
          value={stats.lowStock} 
          icon={AlertTriangle} 
          color={stats.lowStock > 0 ? "text-red-500" : "text-brand-primary"} 
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="GlassCard p-6 flex flex-col bg-[#1c1c1c]">
            <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="font-semibold text-lg text-white">Revenue Overview</h3>
              <div className="flex gap-2 items-center">
                <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Daily Sales</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2e2e2e" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1c1c', borderRadius: '8px', border: '1px solid #2e2e2e', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#3ecf8e' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3ecf8e" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="GlassCard p-6 bg-brand-primary/10 border-brand-primary/20 relative overflow-hidden group">
               <div className="relative z-10">
                 <h4 className="text-xl font-bold text-white mb-2">Digital Storefront</h4>
                 <p className="text-gray-400 text-sm font-medium mb-6">Let customers browse products and order via WhatsApp.</p>
                 <div className="flex flex-wrap gap-2">
                   <button 
                     onClick={shareStoreLink}
                     className="px-4 py-2 bg-brand-primary text-black rounded-md font-bold text-xs transition-all hover:brightness-110 active:scale-95"
                   >
                     Copy Link
                   </button>
                   <Link 
                     to={`/store/${auth.currentUser?.uid}`} 
                     target="_blank"
                     className="px-4 py-2 bg-[#2e2e2e] text-white rounded-md font-bold text-xs flex items-center gap-2 hover:bg-[#3e3e3e]"
                   >
                     <ExternalLink size={12} /> Preview
                   </Link>
                 </div>
               </div>
            </div>

            <div className="GlassCard p-6 flex flex-col justify-center gap-4 bg-[#1c1c1c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2e2e2e] rounded-lg flex items-center justify-center text-brand-primary">
                  <QrCode size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">BizNaija QR</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">In Development</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2e2e2e] rounded-lg flex items-center justify-center text-brand-primary">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Status Ads</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Upcoming</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights & Recent Activity */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="GlassCard p-6 bg-[#1c1c1c] border-brand-primary/20">
            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
              <span className="text-xl">💡</span> Insights
            </h3>
            <div className="space-y-4">
              {insights.length > 0 ? insights.map((insight, i) => (
                <div 
                  key={i}
                  className="text-xs text-gray-400 font-medium pb-3 border-b border-white/5 last:border-0"
                >
                  {insight}
                </div>
              )) : (
                <div className="text-gray-600 italic text-xs">Analyzing data...</div>
              )}
            </div>
          </div>

          <div className="GlassCard p-6 bg-[#1c1c1c]">
            <h3 className="font-bold text-sm mb-4 text-white uppercase tracking-widest">Recent Activity</h3>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2e2e2e] border border-brand-border flex items-center justify-center text-brand-primary font-bold text-xs">
                      {sale.productName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{sale.productName || 'Sale'}</p>
                      <p className="text-[10px] font-medium text-gray-600">
                        {new Date(sale.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-brand-primary">+{formatCurrency(sale.totalAmount)}</p>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && <p className="text-gray-600 text-[10px] italic py-2">No activity recorded yet.</p>}
              <Link to="/orders" className="block text-center text-[10px] font-bold uppercase tracking-widest text-brand-primary mt-4 hover:brightness-125">
                Full Activity Trail
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="GlassCard w-full max-w-md bg-[#1c1c1c] overflow-hidden border border-brand-border">
            <div className="flex justify-between items-center p-6 border-b border-brand-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={18} className="text-brand-primary" />
                Business Settings
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={userProfile.businessName}
                  onChange={(e) => setUserProfile({...userProfile, businessName: e.target.value})}
                  className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +2348012345678"
                  value={userProfile.phoneNumber}
                  onChange={(e) => setUserProfile({...userProfile, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                  title="Include country code (e.g., +234 for Nigeria)"
                />
                <p className="text-[10px] text-gray-600 mt-1 px-1">Used to receive instant order inquiries from public customers.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5 px-1">Business Type</label>
                <select
                  value={userProfile.businessType}
                  onChange={(e) => setUserProfile({...userProfile, businessType: e.target.value})}
                  className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md outline-none text-white text-sm font-medium"
                >
                  <option value="General">General Trade</option>
                  <option value="Fashion">Fashion & Textiles</option>
                  <option value="Food & Drinks">Food & Restaurants</option>
                  <option value="Arts & Crafts">Arts & Handmade Crafts</option>
                  <option value="Cosmetics">Cosmetics & Beauty</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2e2e2e]">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2 bg-transparent text-gray-400 hover:text-white border border-brand-border hover:bg-[#252525] rounded-md font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex-1 py-2 bg-brand-primary text-black rounded-md font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smile ID Verification Modal */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="GlassCard w-full max-w-md bg-[#1c1c1c] overflow-hidden border border-brand-border">
            <div className="flex justify-between items-center p-6 border-b border-brand-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-brand-primary" />
                Smile ID KYC Onboarding
              </h3>
              <button 
                onClick={() => setIsKycModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
                disabled={isVerifying}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSimulateKYC} className="p-6 space-y-4">
              <div className="bg-[#111111] border border-brand-border/50 p-4 rounded-lg text-xs leading-relaxed text-gray-400 space-y-2">
                <span className="font-bold text-[#ededed] block">Smile ID Sandbox Environment</span>
                <p>This mimics a full secure biometric handshake. Smile ID matches user inputs with central government registry databases (BVN, NIN, or CAC), computes a confidence score, and returns an authenticated webhook payload to lock trusted identities.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Verification Document Type</label>
                <select
                  disabled={isVerifying}
                  value={kycForm.docType}
                  onChange={(e) => setKycForm({...kycForm, docType: e.target.value})}
                  className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md outline-none text-white text-sm font-medium"
                >
                  <option value="BVN">BVN (Bank Verification Number)</option>
                  <option value="NIN">NIN (National Identification Number)</option>
                  <option value="CAC">CAC (Corporate Affairs Commission ID)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Document Identity Number</label>
                <input
                  type="text"
                  required
                  disabled={isVerifying}
                  placeholder={kycForm.docType === 'CAC' ? 'e.g., RC1234567' : 'e.g., 22289401736'}
                  value={kycForm.docNumber}
                  onChange={(e) => setKycForm({...kycForm, docNumber: e.target.value})}
                  className="w-full px-3 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
                />
                <p className="text-[10px] text-gray-600 mt-1 px-1">Ensure it is at least 10 numbers long for biometric validation.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#2e2e2e]">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => setIsKycModalOpen(false)}
                  className="flex-1 py-2 bg-transparent text-gray-400 hover:text-white border border-brand-border hover:bg-[#252525] rounded-md font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex-1 py-2 bg-brand-primary text-black rounded-md font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {isVerifying ? "Verifying..." : "Verify Identity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
