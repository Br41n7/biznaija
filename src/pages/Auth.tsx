import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in successfully!');
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: businessName });
        toast.success('Welcome to BizNaija!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-brand-bg">
      {/* Branding Side */}
      <div className="hidden lg:flex bg-[#000000] relative items-center justify-center overflow-hidden border-r border-brand-border">
        <div className="absolute inset-0 SupabaseGrid opacity-20" />
        <div className="relative z-10 p-12 max-w-lg">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-brand-primary rounded-xl mb-8 flex items-center justify-center text-black text-4xl font-black shadow-[0_0_20px_rgba(62,207,142,0.3)]"
          >
            B
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-display font-medium text-white mb-6 tracking-tight"
          >
            BizNaija
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-xl leading-relaxed font-normal"
          >
            Empowering African SMEs with a clean, professional toolkit to manage inventory and sales.
          </motion.p>
          
          <div className="mt-12 space-y-6">
            {[
              { label: 'Clean. Fast. Professional.', value: 'The New Standard' },
              { label: 'Secure and Reliable', value: 'Built to Scale' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-1 h-12 bg-brand-primary" />
                <div>
                  <div className="text-white font-medium text-lg">{stat.value}</div>
                  <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md GlassCard p-8 sm:p-10"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-display font-semibold text-white mb-2 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-gray-500 font-medium">
              {isLogin ? 'Enter your details to sign in' : 'Start your journey with BizNaija today'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Business Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-white font-medium placeholder:text-gray-600"
                    placeholder="e.g. Iya Basira Store"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-white font-medium placeholder:text-gray-600"
                  placeholder="name@business.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-white font-medium placeholder:text-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-3 bg-brand-primary hover:brightness-110 text-black rounded-lg font-bold text-base transition-all transform active:scale-[0.98] disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(62,207,142,0.2)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-4 bg-[#1c1c1c] text-gray-500 font-bold uppercase tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 bg-[#111111] border border-brand-border hover:bg-[#1a1a1a] text-white rounded-lg font-semibold flex items-center justify-center gap-3 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#ea4335" d="M12 5.04c1.94 0 3.5.72 4.54 1.63L20.25 3C18.15 1.15 15.3 0 12 0 7.31 0 3.32 2.67 1.41 6.57l3.96 3.07C6.31 7.21 8.92 5.04 12 5.04z" />
              <path fill="#4285f4" d="M23.49 12.27c0-.82-.07-1.61-.19-2.37H12v4.48h6.44c-.28 1.48-1.11 2.74-2.37 3.58l3.69 2.87c2.16-1.99 3.41-4.92 3.41-8.56z" />
              <path fill="#fbbc05" d="M5.37 14.5c-.24-.72-.37-1.48-.37-2.5s.13-1.78.37-2.5l-3.96-3.07C.51 8.19 0 10.02 0 12s.51 3.81 1.41 5.57l3.96-3.07z" />
              <path fill="#34a853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.87c-1.09.73-2.48 1.17-3.96 1.17-3.04 0-5.61-2.05-6.53-4.81l-3.96 3.07C3.32 21.46 7.31 24 12 24z" />
            </svg>
            Google Account
          </button>

          <p className="mt-8 text-center text-gray-500 font-medium text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-brand-primary font-semibold hover:underline ml-1"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
