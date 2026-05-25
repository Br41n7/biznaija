import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  MessageSquare, 
  ShoppingCart, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Plus,
  Search,
  TrendingUp
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Pages (I'll implement these next)
import DashboardPage from './pages/Dashboard';
import InventoryPage from './pages/Inventory';
import StoreBuilderPage from './pages/StoreBuilder';
import OrdersPage from './pages/Orders';
import AuthPage from './pages/Auth';
import PublicStorePage from './pages/PublicStore';
import TransactionsPage from './pages/Transactions';

const Sidebar = ({ isOpen, toggle, user }: { isOpen: boolean; toggle: () => void; user: User | null }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Finances', path: '/finances', icon: TrendingUp },
    { name: 'Store Builder', path: '/store-builder', icon: Store },
  ];

  const fullStoreUrl = user ? `${window.location.origin}/store/${user.uid}` : '#';

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isMobile ? { x: isOpen ? 0 : -300 } : { x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed lg:static top-0 left-0 h-full w-64 bg-[#1c1c1c] text-white z-50 flex flex-col border-r border-brand-border"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-lg shadow-lg border border-white/10 text-black">B</div>
            <h1 className="text-xl font-bold tracking-tight text-[#ededed]">BizNaija</h1>
          </div>
          <button onClick={toggle} className="lg:hidden text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  isActive 
                    ? 'bg-[#2e2e2e] text-brand-primary font-semibold' 
                    : 'text-gray-400 hover:bg-[#2e2e2e] hover:text-white font-medium'
                }`}
                onClick={() => { if (window.innerWidth < 1024) toggle(); }}
              >
                <Icon size={18} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-brand-border">
          <div className="flex flex-col gap-2">
            {user && (
              <a
                href={fullStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 w-full text-xs font-semibold text-gray-400 hover:text-brand-primary transition-colors"
              >
                <Store size={14} />
                Public Store
              </a>
            )}
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-3 px-3 py-2 w-full text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

const MainLayout = ({ user, isSidebarOpen, setSidebarOpen }: { user: User; isSidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden text-[#ededed]">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setSidebarOpen(!isSidebarOpen)} user={user} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-brand-border bg-brand-bg flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-white tracking-tight">Bonjour, {user.displayName?.split(' ')[0] || 'Artisan'}!</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href={`${window.location.origin}/store/${user.uid}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] text-white rounded-md font-medium text-xs border border-brand-border hover:bg-[#2e2e2e] transition-all"
            >
              <Store size={14} className="text-brand-primary" />
              Public Store
            </a>
            <div className="hidden md:flex items-center bg-[#111111] px-3 py-1.5 rounded-md border border-brand-border focus-within:ring-1 focus-within:ring-brand-primary transition-all">
              <Search className="w-3.5 h-3.5 text-gray-500 mr-2" />
              <input type="text" placeholder="Search..." className="bg-transparent outline-none text-xs w-48 font-medium text-white placeholder:text-gray-600" />
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-black font-bold text-sm shadow-[0_0_10px_rgba(62,207,142,0.2)]">
              {user.displayName?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/finances" element={<TransactionsPage />} />
            <Route path="/store-builder" element={<StoreBuilderPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-[#1c1c1c]/80 border border-brand-border backdrop-blur-md rounded-2xl flex items-center justify-around p-3 z-40 shadow-2xl">
          {[
            { path: '/dashboard', icon: LayoutDashboard, name: 'Home' },
            { path: '/inventory', icon: Package, name: 'Stock' },
            { path: '/orders', icon: ShoppingCart, name: 'Sales' },
            { path: '/finances', icon: TrendingUp, name: 'Finance' },
            { path: '/store-builder', icon: Store, name: 'Build' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  isActive ? "text-brand-primary" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-brand-primary/10" : ""
                )}>
                  <Icon size={18} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Ensure user doc exists
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email,
            businessName: u.displayName || 'My Shop',
            businessType: 'General',
            languagePreference: 'English',
            createdAt: new Date().toISOString()
          });
        }
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-brand-primary font-black font-display animate-pulse text-lg tracking-tight uppercase">BizNaija Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/store/:userId" element={<PublicStorePage />} />
        <Route path="*" element={
          <AnimatePresence mode="wait">
            {!user ? (
              <AuthPage />
            ) : (
              <MainLayout user={user} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            )}
          </AnimatePresence>
        } />
      </Routes>
    </BrowserRouter>
  );
}
