import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReportSuccessModalProps {
  isAnonymous: boolean;
  onSubmitAnother: () => void;
}

const ReportSuccessModal: React.FC<ReportSuccessModalProps> = ({ isAnonymous, onSubmitAnother }) => {
  return (
    <div className="max-w-md mx-auto mt-32 text-center p-12 card border-white/10 shadow-glow">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30"
      >
        <CheckCircle2 size={48} />
      </motion.div>
      
      <h2 className="text-3xl font-bold mb-4">Report Submitted</h2>
      
      <p className="text-text-dim mb-8 leading-relaxed">
        {isAnonymous 
          ? "Thank you for speaking up anonymously. Your report has been received and will be reviewed by the protection team."
          : "Thank you for your report. You can track its progress in your profile dashboard."}
      </p>

      <div className="space-y-3">
        <button 
          onClick={onSubmitAnother} 
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          Submit Another Report
          <ArrowRight size={18} />
        </button>

        <Link 
          to="/" 
          className="block px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
        >
          Back to Home
        </Link>

        {!isAnonymous && (
          <Link 
            to="/profile" 
            className="block px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors"
          >
            View in Profile
          </Link>
        )}
      </div>
    </div>
  );
};

export default ReportSuccessModal;
