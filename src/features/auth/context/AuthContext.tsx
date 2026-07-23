import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Utilizador normalizado (mantém .uid para compatibilidade com os consumidores)
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface UserData {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  userType?: 'agricultor' | 'proprietario' | 'vendedor' | 'comprador' | 'pendente';
  userTypes?: ('agricultor' | 'proprietario' | 'vendedor' | 'comprador')[];
  plan?: 'gratuito' | 'mensal' | 'trimestral' | 'anual';
  planAtivadoEm?: string;
  planExpiraEm?: string;
  favoritos?: string[];
  createdAt: any;
  photoURL?: string;
}

interface AuthContextType {
  currentUser: AppUser | null;
  userData: UserData | null;
  userRole: 'user' | 'admin' | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, phone?: string, userType?: string, userTypes?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (novaPass: string) => Promise<void>;
  recoveryMode: boolean;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// Traduz erros do Supabase Auth para mensagens amigáveis (pt-MZ)
function authError(message: string): Error {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return new Error('Email ou palavra-passe incorretos.');
  if (m.includes('already registered') || m.includes('already exists')) return new Error('Este email já está registado.');
  if (m.includes('email not confirmed')) return new Error('Confirme o seu email antes de entrar.');
  if (m.includes('password should be')) return new Error('Palavra-passe demasiado fraca (mínimo 6 caracteres).');
  if (m.includes('rate limit') || m.includes('too many')) return new Error('Muitas tentativas. Aguarde alguns minutos.');
  if (m.includes('network')) return new Error('Verifique a sua ligação à internet.');
  return new Error(message || 'Ocorreu um erro. Tente novamente.');
}

function mapProfile(row: any): UserData {
  return {
    uid: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    role: row.role ?? 'user',
    userType: row.user_type ?? 'pendente',
    userTypes: row.user_types ?? [],
    plan: row.plan ?? 'gratuito',
    planAtivadoEm: row.plan_ativado_em ?? undefined,
    planExpiraEm: row.plan_expira_em ?? undefined,
    favoritos: row.favoritos ?? [],
    createdAt: row.created_at ?? null,
    photoURL: row.photo_url ?? '',
  };
}

const fetchProfile = async (uid: string): Promise<UserData | null> => {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    return data ? mapProfile(data) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const userRole = userData?.role ?? null;

  const applySession = async (session: Session | null) => {
    const u = session?.user;
    if (u) {
      setCurrentUser({
        uid: u.id,
        email: u.email ?? null,
        displayName: (u.user_metadata?.name as string) ?? u.email?.split('@')[0] ?? null,
      });
      setUserData(await fetchProfile(u.id));
    } else {
      setCurrentUser(null);
      setUserData(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Ao clicar no link do email de recuperação, o utilizador chega com uma
      // sessão temporária e este evento dispara. Ativa o ecrã de nova senha.
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      applySession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw authError(error.message);
  };

  const register = async (email: string, pass: string, name: string, phone?: string, userType?: string, userTypes?: string[]) => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name, phone: phone ?? '', user_type: userType ?? 'pendente', user_types: userTypes ?? [] } },
    });
    if (error) throw authError(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserData(null);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw authError(error.message);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw authError(error.message);
  };

  const updatePassword = async (novaPass: string) => {
    const { error } = await supabase.auth.updateUser({ password: novaPass });
    if (error) throw authError(error.message);
    setRecoveryMode(false);
  };

  const clearRecovery = () => setRecoveryMode(false);

  return (
    <AuthContext.Provider value={{
      currentUser, userData, userRole, loading,
      login, register, logout, loginWithGoogle, resetPassword,
      updatePassword, recoveryMode, clearRecovery,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
