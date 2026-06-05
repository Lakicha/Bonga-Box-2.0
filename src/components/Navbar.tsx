import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogIn, LogOut, Menu, X, ShieldAlert, BookOpen, LayoutDashboard, Home, User, ChevronRight } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Report', path: '/report', icon: ShieldAlert },
    { name: 'Flood Alerts', path: '/alerts', icon: ShieldAlert },
    { name: 'Resources', path: '/resources', icon: BookOpen },
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
              <Logo size={40} />
            </Link>
...
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
                <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                  <Link 
                    to="/profile"
                    className={`text-sm font-bold transition-all ${
                      location.pathname === '/profile' ? 'text-purple-primary' : 'text-text-dim hover:text-slate-900'
                    }`}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-purple-primary transition-all overflow-hidden border border-slate-200">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <Menu size={24} className="text-text-dim group-hover:text-slate-900 transition-all" />
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
              <button onClick={() => setIsOpen(true)} className="text-text-dim hover:text-slate-950 p-2">
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
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600 hover:text-slate-900">
                  <X size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-900">Menu</h2>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Profile Info */}
              <div className="px-8 py-10 text-center">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-primary to-magenta-accent mx-auto mb-4 p-1 shadow-glow overflow-hidden">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={40} className="text-slate-400" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1 text-slate-950">{user?.displayName || 'Guest User'}</h3>
                <p className="text-text-dim text-sm mb-6">{user?.email || 'Sign in to sync data'}</p>
                {!user && (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsOpen(false)}
                    className="btn-primary w-full inline-block !py-3 shadow-glow"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </div>

              {/* Menu Items */}
              <div className="flex-grow px-4 py-4 space-y-2 overflow-y-auto">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-purple-primary transition-all text-slate-600 group-hover:text-white">
                      <User size={20} />
                    </div>
                    <span className="font-bold text-slate-800">My Profile</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-800 transition-all" />
                </Link>

                <div className="pt-8 mt-8 border-t border-slate-100 space-y-2">
                  <p className="px-4 text-[10px] font-bold text-text-dim uppercase tracking-widest mb-4">Navigation</p>
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        location.pathname === link.path ? 'bg-purple-primary/10 text-purple-primary' : 'hover:bg-slate-50 text-text-dim hover:text-slate-900'
                      }`}
                    >
                      <link.icon size={20} />
                      <span className="font-bold">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-text-dim font-bold tracking-widest uppercase">Bonga Box v1.0</span>
                {user && (
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold transition-all"
                  >
                    <LogOut size={18} />
                    Logout
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
