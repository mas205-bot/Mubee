import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, removeStoredToken, setStoredToken } from '../services/api';
import { 
  auth, 
  googleProvider
} from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  demoLogin: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const usesPasswordProvider = firebaseUser.providerData.some(provider => provider.providerId === 'password');
          if (usesPasswordProvider && !firebaseUser.emailVerified) {
            removeStoredToken();
            setToken(null);
            setUser(null);
            setIsLoading(false);
            return;
          }

          const session = await api.loginWithFirebase(await firebaseUser.getIdToken());
          setUser(session.user);
          setToken(session.token);
        } catch (error) {
          console.warn('Error restoring Firebase session:', error);
          removeStoredToken();
          setToken(null);
          setUser(null);
        }
      } else {
        // Fallback to checking local token / backend session
        const storedToken = getStoredToken();
        if (storedToken) {
          try {
            const profile = await api.getMe();
            setUser(profile);
            setToken(storedToken);
          } catch {
            removeStoredToken();
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const session = await api.loginWithFirebase(await firebaseUser.getIdToken());
      setUser(session.user);
      setToken(session.token);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await firebaseSignOut(auth);
        throw new Error('Your email is not verified. Firebase sent a fresh verification link.');
      }
      const session = await api.loginWithFirebase(await result.user.getIdToken());
      setUser(session.user);
      setToken(session.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      removeStoredToken();
      setToken(null);
      setUser(null);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name?.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
      await sendEmailVerification(credential.user);
      await firebaseSignOut(auth);
      removeStoredToken();
      setToken(null);
      setUser(null);
      return {
        success: true,
        message: `A verification link was sent to ${credential.user.email}. Verify your email, then sign in.`
      };
    } catch (error) {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await firebaseSignOut(auth);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error('Please enter your email address.');
      }

      await sendPasswordResetEmail(auth, normalizedEmail);
      return {
        success: true,
        message: `A password reset link was sent to ${normalizedEmail}. Check your inbox and choose a new password.`
      };
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        return {
          success: true,
          message: 'If an account exists for that email, a password reset link has been sent.'
        };
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin();
      setUser(res.user);
      setToken(res.token);
      setStoredToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        forgotPassword,
        demoLogin,
        loginWithGoogle,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
