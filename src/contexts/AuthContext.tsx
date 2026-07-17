import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // Add this
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Refreshing user data for:', user.uid);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newRole = userData.role as UserRole;
        console.log('📝 Updated role:', newRole);
        setUserRole(newRole);
        // Note: We can't directly modify the Firebase User object,
        // but we can store additional user data if needed
        return;
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('👤 Auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = data.role as UserRole;
            console.log('📋 User role from Firestore:', role);
            setUserRole(role);
          } else {
            console.warn('⚠️ No user document found for:', firebaseUser.uid);
            setUserRole(null);
          }
        } catch (error) {
          console.error('❌ Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}