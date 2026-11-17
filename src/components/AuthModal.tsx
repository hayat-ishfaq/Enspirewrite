import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Feather, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { typewriterAudio } from '../audio/typewriterAudio';
import type { User, ThemeMode } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  theme: ThemeMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  theme,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  // Theme styling
  const modalStyle = {
    slate: {
      bg: 'bg-[#9a9aa0] text-zinc-900 border-zinc-400',
      card: 'bg-zinc-200/90 border-zinc-300 text-zinc-900',
      input: 'bg-white/80 border-zinc-400 text-zinc-900 focus:border-zinc-800',
      button: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800',
      tabActive: 'bg-zinc-900 text-zinc-100 border-zinc-900',
      tabInactive: 'bg-zinc-300/60 text-zinc-700 hover:bg-zinc-300',
    },
    midnight: {
      bg: 'bg-[#18181c] text-zinc-200 border-zinc-800',
      card: 'bg-zinc-900/95 border-zinc-800 text-zinc-200',
      input: 'bg-zinc-950/80 border-zinc-700 text-zinc-100 focus:border-zinc-400',
      button: 'bg-zinc-100 text-zinc-900 hover:bg-white',
      tabActive: 'bg-zinc-100 text-zinc-900 border-zinc-100',
      tabInactive: 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800',
    },
    sepia: {
      bg: 'bg-[#d8d0c5] text-amber-950 border-[#c4baa9]',
      card: 'bg-[#f4eee4]/95 border-[#cfc4b2] text-amber-950',
      input: 'bg-white/70 border-[#b8ab9a] text-amber-950 focus:border-amber-900',
      button: 'bg-amber-950 text-amber-50 hover:bg-amber-900',
      tabActive: 'bg-amber-950 text-amber-50 border-amber-950',
      tabInactive: 'bg-[#ded4c4] text-amber-900 hover:bg-[#d0c6b8]',
    },
  }[theme];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    typewriterAudio.playKeyClick();

    try {
      if (mode === 'signup') {
        const result = await authService.signUp(name, email, password);
        if (result.success && result.user) {
          typewriterAudio.playCarriageReturn();
          onAuthSuccess(result.user);
          onClose();
        } else {
          setError(result.error || 'Failed to initialize account.');
        }
      } else {
        const result = await authService.signIn(email, password);
        if (result.success && result.user) {
          typewriterAudio.playCarriageReturn();
          onAuthSuccess(result.user);
          onClose();
        } else {
          setError(result.error || 'Failed to verify author identity.');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-md rounded-xl border p-6 sm:p-8 font-mono shadow-2xl z-10 transition-all ${modalStyle.card}`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-current/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full border border-current/20 bg-current/5">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">
                Author Ledger
              </h3>
              <p className="text-[11px] opacity-60">
                Secure personal manuscript archives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-current/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Sign In vs Create Ledger */}
        <div className="grid grid-cols-2 gap-2 my-5 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-2 rounded border text-center uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              mode === 'signin' ? modalStyle.tabActive : modalStyle.tabInactive
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded border text-center uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              mode === 'signup' ? modalStyle.tabActive : modalStyle.tabInactive
            }`}
          >
            Create Ledger
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-500 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Author / Pen Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ernest Hemingway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded border outline-none font-mono ${modalStyle.input}`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold uppercase tracking-wider mb-1.5 opacity-80">
              Author Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50" />
              <input
                type="email"
                required
                placeholder="writer@desk.paper"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 rounded border outline-none font-mono ${modalStyle.input}`}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider mb-1.5 opacity-80">
              Confidential Passcode
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-50" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 rounded border outline-none font-mono ${modalStyle.input}`}
              />
            </div>
            {mode === 'signup' && (
              <p className="text-[10px] opacity-60 mt-1">
                Minimum 6 characters. Hashed and stored in your private local cryptographic ledger.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${modalStyle.button}`}
          >
            <span>{mode === 'signup' ? 'Initialize Ledger' : 'Authorize & Open'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Offline / Guest Mode Fallback */}
        <div className="mt-5 pt-4 border-t border-current/10 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] opacity-60 hover:opacity-100 transition-opacity cursor-pointer inline-flex items-center gap-1.5 font-mono"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Continue as Guest Writer (Offline Storage)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
