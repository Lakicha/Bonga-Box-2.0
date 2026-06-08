import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Coins, ShieldCheck, Check, Sparkles, Megaphone, ArrowUpRight } from 'lucide-react';

export default function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [success, setSuccess] = useState(false);

  const amounts = [200, 500, 1000, 2500, 5000];

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? customAmount : (selectedAmount || 500);
    setSuccess(true);
    setTimeout(() => {
      alert(`Thank you for donating ${finalAmount} KES. Your gesture directly funds FGM rescue, shelter food supplies, and school protection clubs in Isiolo County.`);
    }, 450);
  };

  return (
    <div className="font-sans max-w-md mx-auto py-2 space-y-6 select-none">
      
      {/* Header Info */}
      <div className="px-1">
        <h1 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none mb-1">
          Support Our Mission
        </h1>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
          Fund Safe Houses & Anti-FGM Advocacy in Isiolo
        </p>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-150 rounded-3xl p-6 text-center flex flex-col items-center space-y-3 shadow-md">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white animate-bounce">
            <Check size={24} strokeWidth={3} />
          </div>
          <h2 className="font-display font-black text-emerald-800 text-base uppercase">Donation Accepted</h2>
          <p className="text-xs text-emerald-700 font-semibold leading-relaxed max-w-[280px]">
            Thank you for directly backing the rescue corridors and counselor network. Your contribution builds structural shelters preserving safe futures.
          </p>
          <button 
            onClick={() => { setSuccess(false); setCustomAmount(''); }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors"
          >
            Donate Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Main contribution settings card */}
          <form onSubmit={handleDonateSubmit} className="bg-white border border-slate-150 rounded-2.5xl p-5 shadow-sm space-y-4">
            
            {/* Amount picker grid */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block pl-0.5">
                Select Donation Sum (KES)
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {amounts.map((amount) => (
                  <button 
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount('');
                    }}
                    className={`p-3 rounded-xl font-bold text-xs transition-colors border text-center ${
                      selectedAmount === amount && !customAmount
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs' 
                        : 'bg-slate-50 text-slate-800 border-slate-201 hover:bg-slate-100/50'
                    }`}
                  >
                    KES {amount}
                  </button>
                ))}

                <div className="relative">
                  <input 
                    type="number"
                    placeholder="Custom"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className="w-full h-full p-2 bg-slate-50 border border-slate-201 hover:bg-slate-100/30 rounded-xl text-center text-xs font-bold font-sans focus:outline-none placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Impact indicator */}
            <div className="bg-indigo-50/45 border border-indigo-100 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0 mt-0.5">
                <Heart size={15} className="fill-[#4F46E5]" />
              </div>
              <div>
                <span className="text-[9.5px] text-purple-primary font-black uppercase tracking-wider block">Estimated Social Impact</span>
                <p className="text-[10.5px] text-slate-650 leading-snug mt-0.5 font-medium">
                  {customAmount || selectedAmount 
                    ? `Translates directly to sponsoring ${Math.max(1, Math.floor(Number(customAmount || selectedAmount) / 100))} nutrient meal plans for girls sheltering at Merti Rescue Haven.`
                    : 'Your selection directly covers emergency transportation for children in distress.'}
                </p>
              </div>
            </div>

            {/* Donate trigger button */}
            <button 
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#4F46E5] via-[#3F37C9] to-[#06B6D4] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Coins size={14} className="text-amber-300" /> Confirm Secure Donation
            </button>
          </form>

          {/* Sponsoring detail Cards */}
          <div className="space-y-3">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1 block">Active County Campaigns</span>
            
            <div className="space-y-2.5">
              <div className="bg-white border border-slate-150 p-4 rounded-xl flex items-start gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#4F46E5] flex items-center justify-center border border-purple-101 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-none mb-1">Merti Sanctuary expansion</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    Adding double-deck bunks and fresh rain-harvesting storage tanks to shelter up to 50 vulnerable girls.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 p-4 rounded-xl flex items-start gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-650 flex items-center justify-center border border-orange-101 shrink-0">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-none mb-1">Interactive Education Clubs</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    Distributing physical protective cards, USSD codes, and educational guidelines to Isiolo primary schools.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Trust guarantees badge */}
      <footer className="border border-slate-150 bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
        <ShieldCheck size={20} className="text-slate-500 shrink-0" />
        <p className="text-[8.5px] text-slate-450 leading-relaxed font-bold">
          All financial transfers are processed securely. County charity reports are periodically compiled by local community audit councils.
        </p>
      </footer>

    </div>
  );
}
