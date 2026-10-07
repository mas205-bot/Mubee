import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Wrench, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeResetEmail, buildPasswordResetMessage } from '../lib/passwordReset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login'
}) => {
  const { login, register, forgotPassword, demoLogin, loginWithGoogle, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setError(null);
    setRegisterMessage(null);
  };

  const getAuthErrorMessage = (authError: any, fallback: string) => {
    if (authError?.code === 'auth/too-many-requests') {
      return 'Firebase temporarily blocked requests after too many attempts. Wait before trying again, and check your inbox for an existing verification email.';
    }
    return authError?.message || fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else {
        const result = await register(email, password, name);
        setRegisterMessage(result.message);
      }
    } catch (err: any) {
      if (mode === 'register' && err.code === 'auth/email-already-in-use') {
        setMode('login');
        setError(null);
        try {
          await login(email, password);
          onClose();
        } catch (loginError: any) {
          if (loginError.code === 'auth/too-many-requests') {
            setError(getAuthErrorMessage(loginError, 'Sign-in failed.'));
          } else {
            setRegisterMessage(loginError.message || 'This email already has a Firebase account. Check your inbox for a fresh verification link, or sign in with the account password.');
          }
        }
        return;
      }
      setError(getAuthErrorMessage(err, 'Authentication failed. Please verify credentials.'));
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setRegisterMessage(null);

    const normalizedEmail = normalizeResetEmail(email);
    if (!normalizedEmail) {
      setError('Enter your email address to receive a password reset link.');
      return;
    }

    try {
      const result = await forgotPassword(normalizedEmail);
      setRegisterMessage(result.message || buildPasswordResetMessage(normalizedEmail));
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Password reset failed. Please try again.'));
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  const handleDemo = async () => {
    setError(null);
    try {
      await demoLogin();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                {mode === 'login' ? 'Technician / User Login' : 'Create Mechanic Account'}
              </h2>
              <p className="text-[11px] text-slate-400">FixBeforeBuy Decision Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => { setMode('login'); resetState(); }}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors text-center ${
              mode === 'login'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); resetState(); }}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors text-center ${
              mode === 'register'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Demo Access banner */}
          <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                Quick-Test Pro Account
              </div>
              <div className="text-[11px] text-slate-400">Pre-seeded with diagnostics & estimates</div>
            </div>
            <button
              type="button"
              onClick={handleDemo}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>Demo Login</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Firebase Google Sign In button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google (Firebase)</span>
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] uppercase font-mono text-slate-500">or with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {error && (
            <div className="p-3 text-xs bg-red-950/50 border border-red-800 text-red-200 rounded">
              {error}
            </div>
          )}

          {registerMessage && (
            <div className="p-3 text-xs bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded" role="status">
              {registerMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Marcus Miller"
                      className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
                {mode === 'login' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      className="text-[11px] font-medium text-blue-300 hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-wider rounded transition-colors shadow-sm"
              >
                {isLoading 
                  ? 'Processing...' 
                  : mode === 'login' ? 'Sign In to Dashboard' : 'Create Free Account'}
              </button>
          </form>

          <div className="pt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted credentials · User data strictly isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
