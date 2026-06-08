import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, User, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  refreshProfile: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    const docRef = doc(db, 'users', currentUser.uid);
    let docSnap;
    try {
      docSnap = await getDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
      setLoading(false);
      return;
    }

    if (docSnap.exists()) {
      setProfile(docSnap.data() as UserProfile);
    } else {
      const isAdminEmail = currentUser.email === "mohamed.lakicha@gmail.com" || currentUser.email === "profkoch.theo@gmail.com";
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        role: isAdminEmail ? 'Admin' : 'User',
        displayName: currentUser.displayName || '',
      };
      
      try {
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
        console.error('Error creating profile', error);
        setProfile(null);
      }
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      setUser({ ...auth.currentUser }); // Trigger re-render with fresh user object
      await fetchProfile(auth.currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
