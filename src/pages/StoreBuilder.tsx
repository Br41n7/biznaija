import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { Store, Wand2, Instagram, MessageCircle, Copy, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function StoreBuilder() {
  const [productInfo, setProductInfo] = useState({
    productName: '',
    productCategory: 'General',
    description: '',
    image: '',
    mimeType: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for AI analysis
        toast.error('Image too large (Max 1MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setProductInfo({
          ...productInfo,
          image: base64,
          mimeType: file.type
        });
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!productInfo.productName) {
      toast.error('Product name required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productInfo)
      });
      const data = await res.json();
      setAiResult(data);
      toast.success('Market insights ready');
    } catch (error) {
      toast.error('Service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.info(`Copied ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">AI Product Optimizer</h2>
        <p className="text-gray-500 font-medium text-sm">Fine-tune listings and market strategy with BizNaija AI.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Side */}
        <div className="GlassCard p-8 bg-[#1c1c1c] space-y-6">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Product Name</label>
              <input
                type="text"
                value={productInfo.productName}
                onChange={(e) => setProductInfo({...productInfo, productName: e.target.value})}
                placeholder="Product name..."
                className="w-full px-4 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none text-white text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Category</label>
              <select
                value={productInfo.productCategory}
                onChange={(e) => setProductInfo({...productInfo, productCategory: e.target.value})}
                className="w-full px-4 py-2 bg-[#111111] border border-brand-border rounded-md outline-none text-white text-sm font-medium"
              >
                <option>General</option>
                <option>Fashion</option>
                <option>Food & Drinks</option>
                <option>Arts & Crafts</option>
                <option>Cosmetics</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Product Photo (Optional AI Input)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#111111] border border-brand-border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={24} className="text-gray-800" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="aiImageInput"
                  />
                  <label 
                    htmlFor="aiImageInput"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-brand-border text-gray-400 text-[10px] font-bold rounded-md hover:text-white transition-all uppercase tracking-widest"
                  >
                    {imagePreview ? 'Change Image' : 'Add Image for AI'}
                  </label>
                  <p className="text-[9px] text-gray-600 mt-1">Gemini will analyze the photo to write better copy.</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Concept</label>
              <textarea
                value={productInfo.description}
                onChange={(e) => setProductInfo({...productInfo, description: e.target.value})}
                placeholder="Briefly describe your product details..."
                className="w-full px-4 py-2 bg-[#111111] border border-brand-border rounded-md focus:ring-1 focus:ring-brand-primary outline-none h-32 text-white text-sm font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-brand-primary text-black rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Wand2 size={18} />
                Optimize with AI
              </>
            )}
          </button>
        </div>

        {/* Results Side */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!aiResult ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="empty"
                className="h-full border border-dashed border-[#2e2e2e] rounded-xl flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-16 h-16 bg-[#1c1c1c] rounded-xl flex items-center justify-center text-gray-700 mb-4 border border-[#2e2e2e]">
                  <Store size={32} />
                </div>
                <h4 className="font-bold text-gray-500 text-lg">AI Ready</h4>
                <p className="text-gray-600 text-xs font-medium mt-1">Provide product info to generate marketing copy and pricing insights.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="GlassCard p-8 bg-[#1c1c1c] border-brand-primary/20 space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-brand-border">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">AI Optimized Content</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Optimized Name</label>
                    <div className="flex justify-between items-start gap-2">
                       <h3 className="text-xl font-bold text-white tracking-tight">{aiResult.suggestedName}</h3>
                       <button onClick={() => copyToClipboard(aiResult.suggestedName, 'name')} className="text-gray-600 hover:text-brand-primary transition-colors">
                         {copiedField === 'name' ? <Check size={16} className="text-brand-primary" /> : <Copy size={16} />}
                       </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Marketing Copy</label>
                    <div className="bg-[#111111] p-4 rounded-md relative group border border-brand-border">
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">{aiResult.description}</p>
                      <button 
                        onClick={() => copyToClipboard(aiResult.description, 'description')}
                        className="absolute top-2 right-2 p-1 text-gray-700 hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedField === 'description' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Market Price</label>
                      <p className="text-lg font-bold text-brand-primary">₦{aiResult.suggestedPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Keywords</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {aiResult.hashtags.map((h: string) => (
                          <span key={h} className="text-[8px] bg-brand-primary/5 text-brand-primary/80 px-2 py-0.5 rounded-md font-bold border border-brand-primary/10">{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-brand-border">
                     <div className="flex items-center gap-2 mb-3">
                       <MessageCircle className="text-brand-primary" size={16} />
                       <span className="text-[10px] font-bold uppercase text-white">Social Marketing Caption</span>
                     </div>
                     <div className="bg-[#111111] p-4 rounded-md relative group border border-brand-border">
                       <p className="text-xs text-gray-400 italic">"{aiResult.whatsappCaption}"</p>
                       <button 
                        onClick={() => copyToClipboard(aiResult.whatsappCaption, 'caption')}
                        className="absolute top-2 right-2 p-1 text-gray-700 hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedField === 'caption' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
