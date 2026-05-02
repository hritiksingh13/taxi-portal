import React, { useState } from 'react';
import { useDashboardStore } from '../../core/store/useDashboardStore';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Input } from '../../shared/components/ui/Form';

export default function Login() {
  const { setAuthenticated } = useDashboardStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Use environment variable or fallback to default
    const masterPassword = import.meta.env.VITE_MASTER_PASSWORD || 'admin@123';

    if (password === masterPassword) {
      setAuthenticated(true);
      localStorage.setItem('taxi_portal_auth', 'true');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-fleet-500/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-4 sm:mb-6">
            <ShieldCheck className="text-fleet-400 w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">FleetOps Portal</h1>
          <p className="text-slate-500 mt-1.5 sm:mt-2 text-sm sm:text-base">Enter your manager password to continue</p>
        </div>

        <div className="card p-6 sm:p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div>
              <label className="label text-slate-400">Master Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-500" />
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 sm:h-12 text-base sm:text-lg"
                  error={error}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              {error && <p className="text-rose-400 text-xs font-medium mt-2 animate-pulse">Incorrect password. Please try again.</p>}
            </div>

            <button
              type="submit"
              className="btn-primary w-full h-11 sm:h-12 text-sm sm:text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              Access Portal
              <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 sm:mt-8">
          Secure Management Access • v1.0.0
        </p>
      </div>
    </div>
  );
}
