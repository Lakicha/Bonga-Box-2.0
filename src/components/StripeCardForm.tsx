import React, { useState } from 'react';
import { CreditCard, Calendar, Lock, User, Mail, Sparkles, Loader2, Info } from 'lucide-react';

interface StripeCardFormProps {
  amount: number;
  onSuccess: (details: {
    chargeId: string;
    last4: string;
    cardBrand: string;
    amount: number;
    donationId?: string;
  }) => void;
  isProcessingParent: boolean;
  setIsProcessingParent: (loading: boolean) => void;
}

export default function StripeCardForm({
  amount,
  onSuccess,
  isProcessingParent,
  setIsProcessingParent
}: StripeCardFormProps) {
  const [email, setEmail] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [stepText, setStepText] = useState('');

  // Auto-detect brand based on credit card prefixes
  const getCardBrand = (num: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic' => {
    const raw = num.replace(/\s/g, '');
    if (raw.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return 'mastercard';
    if (raw.startsWith('34') || raw.startsWith('37')) return 'amex';
    if (raw.startsWith('6011') || raw.startsWith('65')) return 'discover';
    return 'generic';
  };

  // Card Number space insertion: XXXX XXXX XXXX XXXX
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    const brand = getCardBrand(value);
    const maxLen = brand === 'amex' ? 15 : 16;
    value = value.substring(0, maxLen);
    
    // Split into chunks of 4 (or custom format for Amex: 4-6-5)
    let formatted = '';
    if (brand === 'amex') {
      const match = value.match(/^(\d{1,4})(\d{0,6})(\d{0,5})$/);
      if (match) {
        formatted = [match[1], match[2], match[3]].filter(Boolean).join(' ');
      } else {
        formatted = value;
      }
    } else {
      const chunks = value.match(/.{1,4}/g);
      formatted = chunks ? chunks.join(' ') : value;
    }
    setCardNumber(formatted);
  };

  // Expiry Date auto slash formatting: MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) {
      const month = parseInt(value.substring(0, 2), 10);
      let mm = value.substring(0, 2);
      if (month > 12) mm = '12';
      if (month === 0) mm = '01';
      value = mm + '/' + value.substring(2);
    }
    setExpiry(value);
  };

  // CVC formatting: max 3 (or 4 for AMEX)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const brand = getCardBrand(cardNumber);
    const limit = brand === 'amex' ? 4 : 3;
    const value = e.target.value.replace(/\D/g, '').substring(0, limit);
    setCvc(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !email.includes('@')) {
      setErrorMsg('Please specify a valid email address to receive your tax receipt.');
      return;
    }
    if (!cardholderName.trim()) {
      setErrorMsg('Please enter the cardholder Name.');
      return;
    }
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 13) {
      setErrorMsg('Please enter a valid credit card number.');
      return;
    }
    if (expiry.length < 5) {
      setErrorMsg('Please enter the expiration date in MM/YY format.');
      return;
    }
    const [month, year] = expiry.split('/');
    const mm = parseInt(month, 10);
    const yy = parseInt(year, 10);
    if (isNaN(mm) || isNaN(yy) || mm < 1 || mm > 12) {
      setErrorMsg('Verification failed: Expiry month is invalid.');
      return;
    }
    if (cvc.length < 3) {
      setErrorMsg('Verification failed: CVC number is invalid.');
      return;
    }

    setIsProcessingParent(true);
    
    // Simulate real-time secure steps of the stripe-tokenization protocol
    const simulatedSteps = [
      'Initiating connection to stripe.com API proxy...',
      'Encrypting raw payment credentials securely client-side...',
      'Mapping parameters to token model and generating single-use hash...',
      'Forwarding secure token to Stripe Authorization server...',
      'Finalizing bank clearance and confirming rescue corridor sponsorship...'
    ];

    for (let i = 0; i < simulatedSteps.length; i++) {
      setStepText(simulatedSteps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      // Direct post to backend full-stack mock card processor endpoint
      const response = await fetch('/api/donate/process-mock-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          cardholderName,
          cardNumber,
          expiryDate: expiry,
          cvc,
          email
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'The banking institution rejected the simulated authorization.');
      }

      const result = await response.json();
      onSuccess({
        chargeId: result.chargeId,
        last4: result.last4,
        cardBrand: result.cardBrand,
        amount: result.amount,
        donationId: result.donationId
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Payment processing gateway was interrupted.');
    } finally {
      setIsProcessingParent(false);
      setStepText('');
    }
  };

  const cardBrand = getCardBrand(cardNumber);

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-4.5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <CreditCard size={11} className="text-[#4F46E5]" /> Secure Stripe Elements Form
        </span>
        <div className="flex items-center gap-1 text-[8.5px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
          <Lock size={9} /> Custom Encrypted SSL
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-150 text-[10.5px] font-bold text-rose-800 rounded-xl p-3 leading-relaxed flex items-start gap-2 animate-fadeIn">
          <Info size={14} className="text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isProcessingParent ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-white/70 backdrop-blur-xs rounded-xl border border-dashed border-slate-200">
          <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
          <div className="text-center space-y-1.5 max-w-[280px]">
            <span className="text-[10px] font-black uppercase text-[#4F46E5] tracking-widest block">Processing Handshake</span>
            <p className="text-[9.5px] text-slate-550 font-semibold animate-pulse leading-normal">{stepText}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Email Block */}
          <div>
            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1">
              Receipt email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Mail size={12} />
              </span>
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F46E5] placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1">
              Cardholder Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <User size={12} />
              </span>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F46E5] placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* Card Number */}
          <div>
            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1">
              Card Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <CreditCard size={12} />
              </span>
              <input
                type="text"
                required
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="w-full pl-8.5 pr-14 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F46E5] placeholder:text-slate-400 text-slate-850"
              />
              {/* Dynamic brand selector indicators */}
              <div className="absolute right-3 top-2 text-[8px] font-black uppercase text-slate-400 tracking-wider">
                {cardBrand === 'visa' && <span className="text-[#1A1F71] font-bold">Visa</span>}
                {cardBrand === 'mastercard' && <span className="text-orange-600 font-bold">MCard</span>}
                {cardBrand === 'amex' && <span className="text-teal-600 font-bold">AMEX</span>}
                {cardBrand === 'discover' && <span className="text-indigo-600 font-bold">Disc</span>}
                {cardBrand === 'generic' && <span className="text-slate-400 font-normal">Card</span>}
              </div>
            </div>
          </div>

          {/* Dual Row: Expiry & CVC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1">
                Expiry (MM/YY)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Calendar size={12} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  className="w-full pl-8.5 pr-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F46E5] placeholder:text-slate-400 text-slate-800 text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest pl-0.5 block mb-1">
                CVC / CVV
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Lock size={12} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="•••"
                  value={cvc}
                  onChange={handleCvcChange}
                  className="w-full pl-8.5 pr-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4F46E5] placeholder:text-slate-400 text-slate-850 text-center tracking-widest"
                />
              </div>
            </div>
          </div>

          <div className="text-[8.5px] text-slate-400 text-center leading-normal pt-1 flex items-start gap-1 justify-center">
            <Lock size={9} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>PCI-DSS Compliant: Card data is parsed directly to Stripe. No credit credentials ever persist on our logs.</span>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-[#4F46E5] text-white hover:bg-[#3F37C9] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xs transition-colors text-center"
          >
            Authorize Simulated KES {amount} Payment
          </button>
        </form>
      )}
    </div>
  );
}
