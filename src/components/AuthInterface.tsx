/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, Shield, CheckCircle, 
  AlertCircle, HelpCircle, Sparkles, Building2, User, Globe
} from 'lucide-react';
import { Business } from '../types';

interface AuthInterfaceProps {
  level: 'saas' | 'merchant' | 'client';
  businesses?: Business[];
  onLogin: (user: { email: string; name: string; provider: 'email' | 'google'; businessId?: string }) => void;
}

export default function AuthInterface({ level, businesses = [], onLogin }: AuthInterfaceProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(businesses[0]?.id || 'biz-burger');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [simulatedGoogleUser, setSimulatedGoogleUser] = useState<string | null>(null);

  // Set default credentials helper
  React.useEffect(() => {
    if (level === 'saas') {
      setEmail('admin@menuscan.com');
      setPassword('admin123');
    } else if (level === 'merchant') {
      const activeBiz = businesses.find(b => b.id === selectedBusiness);
      setEmail(activeBiz?.email || 'contacto@burgerstation.com');
      setPassword('merchant123');
    } else {
      setEmail('cliente@gmail.com');
      setPassword('cliente123');
    }
  }, [level, selectedBusiness, businesses]);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate Supabase/Auth latency
    setTimeout(() => {
      setIsLoading(false);
      let name = 'Usuario';
      
      if (level === 'saas') {
        if (email !== 'admin@menuscan.com' || password !== 'admin123') {
          setError('Credenciales de Super Master inválidas. Usa el usuario de prueba.');
          return;
        }
        name = 'Super Admin';
      } else if (level === 'merchant') {
        const biz = businesses.find(b => b.id === selectedBusiness);
        name = biz ? `Gerente ${biz.name}` : 'Mercante';
      } else {
        name = email.split('@')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }

      onLogin({
        email,
        name,
        provider: 'email',
        businessId: level === 'merchant' ? selectedBusiness : undefined
      });
    }, 1000);
  };

  const handleGoogleLoginClick = () => {
    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = (googleEmail: string, googleName: string) => {
    setIsLoading(true);
    setShowGoogleModal(false);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        email: googleEmail,
        name: googleName,
        provider: 'google',
        businessId: level === 'merchant' ? selectedBusiness : undefined
      });
    }, 1200);
  };

  // Content descriptors based on access level
  const getLevelDetails = () => {
    switch (level) {
      case 'saas':
        return {
          title: 'Panel Super Master Admin',
          subtitle: 'Acceso a la gestión global de franquicias, planes de cobro y base de datos.',
          icon: <Shield className="w-8 h-8 text-indigo-400" />,
          colorClass: 'border-indigo-500/20 shadow-indigo-950/20',
          badge: 'Super Admin Access'
        };
      case 'merchant':
        return {
          title: 'Consola de Administración de Negocio',
          subtitle: 'Gestiona tu menú digital, concilia comandas de pago y audita tu reputación.',
          icon: <Building2 className="w-8 h-8 text-amber-400" />,
          colorClass: 'border-amber-500/20 shadow-amber-950/20',
          badge: 'Merchant Panel Access'
        };
      case 'client':
        return {
          title: 'Acceso Comensal Digital',
          subtitle: 'Inicia sesión para registrar tu orden, reportar pagos y enviar retroalimentación.',
          icon: <User className="w-8 h-8 text-emerald-400" />,
          colorClass: 'border-emerald-500/20 shadow-emerald-950/20',
          badge: 'Diner Simulator Access'
        };
    }
  };

  const details = getLevelDetails();

  return (
    <div className={`w-full max-w-md mx-auto p-6 bg-slate-900/60 border rounded-3xl shadow-xl transition-all ${details.colorClass}`} id={`auth-interface-${level}`}>
      
      {/* Header */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex p-3 bg-slate-950 rounded-2xl border border-slate-800">
          {details.icon}
        </div>
        <div>
          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9px] font-black uppercase text-slate-400 tracking-wider">
            {details.badge}
          </span>
          <h2 className="text-lg font-black text-white mt-1.5 tracking-tight">{details.title}</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mt-1">
            {details.subtitle}
          </p>
        </div>
      </div>

      {/* Auth Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        
        {/* Business Selector for Merchant */}
        {level === 'merchant' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Seleccionar Sucursal / Kiosco:
            </label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none transition-colors"
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>
                  {b.logo} {b.name} ({b.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Correo Electrónico:
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="ejemplo@menuscan.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 font-medium"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Contraseña:
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[9px] text-brand-500 hover:underline font-bold"
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 font-mono"
            />
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Email login button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-950/20 disabled:opacity-50 disabled:pointer-events-none`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Autenticando...
              </span>
            ) : (
              <>
                Ingresar con Correo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center justify-between text-[10px] text-slate-600 font-black uppercase tracking-widest my-2 select-none">
            <div className="h-[1px] bg-slate-800 flex-1"></div>
            <span className="px-3">O ingresar con</span>
            <div className="h-[1px] bg-slate-800 flex-1"></div>
          </div>

          {/* Google login button */}
          <button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-md"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.79 5.79 0 0 1 8.2 12.729a5.79 5.79 0 0 1 5.79-5.786c1.354 0 2.583.479 3.565 1.265l3.1-3.1C18.681 3.324 16.516 2.333 13.99 2.333 8.358 2.333 3.79 6.9 3.79 12.533s4.568 10.2 10.2 10.2c5.88 0 9.775-4.133 9.775-9.941 0-.623-.056-1.18-.156-1.707H12.24z"
              />
            </svg>
            Ingresar con Google
          </button>
        </div>
      </form>

      {/* Helper credentials list to help user evaluate easily */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 text-[10.5px] text-slate-500 space-y-1 bg-slate-950/20 -mx-6 -mb-6 p-4 rounded-b-3xl">
        <div className="font-bold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Credenciales de demostración rápida:
        </div>
        {level === 'saas' && (
          <p className="font-mono">Email: <span className="text-indigo-400">admin@menuscan.com</span> | Pass: <span className="text-indigo-400">admin123</span></p>
        )}
        {level === 'merchant' && (
          <p className="font-mono">Email: <span className="text-amber-400">{businesses.find(b => b.id === selectedBusiness)?.email || 'contacto@burgerstation.com'}</span> | Pass: <span className="text-amber-400 font-bold">merchant123</span></p>
        )}
        {level === 'client' && (
          <p className="font-mono">Email: <span className="text-emerald-400">cliente@gmail.com</span> | Pass: <span className="text-emerald-400">cliente123</span></p>
        )}
      </div>

      {/* GOOGLE SIGN IN SIMULATOR DIALOG POPUP */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col">
            
            {/* Google Identity branding */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09a7.11 7.11 0 0 1 0-4.18V7.07H2.18a11.99 11.99 0 0 0 0 10.86l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-xs font-bold text-slate-700 tracking-tight">Acceder con Google</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-extrabold text-slate-800">Elige una cuenta</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">para continuar en <span className="font-bold text-slate-700">MenuScan.com</span></p>
              </div>

              {/* Account list */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                
                {level === 'saas' && (
                  <button
                    type="button"
                    onClick={() => handleSelectGoogleAccount('luisborges31@gmail.com', 'Luis Borges')}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                      LB
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-900 transition-colors">Luis Borges</p>
                      <p className="text-[10px] text-slate-500 truncate">luisborges31@gmail.com</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0">Dueño</span>
                  </button>
                )}

                {level === 'merchant' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectGoogleAccount('gerente.burger@gmail.com', 'Carlos Gómez (Burger Station)')}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-extrabold flex items-center justify-center text-xs">
                        CG
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-extrabold text-slate-800 group-hover:text-amber-900 transition-colors">Carlos Gómez</p>
                        <p className="text-[10px] text-slate-500 truncate">gerente.burger@gmail.com</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectGoogleAccount('admin.pizza@gmail.com', 'Giovanna Rossi (Bella Italia)')}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center text-xs">
                        GR
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-xs font-extrabold text-slate-800 group-hover:text-amber-900">Giovanna Rossi</p>
                        <p className="text-[10px] text-slate-500 truncate">admin.pizza@gmail.com</p>
                      </div>
                    </button>
                  </>
                )}

                {/* Default client or standard user option */}
                <button
                  type="button"
                  onClick={() => handleSelectGoogleAccount('lucia.fer@outlook.com', 'Lucía Fernández')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                    LF
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-900 transition-colors">Lucía Fernández</p>
                    <p className="text-[10px] text-slate-500 truncate">lucia.fer@outlook.com</p>
                  </div>
                  {level === 'client' && (
                    <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0">Reciente</span>
                  )}
                </button>

                {/* Custom input simulator */}
                <div className="border-t border-slate-100 pt-2.5 mt-1">
                  <input
                    type="email"
                    placeholder="Usar otra cuenta de Google (simular)..."
                    onChange={(e) => setSimulatedGoogleUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-lg p-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors mb-2"
                  />
                  {simulatedGoogleUser && simulatedGoogleUser.includes('@') && (
                    <button
                      type="button"
                      onClick={() => handleSelectGoogleAccount(simulatedGoogleUser, simulatedGoogleUser.split('@')[0])}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      Continuar con {simulatedGoogleUser}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>

              <p className="text-[10px] text-slate-400 leading-normal text-center mt-2 select-none">
                Para continuar, Google compartirá tu nombre, dirección de correo electrónico, foto de perfil y preferencia de idioma con MenuScan.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
