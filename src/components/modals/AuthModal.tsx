import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, LogIn, Mail, Lock, Key, Globe, Check, AlertCircle } from 'lucide-react';
import { getSupabaseCredentials, setSupabaseCredentials } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithSupabaseEmail, signUpWithSupabaseEmail, loginWithSupabaseGoogle, addToast } = useFinance();

  const [mode, setMode] = useState<'login' | 'signup' | 'config'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Config fields
  const currentCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(currentCreds.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentCreds.anonKey);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'config') {
      if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
        addToast('error', 'Konfigurasi Tidak Lengkap', 'Masukkan Supabase URL dan Anon Key.');
        return;
      }
      setSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      addToast('success', 'Konfigurasi Tersimpan', 'Supabase Client berhasil diperbarui.');
      setMode('login');
      return;
    }

    if (!email.trim() || !password.trim()) {
      addToast('warning', 'Form Tidak Lengkap', 'Masukkan Email dan Password.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const ok = await loginWithSupabaseEmail(email.trim(), password);
        if (ok) {
          onClose();
        }
      } else {
        const ok = await signUpWithSupabaseEmail(email.trim(), password);
        if (ok) {
          onClose();
        }
      }
    } catch (error) {
      console.error('[AuthModal] Authentication error:', error);
      addToast(
        'error',
        'Login Gagal',
        'Terjadi kesalahan saat memproses login. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] w-full max-w-md rounded-3xl p-6 relative text-[var(--text-primary)] shadow-2xl space-y-5 animate-fade-in transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)]">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {mode === 'login' && 'Masuk Akun Supabase Cloud'}
              {mode === 'signup' && 'Daftar Akun Baru Supabase'}
              {mode === 'config' && 'Pengaturan Credential Supabase'}
            </h3>
            <p className="text-xs text-[#7C8799]">
              Data otomatis tersinkronkan antar Laptop, HP & Tablet
            </p>
          </div>
        </div>

        {/* Subtab Modes */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'login'
                ? 'btn-gold text-[#0B1220] font-extrabold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'signup'
                ? 'btn-gold text-[#0B1220] font-extrabold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setMode('config')}
            className={`py-2 rounded-xl transition-all ${
              mode === 'config'
                ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] font-extrabold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Config DB
          </button>
        </div>

        {mode !== 'config' ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[var(--gold-primary)]" /> Email Akun
              </label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
                required
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--gold-primary)]" /> Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Memproses Supabase Auth...' : mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun Baru'}
            </button>

            <div className="relative text-center my-2">
              <span className="bg-[#121A2A] px-3 text-[10px] text-[#7C8799] relative z-10 uppercase font-bold">
                Atau Login Dengan
              </span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(255,255,255,0.08)]" />
              </div>
            </div>

            <button
              type="button"
              onClick={loginWithSupabaseGoogle}
              className="w-full py-3 bg-[#0B1220] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Login dengan Google Supabase</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#0B1220] rounded-2xl border border-[rgba(212,175,55,0.25)] text-[#F6D365] space-y-1.5">
              <span className="font-extrabold block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Status Kredensial Supabase
              </span>
              <p className="text-[11px] text-[#BFC8D6]">
                {currentCreds.source === 'env'
                  ? 'Supabase Cloud otomatis terhubung via Environment Variables Vercel.'
                  : 'Kredensial digunakan untuk menghubungkan aplikasi ke Supabase PostgreSQL.'}
              </p>
              {currentCreds.source === 'env' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <Check className="w-3 h-3 stroke-[3]" /> Konfigurasi Supabase Cloud Aktif (Auto-Environment)
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#F6D365]" /> Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#F6D365]" /> Supabase Anon Key (Public)
              </label>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={e => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37] font-mono text-[10px]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Simpan Kredensial & Hubungkan
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
