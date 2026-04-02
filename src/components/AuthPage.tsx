import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { motion } from 'motion/react';
import { Mail, Shield, Check, ArrowRight, Star, Zap, Crown, User } from 'lucide-react';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'subscription'>('login');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/profile');
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const plans = [
    {
      name: 'Community',
      price: 'Free',
      features: ['Submit anonymous reports', 'View public alerts', 'Access resource hub'],
      icon: User,
      color: 'text-text-dim',
      bg: 'bg-white/5'
    },
    {
      name: 'Protector',
      price: '$5/mo',
      features: ['Priority report handling', 'SMS emergency alerts', 'Personal safety dashboard', 'Community support group'],
      icon: Shield,
      color: 'text-purple-primary',
      bg: 'bg-purple-primary/10',
      popular: true
    },
    {
      name: 'Champion',
      price: '$15/mo',
      features: ['Direct access to mentors', 'Advanced flood analytics', 'Organization management', 'Custom safety protocols'],
      icon: Crown,
      color: 'text-magenta-accent',
      bg: 'bg-magenta-accent/10'
    }
  ];

  if (user && view === 'login') {
    setView('subscription');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-white">
      <div className="flex flex-col items-center mb-16">
        <Logo size={80} className="mb-8" />
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          {view === 'login' ? 'Join the ' : 'Choose Your '}
          <span className="gradient-text">{view === 'login' ? 'Movement' : 'Impact'}</span>
        </h1>
        <p className="text-text-dim text-lg max-w-2xl text-center">
          {view === 'login' 
            ? 'Access secure reporting, real-time alerts, and community resources to help end FGM and stay safe from floods.'
            : 'Support our mission and unlock advanced safety features for yourself and your community.'}
        </p>
      </div>

      {view === 'login' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="glass-card p-12 text-center border-white/5 shadow-glow">
            <div className="mb-10">
              <div className="w-20 h-20 bg-purple-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-purple-primary/20">
                <Shield size={40} className="text-purple-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Secure Access</h2>
              <p className="text-text-dim text-sm">Sign in to manage your reports and alerts.</p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all mb-6"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              Continue with Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-bg-dark px-4 text-text-dim">Or</span></div>
            </div>

            <div className="space-y-4">
              <input type="email" placeholder="Email Address" className="input-field" />
              <button className="btn-primary w-full py-4 shadow-glow">
                Continue with Email
              </button>
            </div>

            <p className="mt-8 text-xs text-text-dim">
              By continuing, you agree to our <span className="text-white underline cursor-pointer">Terms of Service</span> and <span className="text-white underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
          
          <button 
            onClick={() => setView('subscription')}
            className="w-full mt-8 text-text-dim hover:text-purple-primary transition-colors text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            View Subscription Plans <ArrowRight size={16} />
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-10 flex flex-col relative border-white/5 ${plan.popular ? 'border-purple-primary/30 shadow-glow' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-glow">
                  Most Popular
                </div>
              )}
              
              <div className={`w-14 h-14 ${plan.bg} ${plan.color} rounded-2xl flex items-center justify-center mb-8 border border-white/5`}>
                <plan.icon size={28} />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold">{plan.price}</span>
              </div>
              
              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-green-500" />
                    </div>
                    <span className="text-sm text-text-dim leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button className={`w-full py-4 rounded-2xl font-bold transition-all uppercase tracking-widest text-xs ${
                plan.popular ? 'btn-primary shadow-glow' : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}>
                {plan.price === 'Free' ? 'Get Started' : 'Subscribe Now'}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {view === 'subscription' && (
        <div className="mt-16 text-center">
          <button 
            onClick={() => setView('login')}
            className="text-text-dim hover:text-purple-primary transition-colors text-sm font-bold uppercase tracking-widest"
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
