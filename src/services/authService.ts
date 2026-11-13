import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import type { UserProfile } from '../shared/types';

export const BOOTSTRAP_ADMIN_EMAIL = 'alonemurad404@gmail.com';

export function isVerifiedOwnerEmail(user: User | null): boolean {
  return Boolean(
    user?.email &&
      user.email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
      user.emailVerified
  );
}

export async function ensureUserProfile(firebaseUser: User, explicitName?: string): Promise<UserProfile> {
  const userPath = `users/${firebaseUser.uid}`;
  const ref = doc(db, 'users', firebaseUser.uid);
  const isOwnerAdmin = isVerifiedOwnerEmail(firebaseUser);

  try {
    if (isOwnerAdmin) {
      const adminRef = doc(db, 'admins', firebaseUser.uid);
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || BOOTSTRAP_ADMIN_EMAIL,
          createdAt: serverTimestamp(),
        });
      }
    }

    const snap = await getDoc(ref);
    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      if (isOwnerAdmin && existing.role !== 'admin') {
        await updateDoc(ref, {
          role: 'admin',
          updatedAt: serverTimestamp(),
        });
        return { ...existing, role: 'admin' };
      }
      return existing;
    }

    const displayName = (
      explicitName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'MultiMart User'
    ).slice(0, 120);

    const newProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName,
      phone: firebaseUser.phoneNumber || '',
      role: isOwnerAdmin ? 'admin' : 'customer',
      status: 'active',
      preferredLang: 'en',
      addresses: [],
    };

    await setDoc(ref, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function checkIsAdmin(firebaseUser: User | null, profile: UserProfile | null): Promise<boolean> {
  if (!firebaseUser) return false;
  if (isVerifiedOwnerEmail(firebaseUser)) {
    return true;
  }
  if (profile?.role === 'admin') return true;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export async function sendVerificationEmailToCurrentUser(): Promise<void> {
  if (!auth.currentUser) throw new Error('No signed-in account found.');
  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
  if (auth.currentUser) {
    await ensureUserProfile(auth.currentUser);
  }
  return auth.currentUser;
}

export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  return ensureUserProfile(result.user);
}

export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return ensureUserProfile(result.user);
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<UserProfile> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) {
    await updateProfile(result.user, { displayName: name.trim() });
  }
  return ensureUserProfile(result.user, name.trim());
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
