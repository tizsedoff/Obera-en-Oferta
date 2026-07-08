import React, { useState } from 'react';
import { ShieldCheck, User, Store, KeyRound, Sparkles, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import BrandLogo from './BrandLogo';

interface LoginScreenProps {
  onLogin: (role: 'customer' | 'merchant', email?: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoFill = () => {
    if (role === 'customer') {
      setEmail('comprador@obera.com');
      setPassword('cliente123');
    } else {
      setEmail('yerbamate@obera.com');
      setPassword('comercio123');
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Simple verification for show
      if (email.length < 3) {
        setError('Por favor, ingresá un correo electrónico válido.');
        return;
      }
      if (password.length < 4) {
        setError('La contraseña debe tener al menos 4 caracteres.');
        return;
      }

      onLogin(role, email);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between p-4 relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Background Glowing Circles */}
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-brand-orange/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-50px] left-[-50px] w-72 h-72 bg-brand-red/10 dark:bg-purple-500/5 rounded-full blur-3xl" />

      {/* Header Accent */}
      <div className="flex justify-between items-center max-w-md mx-auto w-full pt-4 z-10">
        <BrandLogo />
        <span className="text-[10px] bg-indigo-50 dark:bg-zinc-800 text-brand-orange dark:text-indigo-400 font-bold px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-zinc-700">
          Versión PWA v1.2
        </span>
      </div>

      {/* Main Login Card container */}
      <div className="w-full max-w-md mx-auto my-auto py-8 z-10">
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="font-display font-black text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
              ¡Te damos la bienvenida!
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-400 font-medium mt-1">
              Encontrá ofertas activas y cupones QR exclusivos en Oberá
            </p>
          </div>

          {/* SPREAD TAB TOGGLE (Customer vs Merchant) */}
          <div className="bg-slate-50 dark:bg-zinc-950 p-1.5 rounded-2xl flex items-center mb-6 border border-slate-100/80 dark:border-zinc-800/80">
            <button
              onClick={() => {
                setRole('customer');
                setError(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'customer'
                  ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-md scale-[1.02]'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <User className="w-4 h-4" />
              Soy Cliente
            </button>
            <button
              onClick={() => {
                setRole('merchant');
                setError(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'merchant'
                  ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-md scale-[1.02]'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <Store className="w-4 h-4" />
              Soy Comercio
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder={role === 'customer' ? 'ejemplo@correo.com' : 'comercio@obera.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  required
                />
                <KeyRound className="absolute right-3.5 top-2.5 text-slate-400 dark:text-zinc-500 w-4 h-4" />
              </div>
            </div>

            {/* Quick Demo Credentials Autofill */}
            <div className="flex justify-between items-center text-[10px] pt-1">
              <span className="text-slate-400 dark:text-zinc-500">¿Querés probar rápido?</span>
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-brand-orange dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 animate-pulse" /> Rellenar datos demo
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] text-xs cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Ingresar como {role === 'customer' ? 'Comprador' : 'Comerciante'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest Bypass Mode for easier review */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800" />
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">O también</span>
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800" />
          </div>

          <button
            onClick={() => onLogin('customer')}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-750 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Explorar como Invitado (Sin registro)
          </button>
        </div>
      </div>

      {/* Footer copyright and location */}
      <div className="max-w-md mx-auto w-full text-center text-[10px] text-slate-400 dark:text-zinc-500 pb-2 z-10 font-sans">
        <p>© 2026 Oberá en Oferta • <a href="https://aps-web-tau.vercel.app/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-slate-500 hover:text-brand-orange dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">APS DEVELOPER</a></p>
        <p className="mt-0.5 font-bold text-slate-500 dark:text-zinc-650">Hecho para potenciar el comercio de tierra colorada 🧉</p>
      </div>
    </div>
  );
}
