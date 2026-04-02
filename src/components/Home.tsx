import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, BookOpen, ArrowRight, ShieldCheck, Users, Instagram, Facebook, Twitter } from 'lucide-react';
import { motion } from 'motion/react';

import Logo from './Logo';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col bg-bg-dark text-white">
      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden min-h-[80vh] flex items-center">
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-tight tracking-tighter">
              The Safe Space <br />
              for <span className="gradient-text">Isiolo.</span>
            </h1>
            <p className="text-xl text-text-dim mb-12 max-w-2xl mx-auto leading-relaxed">
              A secure platform where you can report FGM risks and receive real-time flood alerts. No algorithms. No noise. Just community protection.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/report" className="btn-primary !py-4 !px-12 text-lg flex items-center gap-3 w-full sm:w-auto justify-center">
                Submit a Report <ShieldAlert size={20} />
              </Link>
              <Link to="/alerts" className="btn-secondary !py-4 !px-12 text-lg flex items-center gap-3 w-full sm:w-auto justify-center">
                View Alerts <AlertTriangle size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">How it works</h2>
            <p className="text-text-dim text-lg">Three steps to a safer community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Speak Up", desc: "Submit an anonymous report about FGM risks or flood concerns. Your identity is 100% protected." },
              { num: "02", title: "Get Notified", desc: "Our system processes alerts and sends real-time notifications to the community and responders." },
              { num: "03", title: "Stay Safe", desc: "Access safe zones, emergency contacts, and resources to protect yourself and others." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="card group"
              >
                <span className="text-7xl font-bold text-white/5 group-hover:text-purple-primary/20 transition-colors mb-8 block">
                  {step.num}
                </span>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-text-dim leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pill Tags */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-4">
          {["Anonymous", "FGM Protection", "Flood Alerts", "Isiolo", "Community", "Safety", "Real-time", "Emergency", "Verified"].map((tag, i) => (
            <span key={i} className="pill-tag">{tag}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20">
            <div className="text-center md:text-left">
              <Logo size={44} className="mb-6 inline-block md:block" />
              <p className="text-text-dim font-medium max-w-xs">
                Knowledge is better <br /> when it's shared.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-9xl lg:text-[15rem] font-bold text-white/5 select-none tracking-tighter mb-12">
              Bonga
            </h2>
            <p className="text-text-dim text-sm font-medium">
              © Bonga Box 2026. All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
