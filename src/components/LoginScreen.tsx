import React, { useState, useRef } from 'react';
import { 
  User, 
  Store, 
  KeyRound, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  MapPin, 
  Phone, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  ChevronDown, 
  Briefcase
} from 'lucide-react';
import BrandLogo from './BrandLogo';

interface LoginScreenProps {
  onLogin: (role: 'customer' | 'merchant' | 'visitor', email?: string, name?: string) => void;
}

const CATEGORIES = ['Gastronomía', 'Indumentaria', 'Supermercados', 'Electro', 'Otros'];
const ZONES = ['Centro', 'Av. Sarmiento', 'Av. Libertad', 'Av. Italia', 'Plaza San Martín', 'Villa Svea', 'Villa Lutz', 'Villa Barreyro', 'Cien Hectáreas', 'Loma Porá'];
const EMOJI_PRESETS = ['🛍️', '🍔', '🍕', '👚', '🔌', '🛒', '🍦', '🧉', '💈', '💻', '🍰', '🛠️', '🚗', '📚'];

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  
  // Auth basic credentials
  const [name, setName] = useState(''); // Serves as owner name for merchant
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Merchant-specific registration fields
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopCategory, setShopCategory] = useState('Gastronomía');
  const [shopZone, setShopZone] = useState('Centro');
  const [shopLogoEmoji, setShopLogoEmoji] = useState('🛍️');
  const [shopLogoBase64, setShopLogoBase64] = useState<string | null>(null);
  const [logoSelectionType, setLogoSelectionType] = useState<'file' | 'emoji'>('file');
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRegisteredUsers = (): Array<{ email: string; pass: string; name: string; role: 'customer' | 'merchant' }> => {
    const saved = localStorage.getItem('obera_ofertas_registered_users');
    return saved ? JSON.parse(saved) : [];
  };

  const handleLogoFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Por favor, seleccioná un archivo de imagen válido (.png, .jpg, .jpeg, .webp).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen de logo debe ser menor a 2MB para optimizar el almacenamiento.');
      return;
    }
    
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setShopLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const lowerEmail = email.trim().toLowerCase();

    // Basic Validation
    if (lowerEmail.length < 3 || !lowerEmail.includes('@')) {
      setError('Por favor, ingresá un correo electrónico válido.');
      setLoading(false);
      return;
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      setLoading(false);
      return;
    }

    if (activeTab === 'signup') {
      if (!name.trim()) {
        setError(role === 'merchant' ? 'Por favor, ingresá el nombre del propietario.' : 'Por favor, ingresá tu nombre completo.');
        setLoading(false);
        return;
      }

      const users = getRegisteredUsers();
      if (users.some((u) => u.email === lowerEmail)) {
        setError('Este correo electrónico ya está registrado.');
        setLoading(false);
        return;
      }

      // If merchant, we create a business dynamically
      let registeredShopId: string | null = null;
      if (role === 'merchant') {
        if (!shopName.trim()) {
          setError('Por favor, ingresá el nombre de fantasía de tu comercio.');
          setLoading(false);
          return;
        }
        if (!shopAddress.trim()) {
          setError('Por favor, ingresá la dirección física del comercio.');
          setLoading(false);
          return;
        }
        if (!shopPhone.trim()) {
          setError('Por favor, ingresá un número de contacto/WhatsApp válido.');
          setLoading(false);
          return;
        }

        try {
          const shopResponse = await fetch('/api/shops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: shopName.trim(),
              category: shopCategory,
              zone: shopZone,
              logo: logoSelectionType === 'emoji' ? shopLogoEmoji : null,
              address: shopAddress.trim(),
              phone: shopPhone.trim(),
              latitude: -27.4856,
              longitude: -55.1193,
              base64Logo: logoSelectionType === 'file' ? shopLogoBase64 : null
            })
          });

          if (!shopResponse.ok) {
            const errData = await shopResponse.json().catch(() => ({}));
            throw new Error(errData.error || 'Ocurrió un error en el servidor al registrar el comercio.');
          }

          const createdShop = await shopResponse.json();
          registeredShopId = createdShop.id;
          if (registeredShopId) {
            localStorage.setItem('obera_ofertas_my_shop_id', registeredShopId);
          }
        } catch (err: any) {
          setError(`Error al registrar el comercio: ${err.message}`);
          setLoading(false);
          return;
        }
      }

      // Add registered credentials locally
      users.push({
        email: lowerEmail,
        pass: password,
        name: name.trim(),
        role,
      });
      localStorage.setItem('obera_ofertas_registered_users', JSON.stringify(users));

      // Fire global refresh so components pull new shop list from API instantly
      window.dispatchEvent(new CustomEvent('refresh-live-data'));

      setTimeout(() => {
        setLoading(false);
        onLogin(role, lowerEmail, name.trim());
      }, 1000);

    } else {
      // Sign In Flow
      setTimeout(() => {
        setLoading(false);
        const users = getRegisteredUsers();
        
        const matched = users.find(
          (u) => u.email === lowerEmail && u.pass === password
        );

        if (!matched) {
          setError('Credenciales incorrectas o usuario no registrado. Podés registrarte gratis usando la pestaña de arriba.');
          return;
        }

        if (matched.role !== role) {
          setError(`Esta cuenta está registrada como ${matched.role === 'customer' ? 'Cliente' : 'Comercio'}. Seleccioná la pestaña de rol correcta.`);
          return;
        }

        onLogin(role, lowerEmail, matched.name);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Ambience */}
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-brand-orange/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-50px] left-[-50px] w-72 h-72 bg-brand-red/10 dark:bg-purple-500/5 rounded-full blur-3xl" />

      {/* Header APS Logo / Badge */}
      <div className="flex justify-between items-center max-w-lg mx-auto w-full pt-4 z-10">
        <BrandLogo />
        <span className="text-[10px] bg-indigo-50 dark:bg-zinc-800 text-[#5CE1B2] dark:text-[#5CE1B2]/90 font-black px-2.5 py-1 rounded-full border border-indigo-100/50 dark:border-zinc-700">
          APS DEVELOPER PLATFORM
        </span>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg mx-auto my-auto py-6 z-10">
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="font-display font-black text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
              {activeTab === 'signin' 
                ? '¡Te damos la bienvenida!' 
                : role === 'merchant' 
                  ? 'Registrá tu Comercio' 
                  : 'Creá tu Cuenta Gratis'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-400 font-medium mt-1">
              {activeTab === 'signin' 
                ? 'Encontrá ofertas activas y cupones QR exclusivos en Oberá'
                : role === 'merchant'
                  ? 'Publicá tus ofertas y cupones de descuento para toda la ciudad'
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

          {/* ROLE SELECTOR (Customer vs Merchant) */}
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
              <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
              <span className="text-left">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* PROPIETARIO / NOMBRE CLIENTE */}
            {activeTab === 'signup' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  {role === 'merchant' ? 'Nombre del Propietario / Representante' : 'Nombre Completo'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                    required
                  />
                  <User className="absolute left-3.5 top-3 text-slate-400 dark:text-zinc-500 w-4 h-4" />
                </div>
              </div>
            )}

            {/* EMAIL AND PASSWORD (FOR BOTH SIGNIN AND SIGNUP) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* MERCHANT SIGNUP ONLY FIELDS */}
            {activeTab === 'signup' && role === 'merchant' && (
              <div className="space-y-4 pt-2 border-t border-dashed border-slate-150 dark:border-zinc-800">
                <div className="bg-orange-50/50 dark:bg-indigo-950/20 p-3 rounded-2xl border border-orange-100/50 dark:border-indigo-900/10 mb-2">
                  <p className="text-[11px] text-brand-orange dark:text-indigo-400 font-bold flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" /> Información comercial del Negocio
                  </p>
                </div>

                {/* NOMBRE DEL COMERCIO */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                    Nombre del Comercio (Ej. Heladería Polar, Tienda de Ropa)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Yerba Mate & Delicias Misioneras"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                      required={activeTab === 'signup' && role === 'merchant'}
                    />
                    <Store className="absolute left-3.5 top-3 text-slate-400 dark:text-zinc-500 w-4 h-4" />
                  </div>
                </div>

                {/* DIRECCIÓN Y TELÉFONO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                      Dirección del Comercio
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Av. Sarmiento 120, Oberá"
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                        required={activeTab === 'signup' && role === 'merchant'}
                      />
                      <MapPin className="absolute left-3.5 top-3 text-slate-400 dark:text-zinc-500 w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                      Teléfono / WhatsApp de Contacto
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="+54 3755 123456"
                        value={shopPhone}
                        onChange={(e) => setShopPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                        required={activeTab === 'signup' && role === 'merchant'}
                      />
                      <Phone className="absolute left-3.5 top-3 text-slate-400 dark:text-zinc-500 w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* RUBRO Y ZONA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                      Rubro / Categoría
                    </label>
                    <div className="relative">
                      <select
                        value={shopCategory}
                        onChange={(e) => setShopCategory(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-3 text-slate-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                      Zona Comercial
                    </label>
                    <div className="relative">
                      <select
                        value={shopZone}
                        onChange={(e) => setShopZone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:border-brand-orange dark:focus:border-indigo-500 appearance-none cursor-pointer"
                      >
                        {ZONES.map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-3 text-slate-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* LOGO SELECTION AND UPLOAD TYPE */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Logo o Identificación del Comercio
                    </label>
                    <div className="flex bg-slate-100 dark:bg-zinc-950 rounded-lg p-0.5 border border-slate-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setLogoSelectionType('file')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          logoSelectionType === 'file'
                            ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-xs'
                            : 'text-slate-400 dark:text-zinc-500'
                        }`}
                      >
                        Subir Imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoSelectionType('emoji')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          logoSelectionType === 'emoji'
                            ? 'bg-white dark:bg-zinc-900 text-brand-orange dark:text-indigo-400 shadow-xs'
                            : 'text-slate-400 dark:text-zinc-500'
                        }`}
                      >
                        Usar Emoji
                      </button>
                    </div>
                  </div>

                  {logoSelectionType === 'file' ? (
                    /* DRAG AND DROP FILE UPLOADER */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={triggerFileSelect}
                      className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                        isDragOver
                          ? 'border-brand-orange bg-orange-50/20 dark:border-indigo-500 dark:bg-indigo-950/10'
                          : shopLogoBase64
                            ? 'border-emerald-300 bg-emerald-50/10 dark:border-emerald-800'
                            : 'border-slate-200 dark:border-zinc-800 hover:border-brand-orange dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-zinc-950/20'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files && handleLogoFileChange(e.target.files[0])}
                        className="hidden"
                        accept="image/*"
                      />

                      {shopLogoBase64 ? (
                        <div className="flex items-center gap-4 text-left">
                          <img
                            src={shopLogoBase64}
                            alt="Logo preview"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700 shadow-xs shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Imagen cargada con éxito
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Hacé clic o arrastrá para cambiar la imagen</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center text-slate-400 dark:text-zinc-500 shadow-inner">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Arrastrá y soltá tu logo aquí</p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">O hacé clic para explorar tus archivos (.PNG, .JPG)</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* EMOJI PRESET SELECTION GRID */
                    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl p-3">
                      <div className="grid grid-cols-7 gap-2.5 max-w-sm mx-auto">
                        {EMOJI_PRESETS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setShopLogoEmoji(emoji)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer shadow-xs ${
                              shopLogoEmoji === emoji && logoSelectionType === 'emoji'
                                ? 'bg-brand-orange text-white dark:bg-indigo-600 border-2 border-white dark:border-zinc-900 scale-110 shadow-sm'
                                : 'bg-white dark:bg-zinc-900 hover:scale-105 border border-slate-100 dark:border-zinc-800'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] text-xs cursor-pointer mt-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {activeTab === 'signup' ? 'Registrando comercio...' : 'Iniciando sesión...'}
                </>
              ) : (
                <>
                  {activeTab === 'signup' ? 'Completar Registro Gratis' : 'Ingresar'} <ArrowRight className="w-4 h-4" />
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
