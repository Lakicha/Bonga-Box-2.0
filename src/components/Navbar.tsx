import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogIn, LogOut, Menu, X, ShieldAlert, BookOpen, LayoutDashboard, Home, User, ChevronRight, Shield, Fingerprint, Clock, Activity, Settings, ChevronDown, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, db, collection, query, where, onSnapshot } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [personalReportsCount, setPersonalReportsCount] = React.useState<number | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (!user) {
      setPersonalReportsCount(null);
      return;
    }
    const qReports = query(collection(db, 'reports'), where('authorUid', '==', user.uid));
    const unsubscribe = onSnapshot(qReports, (snapshot) => {
      setPersonalReportsCount(snapshot.size);
    }, (error) => {
      console.warn("Could not load reports count for profile badge", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setIsDropdownOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Report', path: '/report', icon: ShieldAlert },
    { name: 'Flood Alerts', path: '/alerts', icon: ShieldAlert },
    { name: 'Resources', path: '/resources', icon: BookOpen },
    { name: 'Safety Companion', path: '/safety', icon: Shield },
  ];

  if (profile?.role === 'Mentor/Teacher' || profile?.role === 'Mentor' || profile?.role === 'Teacher') {
    navLinks.push({ name: 'School Dashboard', path: '/school-dashboard', icon: LayoutDashboard });
  }

  if (profile?.role === 'Protection Officer') {
    navLinks.push({ name: 'Protection Dashboard', path: '/protection-dashboard', icon: LayoutDashboard });
  }

  if (profile?.role === 'Disaster Management Officer') {
    navLinks.push({ name: 'Disaster Dashboard', path: '/disaster-dashboard', icon: LayoutDashboard });
  }

  if (profile?.role === 'Admin') {
    navLinks.push({ name: 'School', path: '/school-dashboard', icon: LayoutDashboard });
    navLinks.push({ name: 'Protection', path: '/protection-dashboard', icon: LayoutDashboard });
    navLinks.push({ name: 'Disaster', path: '/disaster-dashboard', icon: LayoutDashboard });
    navLinks.push({ name: 'Admin', path: '/admin-dashboard', icon: LayoutDashboard });
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-6`}>
        <div className={`max-w-7xl mx-auto transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-xl border border-slate-200/80 py-3 px-8 rounded-full shadow-md shadow-purple-900/[0.02]' : 'bg-transparent py-4 px-2'
        }`}>
          <div className="flex justify-between items-center">
            <Link to="/" className="group">
              <Logo size={62} />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-bold transition-all ${
                    location.pathname === link.path 
                      ? 'text-purple-primary' 
                      : 'text-text-dim hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <div className="flex items-center gap-4 pl-6 border-l border-slate-200 relative">
                  {/* Premium Hover/Click Profile Badge Trigger */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none text-left ${
                        isDropdownOpen 
                          ? 'bg-slate-50 border-purple-primary/40 shadow-xs' 
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Interactive Avatar with Active Colored Border Ring */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all overflow-hidden border-2 ${
                        profile?.role === 'Admin' ? 'border-purple-primary' :
                        profile?.role === 'Disaster Management Officer' ? 'border-cyan-500' :
                        profile?.role === 'Protection Officer' ? 'border-pink-500' :
                        profile?.role === 'Mentor/Teacher' ? 'border-indigo-500' : 'border-emerald-500'
                      }`}>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={14} className="text-slate-500" />
                        )}
                      </div>

                      {/* Display Info */}
                      <div className="hidden lg:block">
                        <p className="text-[11px] font-semibold text-slate-700 leading-none truncate max-w-[100px]">
                          {user.displayName?.split(' ')[0] || 'Active Handle'}
                        </p>
                        <p className="text-[9px] font-medium text-slate-500 leading-none mt-0.5">
                          {profile?.role || 'Citizen'}
                        </p>
                      </div>

                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-slate-800' : ''}`} />
                    </button>

                    {/* Interactive Dropdown Card Overlay - Handcrafted Premium Design */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <>
                          {/* Close backdrop on trigger selection */}
                          <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                          
                          <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 mt-2.5 w-72 bg-white border border-slate-100 rounded-[20px] shadow-xs z-20 overflow-hidden text-slate-800"
                          >
                            {/* Header Canvas */}
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3.5 relative">
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-medium text-slate-450">Secure link</span>
                              </div>
                              <div className="w-11 h-11 rounded-full p-0.5 bg-indigo-100 shrink-0">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                  {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <User size={18} className="text-indigo-400" />
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 leading-none mb-1">
                                  {user.displayName || 'Bonga Friend'}
                                </h4>
                                <p className="text-[9px] text-text-dim font-medium truncate leading-none mb-1">{user.email}</p>
                                <span className="inline-block px-2 py-0.5 bg-purple-primary/10 text-purple-primary rounded-full text-[9px] font-medium leading-none">
                                  {profile?.role || 'County Citizen'}
                                </span>
                              </div>
                            </div>

                            {/* Dynamic Live Metadata Bento Details - Explicitly distinct from home widgets */}
                            <div className="p-4 space-y-3 border-b border-slate-100">
                              {/* Cryptographic SHA ID mask - Absolute secure privacy asset */}
                              <div className="bg-slate-50 border border-slate-100/50 rounded-[20px] p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Fingerprint size={14} className="text-indigo-600 shrink-0" />
                                  <div>
                                    <p className="text-[9px] font-medium text-slate-450 leading-none mb-1">Secure route mask</p>
                                    <p className="text-[10px] font-mono text-slate-600 leading-none">
                                      bnga_anon_{user.uid.slice(0, 6).toLowerCase()}...
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50 font-medium h-fit">Active</span>
                              </div>

                              {/* Interactive Report stats & Creation Date - Absolute unique user attributes */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100/50 rounded-[20px] p-3">
                                  <span className="text-[9px] text-slate-400 font-medium block">Your reports</span>
                                  <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-sm font-semibold leading-none text-[#4f46e5]">
                                      {personalReportsCount !== null ? personalReportsCount : '0'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">filed</span>
                                  </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-100/50 rounded-[20px] p-3">
                                  <span className="text-[9px] text-slate-400 font-medium block">Enrolled date</span>
                                  <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-[11px] font-medium leading-none text-slate-700">
                                      {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString([], { month: 'short', year: '2-digit' }) : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Authorized Clearances Section */}
                              <div>
                                <span className="text-[9px] text-slate-400 font-medium mb-1 pl-1 block">Verified access clearances</span>
                                <div className="text-[10px] text-slate-650 bg-indigo-50/30 rounded-[20px] p-3 border border-indigo-100/30 leading-snug font-medium">
                                  {profile?.role === 'Admin' && '✓ Full Admin access (level 4)'}
                                  {profile?.role === 'Disaster Management Officer' && '✓ Hydrology dispatch access (level 3)'}
                                  {profile?.role === 'Protection Officer' && '✓ Youth & gender protection desk (level 3)'}
                                  {profile?.role === 'Mentor/Teacher' && '✓ School guidance club desk (level 2)'}
                                  {(profile?.role === 'User' || !profile?.role) && '✓ Standard safelink access (level 1)'}
                                </div>
                              </div>
                            </div>

                            {/* Dropdown Options List */}
                            <div className="p-2 space-y-1 bg-slate-50/50">
                              <Link
                                to="/profile"
                                onClick={() => setIsDropdownOpen(false)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all group"
                              >
                                <span className="flex items-center gap-2">
                                  <Settings size={13} className="text-slate-400 group-hover:text-slate-900 transition-colors" /> Settings
                                </span>
                                <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                              </Link>

                              {/* Direct links to Authorized Dashboard boards */}
                              {profile?.role === 'Admin' && (
                                <Link
                                  to="/admin-dashboard"
                                  onClick={() => setIsDropdownOpen(false)}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#4f46e5] hover:text-[#4f46e5] hover:bg-purple-primary/5 transition-all"
                                >
                                  <span className="flex items-center gap-2">
                                    <LayoutDashboard size={13} /> County administration dashboard
                                  </span>
                                  <ChevronRight size={12} />
                                </Link>
                              )}

                              <button
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  handleLogout();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all text-left cursor-pointer"
                              >
                                <LogOut size={13} /> Close session
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Menu burger next to dropdown for side drawer triggers */}
                  <button 
                    onClick={() => setIsOpen(true)}
                    className="flex p-2 rounded-full hover:bg-slate-100 text-text-dim hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <Menu size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="btn-primary !py-2.5 !px-8 text-sm shadow-glow">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsOpen(true)} className="text-text-dim hover:text-slate-950 p-2 cursor-pointer">
                <Menu size={28} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[60]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white border-l border-slate-200 text-slate-800 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-8 flex justify-between items-center border-b border-slate-100">
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600 hover:text-slate-900 cursor-pointer">
                  <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-900">Menu</h2>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Profile Info */}
              <div className="px-8 py-8 text-center border-b border-slate-100">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-primary to-magenta-accent mx-auto mb-3.5 p-0.5 shadow-sm overflow-hidden">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={32} className="text-slate-400" />
                    )}
                  </div>
                </div>
                <h3 className="text-base font-display font-extrabold text-slate-950 tracking-tight leading-snug mb-0.5">
                  {user?.displayName || 'Community Member'}
                </h3>
                <p className="text-[10px] text-text-dim leading-none font-semibold mb-3">{user?.email || 'Secure Local Browsing Mode'}</p>
                
                {user ? (
                  <div className="mt-4 space-y-2.5 text-left bg-slate-50 border border-slate-100 rounded-[20px] p-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-medium text-slate-500">Security access</span>
                      <span className="text-[10px] font-semibold text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded-full">
                        {profile?.role || 'Citizen'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[10px] font-medium text-slate-750">
                      <span className="text-[10px] text-slate-500">Device identifier</span>
                      <span className="font-mono text-slate-600">ANON-{user.uid.slice(0, 6).toUpperCase()}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-medium text-slate-750">
                      <span className="text-[10px] text-slate-500">Reports authored</span>
                      <span className="font-mono text-indigo-600 bg-white border border-slate-100 px-2 py-0.5 rounded-full">
                        {personalReportsCount !== null ? personalReportsCount : '0'} reports
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsOpen(false)}
                    className="btn-primary w-full inline-block !py-3 shadow-none"
                  >
                    Log In / Sign Up
                  </Link>
                )}
              </div>

              {/* Menu Items */}
              <div className="flex-grow px-4 py-4 space-y-2 overflow-y-auto">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-3 rounded-[20px] hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-purple-primary transition-all text-slate-600 group-hover:text-white">
                      <User size={18} />
                    </div>
                    <span className="font-semibold text-slate-800">My profile</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-800 transition-all" />
                </Link>

                <div className="pt-6 mt-6 border-t border-slate-100 space-y-1">
                  <p className="px-3 text-[10px] font-semibold text-slate-400 mb-2">Navigation</p>
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-[20px] transition-all ${
                        location.pathname === link.path ? 'bg-purple-primary/10 text-purple-primary font-semibold' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <link.icon size={18} />
                      <span>{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs text-slate-400 font-medium">Bonga Box v1.0</span>
                {user && (
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-650 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
