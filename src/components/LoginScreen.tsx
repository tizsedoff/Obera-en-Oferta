import React, { useState } from 'react';
import { User, Store, KeyRound, AlertCircle, ArrowRight, RefreshCw, Sparkles, LogIn, UserPlus } from 'lucide-react';
import BrandLogo from './BrandLogo';

interface LoginScreenProps {
  onLogin: (role: 'customer' | 'merchant' | 'visitor', email?: string, name?: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to load registered users from localStorage
  const getRegisteredUsers = (): Array<{ email: string; pass: string; name: string; role: 'customer' | 'merchant' }> => {
    const saved = localStorage.getItem('obera_ofertas_registered_users');
    return saved ? JSON.parse(saved) : [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const lowerEmail = email.trim().toLowerCase();

      if (activeTab === 'signup') {
        // Sign Up Flow
        if (!name.trim()) {
          setError('Por favor, ingresá tu nombre completo.');
          return;
        }
        if (lowerEmail.length < 3 || !lowerEmail.includes('@')) {
          setError('Por favor, ingresá un correo electrónico válido.');
          return;
        }
        if (password.length < 4) {
          setError('La contraseña debe tener al menos 4 caracteres.');
          return;
        }

        const users = getRegisteredUsers();
        if (users.some((u) => u.email === lowerEmail)) {
          setError('Este correo electrónico ya está registrado.');
          return;
        }

        // Register new user
        users.push({
          email: lowerEmail,
          pass: password,
          name: name.trim(),
          role,
        });
        localStorage.setItem('obera_ofertas_registered_users', JSON.stringify(users));

        // Log in
        onLogin(role, lowerEmail, name.trim());
      } else {
        // Sign In Flow
        if (lowerEmail.length < 3 || !lowerEmail.includes('@')) {
          setError('Por favor, ingresá un correo electrónico válido.');
          return;
        }
        if (password.length < 4) {
          setError('La contraseña debe tener al menos 4 caracteres.');
          return;
        }

        const allUsers = getRegisteredUsers();
        const matched = allUsers.find(
          (u) => u.email === lowerEmail && u.pass === password
        );

        if (!matched) {
          setError('Credenciales incorrectas o usuario no registrado. Registrate en la pestaña "Registrarse"!');
          return;
        }

        if (matched.role !== role) {
          setError(`Esta cuenta está registrada como ${matched.role === 'customer' ? 'Cliente' : 'Comercio'}. Seleccioná el rol correcto.`);
          return;
        }

        onLogin(role, lowerEmail, matched.name);
      }
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
              {activeTab === 'signin' ? '¡Te damos la bienvenida!' : 'Creá tu cuenta gratis'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-400 font-medium mt-1">
              {activeTab === 'signin' 
                ? 'Encontrá ofertas activas y cupones QR exclusivos en Oberá'
                : 'Registrate para guardar tus cupones y activar descuentos'}
            </p>
          </div>

          {/* SIGN IN VS SIGN UP TABS */}
          <div className="flex border-b border-slate-100 dark:border-zinc-850 mb-5 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('signin');
                setError(null);
              }}
              className={`flex-1 pb-2.5 border-b-2 text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'signin'
                  ? 'border-brand-orange dark:border-indigo-500 text-brand-orange dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setError(null);
              }}
              className={`flex-1 pb-2.5 border-b-2 text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'signup'
                  ? 'border-brand-orange dark:border-indigo-500 text-brand-orange dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Registrarse
            </button>
          </div>

          {/* SPREAD TAB TOGGLE (Customer vs Merchant) */}
          <div className="bg-slate-50 dark:bg-zinc-950 p-1.5 rounded-2xl flex items-center mb-6 border border-slate-100/80 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'customer'
                  ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-sm scale-[1.02]'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
              }`}
            >
              <User className="w-4 h-4" />
              Soy Cliente
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('merchant');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'merchant'
                  ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-sm scale-[1.02]'
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
            {activeTab === 'signup' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  required={activeTab === 'signup'}
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] text-xs cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {activeTab === 'signup' ? 'Creando cuenta...' : 'Iniciando sesión...'}
                </>
              ) : (
                <>
                  {activeTab === 'signup' ? 'Crear mi cuenta' : 'Ingresar'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest Bypass Mode */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800" />
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">O también</span>
            <div className="flex-grow border-t border-slate-100 dark:border-zinc-800" />
          </div>

          <button
            onClick={() => onLogin('visitor')}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-750 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
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
