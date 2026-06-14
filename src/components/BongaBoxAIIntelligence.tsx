import React from 'react';
import { Report } from '../types';
import { motion } from 'motion/react';
import { 
  Brain, 
  Sparkles, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle,
  Lightbulb,
  HeartHandshake
} from 'lucide-react';

interface BongaBoxAIIntelligenceProps {
  report: Report;
  isAnalyzing: boolean;
  onAnalyze: () => Promise<void>;
}

export const BongaBoxAIIntelligence: React.FC<BongaBoxAIIntelligenceProps> = ({
  report,
  isAnalyzing,
  onAnalyze
}) => {
  const analysis = report.aiAnalysis;

  if (isAnalyzing) {
    return (
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-purple-100 rounded-3xl p-5 space-y-4 animate-pulse font-sans">
        <div className="flex items-center gap-2 border-b border-purple-100/60 pb-3">
          <Brain className="text-purple-primary animate-spin" size={18} />
          <div className="space-y-1">
            <div className="h-3 w-32 bg-purple-200 rounded" />
            <div className="h-2.5 w-48 bg-purple-150 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-5/6 bg-slate-100 rounded" />
          <div className="h-3 w-4/6 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-8 bg-slate-100 rounded-xl" />
          <div className="h-8 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-3xl p-5 text-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto mb-3.5 border border-indigo-100/50 shadow-xs">
          <Brain size={22} className="animate-pulse" />
        </div>
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
          Bonga Box AI Intelligence
        </h4>
        <p className="text-slate-500 text-[11px] leading-relaxed max-w-[280px] mx-auto mb-4 font-medium">
          Convert raw, anonymous user reports into highly structured, risk-assessed, and categorized clinical case profiles automatically.
        </p>
        <button
          onClick={onAnalyze}
          className="w-full bg-purple-primary hover:bg-purple-dark text-white text-[11px] font-black uppercase tracking-widest py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles size={11} className="text-yellow-300" /> Analyze with Bonga Box AI
        </button>
      </div>
    );
  }

  // Color code based on Risk Level
  const getRiskStyles = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          badge: 'bg-rose-500 text-white',
          pulse: true
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          badge: 'bg-orange-500 text-white',
          pulse: false
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'bg-amber-500 text-slate-900',
          pulse: false
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badge: 'bg-emerald-500 text-white',
          pulse: false
        };
    }
  };

  const getUrgencyStyles = (urg: string) => {
    switch (urg?.toUpperCase()) {
      case 'IMMEDIATE':
        return 'bg-red-50 text-red-600 border-red-200 font-extrabold animate-pulse';
      case 'URGENT':
        return 'bg-amber-50 text-amber-600 border-amber-200 font-extrabold';
      case 'SOON':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const risk = getRiskStyles(analysis.risk_level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-slate-50/70 to-white border border-slate-200/80 rounded-3xl p-5 space-y-4 font-sans relative overflow-hidden shadow-xs"
    >
      {/* Background radial accent flare */}
      <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* AI Header Line */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5">
          <Brain className="text-purple-primary" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4F46E5]">
            Bonga Box AI Case Analytics
          </span>
        </div>
        {analysis.confidence_score !== undefined && (
          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
            Accuracy: {(analysis.confidence_score * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Risk and Urgency Gauges */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={`p-2.5 rounded-2xl border flex flex-col justify-between ${risk.bg}`}>
          <span className="text-[8px] uppercase tracking-widest font-black opacity-80 mb-0.5">Risk Rating</span>
          <div className="flex items-center gap-1.5">
            {risk.pulse && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            <span className="text-[11px] font-black uppercase tracking-wide">{analysis.risk_level}</span>
          </div>
        </div>

        <div className={`p-2.5 rounded-2xl border flex flex-col justify-between ${getUrgencyStyles(analysis.urgency)}`}>
          <span className="text-[8px] uppercase tracking-widest font-black opacity-80 mb-0.5">Response Urgency</span>
          <span className="text-[11px] font-black uppercase tracking-wide">{analysis.urgency}</span>
        </div>
      </div>

      {/* Category Map Subcategories */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          <span className="bg-indigo-50 border border-indigo-150/40 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
            🏷️ {analysis.category}
          </span>
          <span className="bg-purple-50 border border-purple-150/40 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-xl">
            📍 {analysis.subcategory || 'Incident Profile'}
          </span>
          {analysis.sentiment && (
            <span className="bg-slate-50 border border-slate-150 text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded-xl">
              🧠 Tone: <span className="font-bold underline text-slate-800">{analysis.sentiment}</span>
            </span>
          )}
        </div>
      </div>

      {/* Structured Case Summary */}
      <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-150 text-left">
        <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block pl-0.5">
          Executive Summary
        </span>
        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
          {analysis.summary}
        </p>
      </div>

      {/* Key Issues Extracted Tags */}
      {analysis.key_issues && analysis.key_issues.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 block pl-0.5">
            Extracted Key Vulnerability Signals
          </span>
          <div className="flex flex-wrap gap-1">
            {analysis.key_issues.map((issue, idx) => (
              <span 
                key={idx} 
                className="bg-white hover:bg-slate-50/50 border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-default transition-colors"
              >
                <Activity size={8} className="text-indigo-400" /> {issue}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Referrals and Recommended Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-slate-100 pt-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 pl-0.5">
            <Lightbulb size={11} className="text-[#4F46E5]" />
            <span className="text-[8.5px] font-black uppercase tracking-widest text-[#4F46E5] block">
              Rescue Action steps
            </span>
          </div>
          <ul className="space-y-1">
            {analysis.recommended_actions?.map((act, i) => (
              <li key={i} className="text-[10px] text-slate-650 flex items-start gap-1 font-semibold leading-relaxed">
                <CheckCircle2 size={10} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1 pl-0.5">
            <HeartHandshake size={11} className="text-purple-primary" />
            <span className="text-[8.5px] font-black uppercase tracking-widest text-purple-primary block">
              NGO / Agency Link-ups
            </span>
          </div>
          <ul className="space-y-1">
            {analysis.referral_type?.map((ref, i) => (
              <li key={i} className="text-[10px] text-slate-650 flex items-start gap-1 font-semibold leading-relaxed">
                <ArrowRight size={10} className="text-[#4F46E5] shrink-0 mt-0.5" />
                <span className="bg-slate-50/70 border border-slate-150 px-1 py-0.2 rounded font-bold text-slate-700">{ref}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Escalation Attention Warnings */}
      {analysis.escalation_required && (
        <motion.div 
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="bg-red-50/70 border border-red-100 rounded-2xl p-2.5 text-center text-red-750 flex items-center justify-center gap-2"
        >
          <ShieldAlert size={15} className="text-red-500 animate-pulse shrink-0" />
          <span className="text-[9.5px] font-black uppercase tracking-wider text-red-700 animate-pulse">
            🚨 Escalation protocol triggered. Notify Emergency Dispatch Desk!
          </span>
        </motion.div>
      )}

      {/* Recalculate Live Trigger */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onAnalyze}
          className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 hover:text-purple-primary transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw size={9} /> Re-run Case Analysis
        </button>
      </div>
    </motion.div>
  );
};
