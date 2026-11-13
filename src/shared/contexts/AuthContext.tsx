import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import {
  checkIsAdmin,
  ensureUserProfile,
  isVerifiedOwnerEmail,
  logoutUser,
  reloadCurrentUser,
} from '../../services/authService';
import type { SellerProfile, UserProfile } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  sellerProfile: SellerProfile | null;
  isApprovedSeller: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const current = await reloadCurrentUser();
    if (!current) {
      setFirebaseUser(null);
      setProfile(null);
      setIsAdmin(false);
      return false;
    }
    setFirebaseUser(current);
    let nextProfile: UserProfile | null = profile;
    try {
      nextProfile = await ensureUserProfile(current);
      setProfile(nextProfile);
    } catch {
      // Fallback to checkIsAdmin below
    }
    const adminFlag = await checkIsAdmin(current, nextProfile);
    setIsAdmin(adminFlag);
    return adminFlag;
  }, [profile]);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubSeller: (() => void) | undefined;
    let cancelled = false;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      if (unsubProfile) unsubProfile();
      if (unsubSeller) unsubSeller();

      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setSellerProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      if (isVerifiedOwnerEmail(user)) {
        setIsAdmin(true);
      }

      let ensuredProfile: UserProfile | null = null;
      try {
        ensuredProfile = await ensureUserProfile(user);
        if (!cancelled) {
          setProfile(ensuredProfile);
        }
      } catch {
        // Profile subscription will still try to read
      }

      if (cancelled) return;

      unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        async (snap) => {
          if (cancelled) return;
          const nextProfile = snap.exists() ? (snap.data() as UserProfile) : ensuredProfile;
          setProfile(nextProfile);
          const adminFlag = await checkIsAdmin(user, nextProfile);
          if (!cancelled) {
            setIsAdmin(adminFlag);
            setLoading(false);
          }
        },
        async () => {
          if (cancelled) return;
          const adminFlag = await checkIsAdmin(user, ensuredProfile);
          if (!cancelled) {
            setIsAdmin(adminFlag);
            setLoading(false);
          }
        }
      );

      unsubSeller = onSnapshot(
        doc(db, 'sellers', user.uid),
        (snap) => {
          if (cancelled) return;
          setSellerProfile(
            snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<SellerProfile, 'id'>) }) : null
          );
        },
        () => {
          if (!cancelled) {
            setSellerProfile(null);
          }
        }
      );
    });

    return () => {
      cancelled = true;
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubSeller) unsubSeller();
    };
  }, []);

  const isApprovedSeller = sellerProfile?.status === 'approved' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        sellerProfile,
        isApprovedSeller,
        isAdmin,
        loading,
        refreshAuth,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
