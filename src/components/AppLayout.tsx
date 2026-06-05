import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Home, History, Compass, BookOpen, User, Clock, Bell, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signOut } from '../firebase';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('08:49');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Update time for the mockup status bar dynamically
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // high-fidelity 12-hour format like image or 24h
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if current path is an admin / operator full-screen dashboard
  const isOperatorDashboard = location.pathname.includes('-dashboard');

  if (isOperatorDashboard) {
    // Render full-screen layout for operator/admin dashboards on computer
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Simple Operator Desktop Menu */}
        <header className="bg-white border-b border-slate-200 py-3 px-6 flex justify-between items-center shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-[#4F46E5] text-lg tracking-tight">Bonga Admin Control</span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold uppercase tracking-widest rounded-md border border-indigo-200/50">
              {profile?.role || 'Operator'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-slate-800 hover:text-[#4F46E5] transition-colors uppercase tracking-widest py-1.5 px-4 bg-slate-100 rounded-xl"
            >
              ← Back to App View
            </button>
            <button
              onClick={() => {
                signOut(auth);
                navigate('/');
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest flex items-center gap-1.5"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Determine active Tab index
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/history') return 'history';
    if (path === '/alerts') return 'lost';
    if (path.startsWith('/resources')) return 'resources';
    if (path === '/profile' || path === '/auth') return 'profile';
    return '';
  };

  const activeTab = getActiveTab();

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 relative overflow-x-hidden">
      {/* Dynamic global ambient blur graphics */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-200/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-205/30 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Global Responsive Header & Navbar */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-100 z-50 select-none">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Brand Brandmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-linear-to-br from-[#4F46E5] to-[#3F37C9] rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-display font-black text-sm tracking-tighter">B</span>
            </div>
            <div>
              <span className="font-display font-extrabold text-sm tracking-tight text-slate-900 block leading-none mb-0.5">Bonga Box</span>
              <span className="text-[8px] text-text-dim font-bold tracking-widest uppercase leading-none block">Safe Space</span>
            </div>
          </Link>

          {/* Center Links (Visible on Desktop / Tablet) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-2xl">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'home' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/history" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'history' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              History
            </Link>
            <Link 
              to="/alerts" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'lost' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Lost & Map
            </Link>
            <Link 
              to="/resources" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'resources' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Routes
            </Link>
            <Link 
              to="/profile" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'profile' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Profile
            </Link>
          </nav>

          {/* Right Session / Operator Menu Button */}
          <div className="flex items-center gap-3">
            {profile && profile.role !== 'User' && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 bg-indigo-50 text-[#4F46E5] text-[9.5px] font-bold uppercase tracking-wider rounded-md border border-indigo-200/50">
                {profile.role.replace('/Teacher', '')}
              </span>
            )}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-800 transition-colors relative"
              title="Quick Portal Desk"
            >
              <Menu size={20} />
              {profile && profile.role !== 'User' && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4F46E5] rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Global Slide Drawer for Operator panels & custom nodes */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[270px] bg-white border-l border-slate-150 shadow-2xl z-[110] flex flex-col p-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#4F46E5] rounded-lg flex items-center justify-center text-white text-xs font-extrabold">B</div>
                  <h3 className="font-display font-extrabold text-xs text-slate-950 uppercase tracking-widest">Bonga Box</h3>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                <div>
                  <p className="text-[10px] font-extrabold text-text-dim uppercase tracking-widest mb-2 px-1">Primary Safety Channels</p>
                  <div className="space-y-1">
                    <Link 
                      to="/" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <span>Daily Status Monitor</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>

                    <Link 
                      to="/report" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <span>Secure Bonga Report</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>

                    <Link 
                      to="/alerts" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <span>Telemetry Alert Map</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>

                    <Link 
                      to="/resources" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <span>Educational Routes</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </Link>
                  </div>
                </div>

                {/* If operator roles exist */}
                {profile && profile.role !== 'User' && (
                  <div className="pt-3 border-t border-slate-150">
                    <p className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest mb-2 px-1">Operator Portals</p>
                    <div className="space-y-1.5">
                      {profile.role === 'Admin' && (
                        <Link 
                          to="/admin-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50 text-orange-900 border border-orange-200/50 text-xs font-extrabold hover:bg-orange-100/60"
                        >
                          <span>County Admin Control</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Mentor/Teacher' || profile.role === 'Admin') && (
                        <Link 
                          to="/school-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200/50 text-xs font-extrabold hover:bg-purple-100/60"
                        >
                          <span>School Club Hub</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Protection Officer' || profile.role === 'Admin') && (
                        <Link 
                          to="/protection-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/50 text-xs font-extrabold hover:bg-blue-100/60"
                        >
                          <span>Protection Desk</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Disaster Management Officer' || profile.role === 'Admin') && (
                        <Link 
                          to="/disaster-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/50 text-xs font-extrabold hover:bg-amber-100/60"
                        >
                          <span>Disaster Dispatch</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-150 pt-3">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-650 hover:bg-red-100 border border-red-200/40 font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#4F46E5] text-white font-bold text-xs uppercase tracking-widest transition-colors text-center shadow-xs hover:bg-[#3F37C9]"
                  >
                    Login Account
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Spacious Content Body Container */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-24 md:pb-12 relative z-10">
        {children}
      </main>

      {/* Floating Modern Native-style bottom Navigation bar ONLY visible on Mobile standard screen ports */}
      <div className="md:hidden fixed bottom-4 inset-x-4 bg-white/95 backdrop-blur-md border border-slate-200/60 py-2.5 px-2 flex justify-around items-center rounded-2xl shadow-lg z-40 select-none">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'home' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Home</span>
        </Link>

        <Link 
          to="/history" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'history' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">History</span>
        </Link>

        <Link 
          to="/alerts" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'lost' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Lost</span>
        </Link>

        <Link 
          to="/resources" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'resources' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Routes</span>
        </Link>

        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'profile' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default AppLayout;
