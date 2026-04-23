import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, signInWithPopup, signInWithRedirect,
  sendPasswordResetEmail, updateProfile
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

export interface UserData {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  userType?: 'agricultor' | 'proprietario' | 'vendedor' | 'pendente';
  plan?: 'gratuito' | 'mensal' | 'trimestral' | 'anual';
  planAtivadoEm?: string;   // ISO date string
  planExpiraEm?: string;    // ISO date string
  createdAt: any;
  photoURL?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  userRole: 'user' | 'admin' | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, name: string, phone?: string, userType?: string) => Promise<any>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Helper: fetch or create user document in Firestore (non-blocking)
const syncUserToFirestore = async (user: User, extraData?: Partial<UserData>): Promise<UserData | null> => {
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);

    // Determine role: admin email from env, otherwise 'user'
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const isAdmin = adminEmail && user.email === adminEmail;

    if (!snap.exists()) {
      // First time: create user document
      await setDoc(ref, {
        uid: user.uid,
        name: extraData?.name || user.displayName || user.email?.split('@')[0] || 'Utilizador',
        email: user.email || '',
        phone: extraData?.phone || '',
        role: isAdmin ? 'admin' : 'user',
        userType: extraData?.userType || 'pendente',
        plan: 'gratuito', // default plan
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
      });
    } else if (isAdmin && snap.data()?.role !== 'admin') {
      // Promote to admin if env email matches
      await setDoc(ref, { role: 'admin' }, { merge: true });
    }

    const updated = await getDoc(ref);
    return updated.data() as UserData;
  } catch (err) {
    // Firestore unavailable or rules blocking — log but don't crash login
    console.warn('[AgroConecta] Firestore sync failed, continuing with auth only:', err);
    // Return a minimal userData based on Firebase Auth info
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    return {
      uid: user.uid,
      name: extraData?.name || user.displayName || user.email?.split('@')[0] || 'Utilizador',
      email: user.email || '',
      phone: extraData?.phone || '',
      role: (adminEmail && user.email === adminEmail) ? 'admin' : 'user',
      photoURL: user.photoURL || '',
      createdAt: null,
    } as UserData;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = userData?.role ?? null;

  // Register — saves to Firebase Auth + Firestore
  const register = async (email: string, pass: string, name: string, phone?: string, userType?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    const data = await syncUserToFirestore(cred.user, { name, phone, userType: userType as any });
    setUserData(data);
    return cred;
  };

  // Login with email/password — fetches Firestore profile
  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const data = await syncUserToFirestore(cred.user);
    setUserData(data);
    return cred;
  };

  // Login with Google — creates or syncs Firestore profile
  const loginWithGoogle = async () => {
    // Usamos signInWithRedirect em vez de popup para evitar bloqueios em browsers mobile (ex: in-app browsers)
    await signInWithRedirect(auth, googleProvider);
  };

  // Logout — clears local state
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  // Password reset email
  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Auth state observer — runs once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const data = await syncUserToFirestore(user);
          setUserData(data);
        } catch {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser, userData, userRole, loading,
      login, register, logout, loginWithGoogle, resetPassword
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};