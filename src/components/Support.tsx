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
      text: "Hello! Welcome to Bonga Box. This is an interactive demo of our counselling resource finder. While we work to build live partnerships with dispatch and clinical networks, you can preview simulated counselor responses here, or dial our direct 24/7 child helplines below.",
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
        text: "Thank you for sharing that with me. Our community networks collaborate with legal support, emergency services, safe houses in Isiolo, and school mentors to protect children and girls at risk.",
        sender: 'counselor',
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, counselorMsg]);
    }, 1500);
  };

  return (
    <div className="font-sans max-w-md mx-auto py-1.5 space-y-4 select-none">
      
      {/* Header telemetry info */}
      <div className="px-1">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight leading-none mb-1">
          Counsel support hub
        </h1>
        <p className="text-[10px] text-slate-500 font-medium">
          Child helplines & direct protection networks
        </p>
      </div>

      {/* Grid: 2 columns for quick helpline links and counseling center */}
      <div className="space-y-3.5">
        
        {/* Counseling simulator */}
        <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-xs flex flex-col h-[300px]">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 shrink-0">
            <div className="w-2 h-2 bg-[#4F46E5] rounded-full" />
            <span className="text-[11px] font-semibold text-slate-800">Counselling assistant</span>
            <span className="ml-auto text-[9px] text-[#4F46E5] bg-indigo-50/75 px-1.5 py-0.5 rounded-full font-medium">Demo active</span>
          </div>

          {/* Chat Messages flow */}
          <div className="flex-grow overflow-y-auto py-2.5 space-y-2.5 scrollbar-none">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-2.5 rounded-[20px] text-[10.5px] leading-relaxed font-semibold shadow-xs ${
                  m.sender === 'user' 
                    ? 'bg-[#4F46E5] text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
                <span className="text-[8px] text-slate-405 mt-0.5 font-medium px-0.5">{m.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 mr-auto p-1.5 px-2.5 bg-slate-50 border border-slate-100 rounded-[20px] text-[9px] text-slate-500 font-medium animate-pulse">
                <Sparkles size={9} className="text-[#4F46E5]" />
                <span>Simulated counselor typing...</span>
              </div>
            )}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-100 flex gap-2 shrink-0">
            <input 
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask the simulated demo counselor..."
              className="flex-grow bg-slate-50 border border-slate-100 py-2 px-3 rounded-[20px] text-xs font-semibold focus:outline-none placeholder:text-slate-400 text-slate-800"
            />
            <button 
              type="submit"
              className="bg-[#4F46E5] hover:bg-[#3F37C9] text-white p-2 rounded-[20px] transition-all shadow-xs active:scale-95 shrink-0 flex items-center justify-center w-8.5 h-8.5 cursor-pointer"
            >
              <Send size={12} />
            </button>
          </form>
        </div>

        {/* Toll-Free Emergency Helpline Channels */}
        <div className="space-y-2.5">
          <span className="text-[10px] text-slate-400 font-semibold pl-1 block">
            Direct voice helpline hub
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {helplines.map((h, idx) => (
              <div 
                key={idx}
                className="bg-white border border-slate-100 p-4 rounded-[20px] flex flex-col justify-between shadow-xs text-left hover:border-indigo-400/30 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 leading-tight mb-0.5">{h.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mb-2">{h.desc}</p>
                </div>
                
                <a 
                  href={`tel:${h.phone.replace(/\s+/g, '')}`}
                  className="w-full py-2 bg-indigo-50/70 hover:bg-indigo-100/80 text-[#4F46E5] text-[10px] font-semibold text-center rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone size={10} /> Dial {h.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Safety footprint advice footer */}
      <footer className="bg-indigo-50/30 border border-slate-100 text-slate-800 rounded-[20px] p-5 shadow-xs text-center flex flex-col items-center">
        <HeartHandshake size={20} className="text-[#4F46E5] mb-2" />
        <h3 className="font-semibold text-xs text-slate-900 mb-1">Safe directory search</h3>
        <p className="text-[9.5px] text-slate-500 max-w-xs font-medium leading-relaxed">
          The helplines dial directly from your device. Make sure you are in a private, safe location before making outreach phone calls.
        </p>
      </footer>

    </div>
  );
}
