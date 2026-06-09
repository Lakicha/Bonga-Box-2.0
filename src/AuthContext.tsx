import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, User, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateSimulatedRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  refreshProfile: async () => {},
  updateSimulatedRole: () => {}
});

const userProfileCache: Record<string, UserProfile> = {};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    if (userProfileCache[currentUser.uid]) {
      setProfile(userProfileCache[currentUser.uid]);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', currentUser.uid);
    let docSnap;
    try {
      docSnap = await getDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      setLoading(false);
      return;
    }

    let defaultRole = 'User';
    // @ts-ignore
    const adminEmailsEnv = (import.meta.env.VITE_ADMIN_EMAILS || "");
    const adminEmails = adminEmailsEnv ? adminEmailsEnv.split(',').map((email: string) => email.trim()) : [];
    const isAdminEmail = currentUser.email ? (adminEmails.includes(currentUser.email) || currentUser.email.endsWith('@bonga.org')) : false;
    if (isAdminEmail) {
      defaultRole = 'Admin';
    }

    const isSimulatedUser = currentUser.uid === 'mock-operator' || currentUser.email === 'operator@bonga.org';
    const simulatedRole = localStorage.getItem('bonga_simulated_role');

    if (docSnap.exists()) {
      const liveData = docSnap.data() as UserProfile;
      // Overwrite role only if operator is simulated, else use db role (with hardcoded admin precedence)
      const finalRole = isSimulatedUser
        ? ((simulatedRole || liveData.role || 'User') as UserProfile['role'])
        : (isAdminEmail ? 'Admin' : (liveData.role || 'User') as UserProfile['role']);

      const finalProfileObj = {
        ...liveData,
        role: finalRole
      };
      userProfileCache[currentUser.uid] = finalProfileObj;
      setProfile(finalProfileObj);
    } else {
      // Look up if an Admin already pre-onboarded this email address
      let preOnboardedSnap = null;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', currentUser.email || ''));
        preOnboardedSnap = await getDocs(q);
      } catch (err) {
        console.error('Error querying pre-onboarded profile', err);
      }

      if (preOnboardedSnap && !preOnboardedSnap.empty) {
        const onboardedDoc = preOnboardedSnap.docs[0];
        const onboardedData = onboardedDoc.data() as UserProfile;
        
        const mergedProfile: UserProfile = {
          ...onboardedData,
          uid: currentUser.uid,
          displayName: currentUser.displayName || onboardedData.displayName || '',
          role: onboardedData.role || 'User'
        };

        try {
          // If the matching doc has a temporary ID, remove it to prevent double listing
          if (onboardedDoc.id !== currentUser.uid) {
            await deleteDoc(doc(db, 'users', onboardedDoc.id));
          }
          await setDoc(docRef, mergedProfile);
          userProfileCache[currentUser.uid] = mergedProfile;
          setProfile(mergedProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
          console.error('Error merging pre-onboarded profile', err);
          userProfileCache[currentUser.uid] = mergedProfile;
          setProfile(mergedProfile);
        }
      } else {
        const finalRole = isSimulatedUser
          ? ((simulatedRole || defaultRole) as UserProfile['role'])
          : (isAdminEmail ? 'Admin' : 'User');

        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          role: finalRole,
          displayName: currentUser.displayName || '',
        };
        
        try {
          await setDoc(docRef, newProfile);
          userProfileCache[currentUser.uid] = newProfile;
          setProfile(newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
          console.error('Error creating profile', error);
          setProfile(null);
        }
      }
    }
  };

  const refreshProfile = async () => {
    const isBiometricUnlocked = localStorage.getItem('bonga_biometric_unlocked') === 'true';
    if (auth.currentUser) {
      setUser({ ...auth.currentUser });
      delete userProfileCache[auth.currentUser.uid];
      await fetchProfile(auth.currentUser);
    } else if (isBiometricUnlocked) {
      // Simulate fake logged-in user handle for offline simulator bypass
      const mockUser = {
        uid: 'mock-operator',
        email: 'operator@bonga.org',
        displayName: 'Simulated Operator',
        photoURL: ''
      } as any;
      const simRole = (localStorage.getItem('bonga_simulated_role') || 'Admin') as UserProfile['role'];
      
      setUser(mockUser);
      setProfile({
        uid: 'mock-operator',
        email: 'operator@bonga.org',
        displayName: 'Simulated Operator',
        role: simRole,
        schoolId: 'Isiolo Girls High'
      });
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const updateSimulatedRole = (role: string) => {
    const isSimulatedUser = user?.uid === 'mock-operator' || user?.email === 'operator@bonga.org';
    if (!isSimulatedUser) {
      console.warn('Simulated role update ignored for authenticated user');
      return;
    }
    localStorage.setItem('bonga_simulated_role', role);
    if (user && profile) {
      setProfile({
        ...profile,
        role: role as UserProfile['role']
      });
    } else {
      refreshProfile();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser);
      } else {
        const isBiometricUnlocked = localStorage.getItem('bonga_biometric_unlocked') === 'true';
        if (isBiometricUnlocked) {
          const mockUser = {
            uid: 'mock-operator',
            email: 'operator@bonga.org',
            displayName: 'Simulated Operator',
            photoURL: ''
          } as any;
          const simRole = (localStorage.getItem('bonga_simulated_role') || 'Admin') as UserProfile['role'];
          setUser(mockUser);
          setProfile({
            uid: 'mock-operator',
            email: 'operator@bonga.org',
            displayName: 'Simulated Operator',
            role: simRole,
            schoolId: 'Isiolo Girls High'
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    // Also listen to custom events to re-sync
    const syncProfile = () => {
      refreshProfile();
    };
    window.addEventListener('bonga_sync_simulated_profile', syncProfile);

    return () => {
      unsubscribe();
      window.removeEventListener('bonga_sync_simulated_profile', syncProfile);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateSimulatedRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
