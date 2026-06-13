import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { auth, signOut } from '../firebase';
import { 
  Shield, 
  Check, 
  Fingerprint, 
  Globe, 
  BookOpen, 
  Lock, 
  LogOut, 
  User, 
  Camera,
  ShieldAlert,
  Bell,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, profile, updateSimulatedRole } = useAuth();
  const navigate = useNavigate();

  // Settings interactive toggles
  const [biometricLock, setBiometricLock] = useState<boolean>(true);
  const [panicMode, setPanicMode] = useState<boolean>(() => localStorage.getItem('bonga_panic_mode') === 'true');
  const [language, setLanguage] = useState<'English' | 'Swahili'>('English');
  const [schoolCodeInput, setSchoolCodeInput] = useState<string>('ISIOLO_SEC_99');

  // Push Alert Settings state
  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean>(() => {
    return localStorage.getItem('bonga_notification_enabled') === 'true';
  });
  const [notificationPermissionState, setNotificationPermissionState] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [userNotificationArea, setUserNotificationArea] = useState<string>(() => {
    return localStorage.getItem('bonga_notification_area') || 'Isiolo';
  });

  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert("Push notifications are not supported in this browser container context.");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setNotificationPermissionState(result);
      if (result === 'granted') {
        localStorage.setItem('bonga_notification_enabled', 'true');
        setNotificationsAllowed(true);
        // Dispatch test welcome alert
        try {
          new Notification("Bonga Safeguard Live!", {
            body: `You will now receive high-priority alerts in your area: "${userNotificationArea || 'All'}"`,
            icon: '/icon.png'
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem('bonga_notification_enabled', 'false');
        setNotificationsAllowed(false);
        alert("Notification permission denied. Review browser site settings to allow alerts.");
      }
    } catch (e) {
      console.warn("Error requesting notification state", e);
    }
  };

  const handleToggleNotifications = () => {
    const newValue = !notificationsAllowed;
    localStorage.setItem('bonga_notification_enabled', String(newValue));
    setNotificationsAllowed(newValue);

    if (newValue && notificationPermissionState !== 'granted') {
      requestPushPermission();
    }
  };

  const handleSaveArea = (area: string) => {
    setUserNotificationArea(area);
    localStorage.setItem('bonga_notification_area', area);
  };

  const triggerTestNotification = () => {
    if (notificationPermissionState !== 'granted') {
      requestPushPermission();
      return;
    }
    try {
      new Notification("🚨 Test Protection Alert", {
        body: `Critical flood or protection response needed inside "${userNotificationArea || 'your region'}". Verification dispatch confirmed.`,
        icon: '/icon.png'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    // Erase simulated codes too
    localStorage.removeItem('bonga_user_nickname');
    localStorage.removeItem('bonga_biometric_unlocked');
    localStorage.removeItem('bonga_simulated_role');
    navigate('/auth');
  };

  return (
    <div className="font-sans max-w-sm mx-auto select-none py-2 space-y-6">
      
      {/* 7. Profile Header Card */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-xs text-center flex flex-col items-center relative overflow-hidden">
        {/* Glow backdrop graphic */}
        <div className="absolute top-[-10%] left-[-10%] w-[130px] h-[130px] bg-purple-100/30 rounded-full blur-2xl pointer-events-none" />

        {/* Circular profile photo with "PROTECTED" badge and green checkmark icon */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] shadow-xs flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-50 overflow-hidden border border-white flex items-center justify-center">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User Profile'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="text-slate-400" size={32} />
              )}
            </div>
          </div>

          {/* PROTECTED badge and checkmark element overlay on avatar */}
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 border border-white px-2 py-0.5 rounded-full flex items-center gap-1 text-white shadow-xs">
            <Check size={8} strokeWidth={4} />
            <span className="text-[7.5px] font-black uppercase tracking-wider">PROTECTED</span>
          </div>
        </div>

        <h2 className="text-base font-semibold text-slate-900 leading-none mb-1.5">
          {user?.displayName 
            ? user.displayName.split(' ')[0] 
            : (user?.email ? user.email.split('@')[0] : 'Theo')}
        </h2>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none">
          Safe Space Operator Nodes
        </p>
      </div>

      {/* Identity Cards Segment: Two white cards showing "Proxy ID" and "Joined Date" */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white border border-slate-100 rounded-[20px] p-4 text-left shadow-xs">
          <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Proxy ID</span>
          <span className="text-xs font-mono font-bold text-[#4F46E5] uppercase truncate block">
            PRX-90EACC83
          </span>
        </div>

        <div className="bg-white border border-slate-100 rounded-[20px] p-4 text-left shadow-xs">
          <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Joined Date</span>
          <span className="text-xs font-semibold text-slate-800 uppercase block">
            June 2026
          </span>
        </div>
      </div>

      {/* Settings List: Rows for School Code, Biometric Lock, and Language */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-xs space-y-4">
        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2.5">
          Local Security Parameters
        </span>

        {/* Row 1: School Code */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-purple-primary/5 text-purple-primary rounded-lg flex items-center justify-center shrink-0">
              <BookOpen size={13} />
            </div>
            <span className="font-bold text-slate-800">School Code</span>
          </div>

          <input 
            type="text" 
            value={schoolCodeInput}
            onChange={(e) => setSchoolCodeInput(e.target.value)}
            className="w-28 text-right bg-transparent border-b border-transparent focus:border-purple-primary outline-none font-mono font-extrabold text-[#4F46E5] text-xs h-6 pr-0.5"
          />
        </div>

        {/* Row 2: Biometric Lock toggle */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-purple-primary/5 text-purple-primary rounded-lg flex items-center justify-center shrink-0">
              <Fingerprint size={14} />
            </div>
            <span className="font-bold text-slate-800">Developer Sandbox Bypass</span>
          </div>

          {/* Simple Toggle with purple design */}
          <button
            type="button"
            onClick={() => setBiometricLock(!biometricLock)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
              biometricLock ? 'bg-purple-primary' : 'bg-slate-201'
            }`}
          >
            <span 
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                biometricLock ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Row 2.5: Panic Mode Toggle */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
              <ShieldAlert size={14} className="text-rose-500" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-800">Panic Mode Protection</span>
              <span className="text-[9px] text-slate-400 font-medium font-sans">Hold for 2s to activate Quick SOS</span>
            </div>
          </div>

          {/* Simple Toggle with rose design */}
          <button
            type="button"
            onClick={() => {
              const newValue = !panicMode;
              setPanicMode(newValue);
              localStorage.setItem('bonga_panic_mode', String(newValue));
            }}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
              panicMode ? 'bg-[#F43F5E]' : 'bg-slate-201'
            }`}
          >
            <span 
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                panicMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Row 3: Language selection (English/Swahili) */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-purple-primary/5 text-purple-primary rounded-lg flex items-center justify-center shrink-0">
              <Globe size={13} />
            </div>
            <span className="font-bold text-slate-800">Language</span>
          </div>

          <div className="flex gap-1 bg-slate-50 border border-slate-100 p-0.5 rounded-lg text-[9px] font-semibold uppercase">
            <button
              onClick={() => setLanguage('English')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'English' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('Swahili')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'Swahili' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Swahili
            </button>
          </div>
        </div>

        {/* Row 4: Simulated Active Role Selection or Locked Official Role */}
        <div className="flex flex-col gap-1.5 pt-2.5 border-t border-slate-50 mt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-50 text-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
                <Shield size={13} />
              </div>
              <span className="font-bold text-slate-800">
                {user?.uid === 'mock-operator' || user?.email === 'operator@bonga.org' ? 'Simulated Role' : 'Authorized Role'}
              </span>
            </div>

            {user?.uid === 'mock-operator' || user?.email === 'operator@bonga.org' ? (
              <select
                value={profile?.role || 'User'}
                onChange={(e) => {
                  updateSimulatedRole(e.target.value);
                  // Trigger a global custom event to notify AppLayout to re-sync sidebar views
                  window.dispatchEvent(new Event('bonga_sync_simulated_profile'));
                }}
                className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 outline-hidden cursor-pointer hover:bg-slate-100 transition-all font-sans"
              >
                <option value="User">User / Child</option>
                <option value="Admin">Admin Portal</option>
                <option value="Mentor/Teacher">Mentor / Teacher</option>
                <option value="Protection Officer">Protection Officer</option>
                <option value="Disaster Management Officer">Disaster Officer</option>
              </select>
            ) : (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-semibold uppercase tracking-wider">
                {profile?.role || 'User'}
              </span>
            )}
          </div>
          {!(user?.uid === 'mock-operator' || user?.email === 'operator@bonga.org') && (
            <p className="text-[9px] text-slate-400 font-semibold leading-normal pl-9.5 text-left">
              🔒 Locked & governed by administrative console.
            </p>
          )}
        </div>

        {/* Row 5: Safety Tour Guide Launcher */}
        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-purple-primary/5 text-purple-primary rounded-lg flex items-center justify-center shrink-0 animate-pulse">
              <Shield size={13} className="text-[#4F46E5]" />
            </div>
            <span className="font-bold text-slate-800">Safety Guide Carousel</span>
          </div>

          <button
            onClick={() => window.dispatchEvent(new Event('bonga_trigger_onboarding_carousel'))}
            className="px-2.5 py-1 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-lg text-[9px] font-semibold uppercase tracking-wider shadow-xs transition-transform active:scale-95 text-center cursor-pointer"
          >
            Launch Tour
          </button>
        </div>

      </div>

      {/* 🔔 Browser Push Alerts System Card (Uniform Card) */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-xs space-y-4">
        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-widest block border-b border-slate-50 pb-2.5 flex items-center gap-1.5 leading-none">
          <Bell size={11} className="text-[#4F46E5]" />
          Push Alerts Configuration
        </span>

        {/* Permission status & toggle */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-800">Browser Native Notifications</span>
            <span className="text-[9px] text-slate-400 font-medium">
              Permission state: 
              {notificationPermissionState === 'granted' && <span className="text-[#4F46E5] font-bold ml-1 uppercase bg-[#4F46E5]/10 px-1 py-0.5 rounded">ACTIVE</span>}
              {notificationPermissionState === 'denied' && <span className="text-rose-500 font-bold ml-1 uppercase bg-rose-50 px-1 py-0.5 rounded">DENIED</span>}
              {notificationPermissionState === 'default' && <span className="text-amber-500 font-bold ml-1 uppercase bg-amber-50 px-1 py-0.5 rounded">UNPRIVILEGED</span>}
              {notificationPermissionState === 'unsupported' && <span className="text-slate-500 font-bold ml-1 uppercase font-mono bg-slate-100 px-1 py-0.5 rounded">UNSUPPORTED</span>}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleNotifications}
            disabled={notificationPermissionState === 'unsupported'}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
              notificationsAllowed && notificationPermissionState === 'granted' ? 'bg-[#4F46E5]' : 'bg-slate-200'
            }`}
          >
            <span 
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                notificationsAllowed && notificationPermissionState === 'granted' ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Input area selector */}
        <div className="space-y-2 text-left text-xs pt-1">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-[11px]">Regional Geo-Filter</span>
            <span className="text-[8px] text-[#4F46E5] font-bold bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded uppercase tracking-wider font-sans">Active Target</span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium leading-relaxed leading-normal">
            Only triggers native alerts when incidents occur inside this specific sanctuary, municipality, or county. Type "All" to listen to all.
          </p>

          <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-lg p-1">
            <MapPin size={13} className="text-slate-400 ml-1.5 shrink-0" />
            <input 
              type="text"
              value={userNotificationArea}
              onChange={(e) => handleSaveArea(e.target.value)}
              placeholder="e.g. Isiolo, Garba Tulla, Merti"
              className="w-full bg-transparent pl-2 pr-2 outline-none text-slate-800 font-bold text-xs h-7"
            />
          </div>

          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-1 pt-1">
            {['Isiolo', 'Merti', 'Garba Tulla', 'Samburu', 'Marsabit', 'All'].map((area) => (
              <button
                key={area}
                onClick={() => handleSaveArea(area)}
                className={`text-[8px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                  userNotificationArea.toLowerCase() === area.toLowerCase()
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Test Trigger Button */}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <button
            onClick={triggerTestNotification}
            disabled={notificationPermissionState === 'unsupported'}
            className="w-full py-2 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/70 text-[10px] text-slate-700 font-bold transition-transform active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer leading-none"
          >
            <Bell size={11} className="text-[#4F46E5] animate-bounce" />
            <span>Simulate Native Push Alert</span>
          </button>
        </div>
      </div>

      {/* Footer Settings Row: red-outlined Logout button */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-red-100 bg-red-50 hover:bg-red-100/50 text-red-600 font-bold rounded-[20px] flex items-center justify-center gap-2 text-xs transition-colors active:scale-[0.98] cursor-pointer"
        >
          <LogOut size={13} />
          <span>Logout Session</span>
        </button>
      </div>

    </div>
  );
};

export default Profile;
