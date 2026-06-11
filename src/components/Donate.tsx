import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Coins, ShieldCheck, Check, Sparkles, Megaphone, ArrowUpRight, Loader2, Info, Receipt } from 'lucide-react';
import StripeCardForm from './StripeCardForm';

export default function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Custom states for Stripe embedded elements handling
  const [paymentType, setPaymentType] = useState<'embedded' | 'hosted'>('embedded');
  const [receiptDetails, setReceiptDetails] = useState<{
    chargeId: string;
    last4: string;
    cardBrand: string;
    amount: number;
    donationId?: string;
  } | null>(null);

  const amounts = [200, 500, 1000, 2500, 5000];

  useEffect(() => {
    // Parse success/demo redirection queries from Stripe Checkout redirections
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccess(true);
      if (params.get('demo') === 'true') {
        setIsDemo(true);
      }
      // Scrub query parameters from URL for a clean state experience
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const finalAmount = customAmount ? parseFloat(customAmount) : (selectedAmount || 500);
    
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      setErrorMessage('Please specify or select a valid contribution amount.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/donate/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          successUrl: `${window.location.origin}/donate?success=true`,
          cancelUrl: `${window.location.origin}/donate`,
        }),
      });

      if (!response.ok) {
        const errDetails = await response.json().catch(() => ({}));
        throw new Error(errDetails.error || 'Could not instantiate Stripe checkout service.');
      }

      const data = await response.json();
      if (data.url) {
        // Instantly route user safely to Stripe Hosted Checkout
        window.location.href = data.url;
      } else {
        throw new Error('Received an unresolvable payment url.');
      }
    } catch (err: any) {
      console.error('Donation routing error:', err);
      setErrorMessage(err.message || 'Payment engine encountered a handoff failure.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardSuccess = (details: {
    chargeId: string;
    last4: string;
    cardBrand: string;
    amount: number;
    donationId?: string;
  }) => {
    setReceiptDetails(details);
    setIsDemo(true);
    setSuccess(true);
  };

  const handleReset = () => {
    setSuccess(false);
    setCustomAmount('');
    setIsDemo(false);
    setReceiptDetails(null);
    setErrorMessage('');
  };

  const activeAmountDecimal = customAmount ? parseFloat(customAmount) : (selectedAmount || 500);

  return (
    <div className="font-sans max-w-md mx-auto py-2 space-y-6 select-none animate-fadeIn">
      
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
        <div className="bg-emerald-50 border border-emerald-150 rounded-3xl p-6 text-center flex flex-col items-center space-y-4 shadow-md">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white animate-bounce">
            <Check size={24} strokeWidth={3} />
          </div>
          <h2 className="font-display font-black text-emerald-800 text-sm uppercase tracking-wide">Donation Accepted</h2>
          
          {/* Printable visual receipt layout */}
          {receiptDetails && (
            <div className="w-full bg-white border border-slate-100 rounded-[20px] p-4 text-left space-y-2.5 shadow-xs text-xs">
              <div className="flex items-center gap-1.5 pb-1.5 border-b border-dashed border-slate-200">
                <Receipt size={14} className="text-[#4F46E5]" />
                <span className="font-extrabold text-[10px] uppercase text-slate-500 tracking-wider">Official Ledger Receipt</span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-1.5 text-slate-600 font-medium text-[11px]">
                <div>Donation sum:</div>
                <div className="font-bold text-right text-slate-900">KES {receiptDetails.amount}</div>

                <div>Payment Channel:</div>
                <div className="font-bold text-right text-slate-900 uppercase">Stripe Elements</div>

                <div>Card Brand:</div>
                <div className="font-bold text-right text-slate-900 flex items-center justify-end gap-1 capitalize">
                  <span>{receiptDetails.cardBrand}</span>
                  <span className="text-[10px] text-slate-400 font-bold">• {receiptDetails.last4}</span>
                </div>

                <div>Transaction:</div>
                <div className="font-mono text-[9px] text-right text-[#4F46E5] truncate font-bold select-all" title={receiptDetails.chargeId}>
                  {receiptDetails.chargeId}
                </div>

                {receiptDetails.donationId && (
                  <>
                    <div>Ledger ID:</div>
                    <div className="font-mono text-[9px] text-right text-slate-500 truncate select-all">
                      {receiptDetails.donationId}
                    </div>
                  </>
                )}

                <div>Status:</div>
                <div className="font-bold text-right text-emerald-600 uppercase text-[9px] tracking-wide">Cleared/Success</div>
              </div>

              <p className="text-[9.5px] text-slate-400 font-semibold text-center italic border-t border-slate-100 pt-1.5">
                No credit credentials persist on database registers. This reference has been tokenized securely.
              </p>
            </div>
          )}

          {isDemo && !receiptDetails && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-2 text-left w-full">
              <Info size={15} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block">Simulated Handoff Active</span>
                <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                  Your server is operating in developer sandbox mode (STRIPE_SECRET_KEY is empty). This payment simulation succeeded safely!
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-emerald-700 font-semibold leading-relaxed max-w-[280px]">
            Thank you for directly backing the rescue corridors and counselor network. Your contribution builds structural shelters preserving safe futures.
          </p>
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors"
          >
            Donate Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Main contribution settings card */}
          <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm space-y-4">
            
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-800 font-semibold animate-fadeIn">
                <Info size={14} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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

            {/* Choice: Handshake Method Tabs */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest pl-0.5 block">
                Stripe Gateway Handshake
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentType('embedded')}
                  className={`py-2 text-[9px] font-extrabold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1 ${
                    paymentType === 'embedded'
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100/20'
                  }`}
                >
                  💳 In-App Elements
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('hosted')}
                  className={`py-2 text-[9px] font-extrabold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1 ${
                    paymentType === 'hosted'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100/20'
                  }`}
                >
                  🚀 Hosted Checkout
                </button>
              </div>
            </div>

            {/* Tab forms dynamic selection */}
            {paymentType === 'embedded' ? (
              <StripeCardForm
                amount={activeAmountDecimal}
                onSuccess={handleCardSuccess}
                isProcessingParent={isProcessing}
                setIsProcessingParent={setIsProcessing}
              />
            ) : (
              <form onSubmit={handleDonateSubmit}>
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-[#4F46E5] via-[#3F37C9] to-[#06B6D4] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-white" />
                      Routing to Stripe Checkout...
                    </>
                  ) : (
                    <>
                      <Coins size={13} className="text-amber-300 animate-pulse" /> Confirm Stripe Session Redirect
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Sponsoring detail Cards */}
          <div className="space-y-3">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1 block">Active County Campaigns</span>
            
            <div className="space-y-2.5">
              <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center border border-indigo-100 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 leading-none mb-1">Merti Sanctuary expansion</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                    Adding double-deck bunks and fresh rain-harvesting storage tanks to shelter up to 50 vulnerable girls.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center border border-indigo-100 shrink-0">
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
      <footer className="border border-slate-100 bg-slate-50 rounded-[20px] p-4 flex items-center gap-3 shadow-xs">
        <ShieldCheck size={20} className="text-slate-500 shrink-0" />
        <p className="text-[8.5px] text-slate-450 leading-relaxed font-bold">
          All financial transfers are processed securely. County charity reports are periodically compiled by local community audit councils.
        </p>
      </footer>

    </div>
  );
}
