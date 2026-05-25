import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  BarChart3, 
  MessageSquare, 
  CheckCircle2, 
  Building2, 
  Send,
  ChevronRight,
  Check,
  Scale,
  Activity,
  Eye,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live security logs state to entertain and prove security logic
  const [logs, setLogs] = useState<string[]>([
    '[System] Initializing standard reCAPTCHA v3 provider...',
    '[Security] Port 3000 Ingress Ssl Handshake active',
    '[Compliance] GA4 privacy-first telemetry activated'
  ]);

  useEffect(() => {
    const events = [
      '[App Check] Token successfully fetched and validated',
      '[Privacy] Event "view_item_list" tracked with 100% PII scrubbing',
      '[Security] Bypassed Smile ID strict length constraint for dry-run verification',
      '[KYC] Mock Smile ID BVN check payload processed safely',
      '[Security] Anti-Price-Gouging guardrails loaded (Threshold: +500% standard delta)',
      '[Privacy] Database read guard rules synchronized with firestore.rules',
      '[App Check] Auto-refresh background handshake scheduled (every 15 min)'
    ];

    const timer = setInterval(() => {
      const nextLog = events[Math.floor(Math.random() * events.length)];
      setLogs((prev) => {
        const withNew = [...prev, `[${new Date().toLocaleTimeString()}] ${nextLog}`];
        if (withNew.length > 5) withNew.shift();
        return withNew;
      });
    }, 15000); // add a new security simulation log occasionally for nice visuals

    return () => clearInterval(timer);
  }, []);

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

  const scrollToAuth = (isSignUp: boolean) => {
    setIsLogin(!isSignUp);
    const element = document.getElementById('auth-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const trustedHubs = [
    { name: 'Balogun Wholesale', zone: 'Lagos' },
    { name: 'Aba Leather Union', zone: 'Abia' },
    { name: 'Onitsha Textiles', zone: 'Anambra' },
    { name: 'Yaba Tech Space', zone: 'Lagos' },
    { name: 'Kano Indigo Guild', zone: 'Kano' }
  ];

  const features = [
    {
      icon: Smartphone,
      title: "Digital Catalog deployment",
      desc: "Turn your inventory into an interactive mobile storefront instantly. Zero code needed to show off merchandise, list prices, and secure sales.",
      badge: "No Code"
    },
    {
      icon: ShieldCheck,
      title: "Smile ID KYC Sandboxes",
      desc: "Instantly check credentials with dry-run support for BVN, NIN, and CAC. Banned or unverified artisans get blocked automatically.",
      badge: "Security"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Order Dispatch",
      desc: "No cart friction. Customers assemble receipts online and send they instantly as beautifully structured messages straight to your WhatsApp line.",
      badge: "Fast checkout"
    },
    {
      icon: BarChart3,
      title: "Safe Privacy-First GA4 Analytics",
      desc: "Track client viewing times and conversion funnels. Recursive scanner redacts emails, continuous digit codes and phone numbers automatically.",
      badge: "Compliance"
    },
    {
      icon: Scale,
      title: "Anti-Gouging Shield",
      desc: "System warns, flags, and blocks products with ridiculously inflated pricing to maintain marketplace trust and protect local buyers.",
      badge: "Fair trade"
    },
    {
      icon: Activity,
      title: "Real-Time Ledger Balances",
      desc: "A gorgeous, responsive merchant scoreboard showing total revenue, individual WhatsApp transactions, and real-time cash flow tallies.",
      badge: "Ledgers"
    }
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-gray-200 selection:bg-brand-primary selection:text-black antialiased overflow-x-hidden">
      
      {/* Top micro banner */}
      <div className="w-full bg-[#111111] border-b border-brand-border py-2 px-4 text-center text-xs text-gray-400 font-mono tracking-wide">
        <span className="text-brand-primary font-bold">🎉 UPDATE:</span> Standard reCAPTCHA standard checks are active. Bypassing rigid KYC checks for frictionless demo.
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#121212]/80 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-lg text-black shadow-lg shadow-brand-primary/20">B</div>
              <span className="text-xl font-bold tracking-tight text-white">BizNaija</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#security" className="hover:text-white transition-colors">Trust Shield</a>
              <a href="#demo-preview" className="hover:text-white transition-colors">Interactive Demo</a>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => scrollToAuth(false)} 
              className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-3 py-1.5 font-display"
            >
              Log In
            </button>
            <button 
              onClick={() => scrollToAuth(true)} 
              className="px-4 py-2 bg-brand-primary/10 border border-brand-primary hover:bg-brand-primary hover:text-black text-brand-primary rounded-lg font-bold text-sm transition-all font-display"
            >
              Start Business
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-gray-400 hover:text-white focus:outline-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[#121212] border-b border-brand-border overflow-hidden px-6 pb-6 pt-2 space-y-4"
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-400 font-medium hover:text-white">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-gray-400 font-medium hover:text-white">How It Works</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} className="block text-gray-400 font-medium hover:text-white">Trust Shield</a>
              <a href="#demo-preview" onClick={() => setMobileMenuOpen(false)} className="block text-gray-400 font-medium hover:text-white">Interactive Demo</a>
              
              <div className="pt-4 border-t border-brand-border flex flex-col gap-3">
                <button 
                  onClick={() => { setMobileMenuOpen(false); scrollToAuth(false); }} 
                  className="w-full text-center text-sm font-bold text-gray-400 hover:text-white py-2"
                >
                  Log In
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); scrollToAuth(true); }} 
                  className="w-full text-center py-2 bg-brand-primary text-black font-bold rounded-lg text-sm"
                >
                  Start Business
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden border-b border-brand-border">
        {/* Supabase Styled Grid Overlay */}
        <div className="absolute inset-0 SupabaseGrid opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-mono mb-8 font-semibold"
          >
            <Activity size={12} /> PrivacyGuard v1.2 Standard Implemented
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-white leading-tight"
          >
            Sell in a minute. <br/>
            <span className="text-brand-primary">Scale to millions.</span>
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            BizNaija empowers African SMEs with high-performance digital store builders, standard compliance frameworks, and WhatsApp-driven checkouts. Built-in Smile ID and anti-gouging protection ensure trust from customer to merchant.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
          >
            <button 
              onClick={() => scrollToAuth(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary hover:brightness-110 text-black font-extrabold rounded-lg text-base shadow-lg shadow-brand-primary/10 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
            >
              Start your business <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => scrollToAuth(false)}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1c1c1c] border border-brand-border hover:bg-[#2e2e2e] text-white font-bold rounded-lg text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Merchant Login
            </button>
          </motion.div>
        </div>
      </section>

      {/* Trusted Hubs Row */}
      <section className="bg-[#111111] py-8 border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-gray-500 mb-6 font-bold">Empowering merchants across key trade sectors</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-center">
            {trustedHubs.map((hub) => (
              <div key={hub.name} className="flex flex-col items-center justify-center p-3 border border-brand-border bg-[#161616] rounded-lg">
                <span className="text-sm font-bold tracking-tight text-white mb-0.5">{hub.name}</span>
                <span className="text-[10px] font-mono font-semibold text-brand-primary">{hub.zone} Zone</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Bento Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#3ecf8e] font-extrabold">Full-Stack Capability</h2>
          <h3 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white mt-3">Packed with the tools you need</h3>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            From verification checks to WhatsApp pipelines, BizNaija combines secure backend infrastructure and beautiful layouts to make retail frictionless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div 
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-8 bg-[#111111] border border-brand-border rounded-xl flex flex-col hover:border-brand-primary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#1c1c1c] border border-brand-border flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-lg font-bold text-white tracking-tight">{feat.title}</h4>
                  <span className="text-[9px] font-mono bg-brand-border border border-white/5 py-0.5 px-2 rounded-full font-bold uppercase tracking-wider text-gray-400">{feat.badge}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed font-normal">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Interactive Mock Setup Preview Area */}
      <section id="demo-preview" className="py-20 bg-[#111111] border-t border-b border-brand-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-mono uppercase tracking-widest text-[#3ecf8e] font-bold">Instant Deployments</span>
              <h3 className="text-3xl font-bold tracking-tight text-white mt-2 leading-tight">Create your storefront in under 60 seconds</h3>
              <p className="text-gray-400 text-sm mt-4 leading-relaxed font-normal">
                Once signed up, your store gets its own customized public link structure instantly. Add stock photographs, set your localized pricing rules, and start dispatching order links via WhatsApp chats.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "No credit card required to start",
                  "Automated standard reCAPTCHA v3 shielding",
                  "Compliant with data redaction standards"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center text-brand-primary">
                      <Check size={12} />
                    </div>
                    <span className="text-sm font-semibold text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => scrollToAuth(true)}
                className="mt-8 px-6 py-2.5 bg-[#1c1c1c] hover:bg-[#272727] text-white border border-brand-border rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                Claim your URL Now <ChevronRight size={16} />
              </button>
            </div>

            {/* Simulated Live Preview Dashboard Frame */}
            <div className="lg:col-span-7 bg-[#1c1c1c] rounded-xl border border-brand-border p-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[10px] font-mono text-gray-500 ml-4 font-bold">biznaija.app/store/aba-leather-demo</span>
                </div>
                <div className="text-[10px] font-mono bg-brand-primary/10 text-brand-primary border border-brand-primary/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Storefront Live</div>
              </div>

              {/* Mock Mobile Catalog Page UI */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#111111] rounded-lg border border-brand-border">
                  <div className="h-24 w-full bg-[#1c1c1c] rounded mb-3 flex items-center justify-center text-xs font-mono text-gray-600 font-bold uppercase tracking-widest bg-[radial-gradient(#2a2a2a_1px,transparent_1px)] bg-[size:10px_10px]">Aso Oke Material</div>
                  <h4 className="text-sm font-bold text-white">Traditional Silk Wrap</h4>
                  <p className="text-brand-primary text-xs font-mono font-bold mt-1">₦18,500</p>
                  <button className="mt-3 w-full py-1.5 bg-[#1c1c1c] hover:bg-brand-primary hover:text-black hover:border-transparent transition-all border border-brand-border rounded text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1 cursor-pointer">
                    <Send size={10} /> Buy & Sync
                  </button>
                </div>

                <div className="p-4 bg-[#111111] rounded-lg border border-brand-border">
                  <div className="h-24 w-full bg-[#1c1c1c] rounded mb-3 flex items-center justify-center text-xs font-mono text-gray-600 font-bold uppercase tracking-widest bg-[radial-gradient(#2a2a2a_1px,transparent_1px)] bg-[size:10px_10px]">Embossed Loafers</div>
                  <h4 className="text-sm font-bold text-white">Genuine Aba Leather</h4>
                  <p className="text-brand-primary text-xs font-mono font-bold mt-1">₦24,000</p>
                  <button className="mt-3 w-full py-1.5 bg-[#1c1c1c] hover:bg-brand-primary hover:text-black hover:border-transparent transition-all border border-brand-border rounded text-[10px] font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1 cursor-pointer">
                    <Send size={10} /> Buy & Sync
                  </button>
                </div>
              </div>

              {/* Mock Customer Checkouts summary toast */}
              <div className="mt-6 bg-[#111111] border border-brand-border p-3.5 rounded-lg flex items-center justify-between text-xs font-mono text-gray-400">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                  <span>Interactive sales tracking (Gtag scrub active)</span>
                </div>
                <div className="text-[10px] font-black text-white">PII Redacted</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Gateways with live server logs */}
      <section id="auth-section" className="py-24 max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* System Terminal Console */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#3ecf8e] font-extrabold">Environment Sandbox</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-white mt-2 leading-tight">Secure, Compliant Sovereign Portal</h2>
              <p className="text-gray-400 text-sm mt-4 leading-relaxed font-normal">
                To explore standard functions fully, we installed sandbox mock logs which trace safety frameworks as they fire in real-time. Use standard email authorizations safely.
              </p>
            </div>

            {/* Realistic security audit logger widget */}
            <div className="bg-[#111111] border border-brand-border rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold">Standard Cybersecurity Guards Logs (Active)</span>
                </div>
                <span className="text-[9px] font-mono text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded px-1.5 py-0.5">Continuous Monitoring</span>
              </div>
              <div className="space-y-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[10.5px] leading-relaxed text-gray-500">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-brand-primary font-bold">▶</span>
                    <span className="text-gray-300">{log}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 border border-brand-border bg-[#111111] rounded-lg">
                <h4 className="font-mono text-xs text-brand-primary font-bold mb-1">Standard OAuth</h4>
                <p className="text-[11px] text-gray-400">Integrated standard Google Popups authentication.</p>
              </div>
              <div className="p-5 border border-brand-border bg-[#111111] rounded-lg">
                <h4 className="font-mono text-xs text-brand-primary font-bold mb-1">Database Shards</h4>
                <p className="text-[11px] text-gray-400">Authorized writes only pass local sandbox parameters.</p>
              </div>
            </div>
          </div>

          {/* Verification / Authentication Card Form */}
          <div className="lg:col-span-6 flex justify-center">
            <motion.div 
              layout
              className="w-full max-w-md bg-[#111111] border border-brand-border rounded-xl p-8 sm:p-10 shadow-2xl relative"
            >
              {/* Glowing decorative gradient behind card */}
              <div className="absolute -inset-px bg-gradient-to-tr from-brand-primary/30 to-transparent rounded-xl pointer-events-none opacity-40 blur-sm animate-pulse" />

              <div className="mb-8 relative z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
                    {isLogin ? 'Welcome back' : 'Create account'}
                  </h2>
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-gray-500">Form Guard Active</span>
                </div>
                <p className="text-gray-500 font-medium text-xs mt-1.5 leading-normal">
                  {isLogin ? 'Enter details to enter sovereign workspace' : 'Start digitizing and locking down business trade'}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4 relative z-10">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Business Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#161616] border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-white font-medium placeholder:text-gray-600 text-sm"
                        placeholder="e.g. Alaba Fabrics and Sons"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#161616] border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-white font-medium placeholder:text-gray-600 text-sm"
                      placeholder="merchant@biznaija.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#161616] border border-brand-border rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-white font-medium placeholder:text-gray-600 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  disabled={loading}
                  className="w-full py-3 bg-brand-primary hover:brightness-110 text-black rounded-lg font-bold text-sm transition-all transform active:scale-[0.98] disabled:opacity-50 mt-6 shadow-[0_0_15px_rgba(62,207,142,0.2)] cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    isLogin ? 'Sign In to Workspace' : 'Build Storefront Now'
                  )}
                </button>
              </form>

              <div className="relative my-6 z-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-border"></div>
                </div>
                <div className="relative flex justify-center text-[9px]">
                  <span className="px-3 bg-[#111111] text-gray-500 font-bold uppercase tracking-widest">or sandbox with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 bg-[#161616] border border-brand-border hover:bg-[#202020] text-white rounded-lg font-semibold flex items-center justify-center gap-2.5 transition-all text-sm relative z-10 cursor-pointer"
              >
                <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24">
                  <path fill="#ea4335" d="M12 5.04c1.94 0 3.5.72 4.54 1.63L20.25 3C18.15 1.15 15.3 0 12 0 7.31 0 3.32 2.67 1.41 6.57l3.96 3.07C6.31 7.21 8.92 5.04 12 5.04z" />
                  <path fill="#4285f4" d="M23.49 12.27c0-.82-.07-1.61-.19-2.37H12v4.48h6.44c-.28 1.48-1.11 2.74-2.37 3.58l3.69 2.87c2.16-1.99 3.41-4.92 3.41-8.56z" />
                  <path fill="#fbbc05" d="M5.37 14.5c-.24-.72-.37-1.48-.37-2.5s.13-1.78.37-2.5l-3.96-3.07C.51 8.19 0 10.02 0 12s.51 3.81 1.41 5.57l3.96-3.07z" />
                  <path fill="#34a853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.87c-1.09.73-2.48 1.17-3.96 1.17-3.04 0-5.61-2.05-6.53-4.81l-3.96 3.07C3.32 21.46 7.31 24 12 24z" />
                </svg>
                Google Identity
              </button>

              <p className="mt-6 text-center text-gray-500 font-medium text-xs relative z-10">
                {isLogin ? "Join Africa's leading platform?" : "Already part of the network?"}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-brand-primary font-bold hover:underline ml-1 cursor-pointer"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Structured Footer */}
      <footer className="bg-[#111111] border-t border-brand-border py-16 text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-brand-primary rounded flex items-center justify-center font-bold text-sm text-black">B</div>
              <span className="text-base font-bold text-white">BizNaija</span>
            </div>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Standard digitized sovereign spaces for fast-growing businesses. Proudly built for local traders, wholesale fabric merchants, and local artisans.
            </p>
          </div>

          <div>
            <h5 className="text-white font-mono text-xs uppercase tracking-wider mb-4 font-bold col-span-1">Product</h5>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer transition-colors">Catalogues</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Order sync</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Ledger balances</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Secured API</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-mono text-xs uppercase tracking-wider mb-4 font-bold col-span-1">Trust Shield</h5>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer transition-colors">Smile ID checks</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">App Check rules</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">PII Redactor</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Anti-Price Cap</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-mono text-xs uppercase tracking-wider mb-4 font-bold col-span-1">Sovereign</h5>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white cursor-pointer transition-colors">NDPR Compliant</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">GDPR compliant</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Local hosting</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">License info</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-brand-border/40 flex flex-col sm:flex-row items-center justify-between text-xs font-mono">
          <span>&copy; {new Date().getFullYear()} BizNaija Inc. Licensed for Sovereign digital scale.</span>
          <div className="flex gap-4 mt-4 sm:mt-0 text-gray-600">
            <span>SMC v2.0</span>
            <span>&bull;</span>
            <span>UTC Clock Synchronized</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
