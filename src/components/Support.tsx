import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MessageSquare, ShieldCheck, HeartHandshake, ArrowRight, Check, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface CounselorMessage {
  id: string;
  text: string;
  sender: 'user' | 'counselor';
  timestamp: string;
}

export default function Support() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CounselorMessage[]>([
    {
      id: '1',
      text: "Hello! Welcome to Bonga Box. I am a licensed, trauma-informed counselor. Everything we discuss here is completely anonymous, secure, and end-to-end encrypted. How can I support you today?",
      sender: 'counselor',
      timestamp: 'Just now'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const helplines = [
    { title: "National Child Helpline", phone: "116", desc: "Toll-free, 24/7 child support & emergency line" },
    { title: "Komesha FGM Hotline", phone: "0800 720 550", desc: "Anti-FGM and gender-based violence reporting" },
    { title: "Red Cross Disaster line", phone: "1501", desc: "Emergency flood response & rescue dispatch" },
    { title: "County Safe Haven Office", phone: "+254 700 123 456", desc: "Isiolo gender protection coordinators" }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: CounselorMessage = {
      id: Date.now().toString(),
      text: inputVal,
      sender: 'user',
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate comforting counselor response
    setTimeout(() => {
      setIsTyping(false);
      const counselorMsg: CounselorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for sharing that with me. Please know that your bravery is incredible and you are not alone. Our county network has immediate legal backing, safe houses in Isiolo, and school mentors to protect you. Your coordinates are kept secure and masked.",
        sender: 'counselor',
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, counselorMsg]);
    }, 1500);
  };

  return (
    <div className="font-sans max-w-md mx-auto py-2 space-y-6 select-none">
      
      {/* Header telemetry info */}
      <div className="px-1">
        <h1 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none mb-1">
          Counsel Support System
        </h1>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
          Encrypted Child Helplines & Direct Mentors
        </p>
      </div>

      {/* Grid: 2 columns for quick helpline links and counseling center */}
      <div className="space-y-4">
        
        {/* Encrypted Counseling simulator */}
        <div className="bg-white border border-slate-150 rounded-2.5xl p-4.5 shadow-sm flex flex-col h-[320px]">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 shrink-0">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider block">Live Bonga Counselor</span>
            <span className="ml-auto text-[8.5px] font-mono text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">MASKED CONNECTION</span>
          </div>

          {/* Chat Messages flow */}
          <div className="flex-grow overflow-y-auto py-3 space-y-3 scrollbar-none">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-3 rounded-2xl text-[11px] leading-relaxed font-semibold shadow-xs ${
                  m.sender === 'user' 
                    ? 'bg-[#4F46E5] text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-800 border border-slate-150 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
                <span className="text-[7.5px] text-slate-400 mt-1 font-bold italic px-1">{m.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 mr-auto p-2 bg-slate-50 border border-slate-150 rounded-2xl text-[9px] text-slate-500 font-semibold animate-pulse">
                <Sparkles size={10} className="text-[#4F46E5] animate-spin" />
                <span>Counselor typing warm response...</span>
              </div>
            )}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-100 flex gap-2 shrink-0">
            <input 
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type your message with absolute anonymity..."
              className="flex-grow bg-slate-50 border border-slate-205 py-2.5 px-3 rounded-xl text-xs font-semibold focus:outline-none placeholder:text-slate-400 text-slate-800"
            />
            <button 
              type="submit"
              className="bg-[#4F46E5] hover:bg-[#3F37C9] text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center w-9 h-9"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Toll-Free Emergency Helpline Channels */}
        <div className="space-y-3">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1 block">
            Direct Voice Helpline Hub
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {helplines.map((h, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-150 p-3.5 rounded-xl flex flex-col justify-between shadow-xs text-left hover:border-indigo-400/40 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">{h.title}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-normal mb-3">{h.desc}</p>
                </div>
                
                <a 
                  href={`tel:${h.phone.replace(/\s+/g, '')}`}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-[10px] font-black uppercase tracking-wider text-center rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone size={11} /> Dial {h.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Safety footprint advice footer */}
      <footer className="bg-slate-900 text-white rounded-[2rem] p-5 shadow-lg border border-slate-800 text-center flex flex-col items-center">
        <ShieldCheck size={24} className="text-emerald-400 mb-2 animate-bounce" />
        <h3 className="font-display font-black text-xs text-white uppercase tracking-widest mb-1">Guaranteed Safety Masking</h3>
        <p className="text-[9.5px] text-slate-400 max-w-xs font-semibold leading-relaxed">
          Your conversation generates zero hardware cookie trails. If you close this page, all session storage is automatically destroyed.
        </p>
      </footer>

    </div>
  );
}
