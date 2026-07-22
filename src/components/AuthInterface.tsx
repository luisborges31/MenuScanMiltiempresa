/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight, Shield, AlertCircle, 
  Building2, User, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { Business } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthInterfaceProps {
  level: 'saas' | 'merchant' | 'client';
  businesses?: Business[];
  onLogin: (user: { email: string; name: string; provider: 'email' | 'google'; businessId?: string }) => void;
}

export default function AuthInterface({ level, businesses = [], onLogin }: AuthInterfaceProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(businesses[0]?.id || 'biz-burger');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (isSignUp && !name.trim()) {
      setError('Por favor, ingresa tu nombre.');
      return;
    }
    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        if (isSignUp) {
          // Real Supabase Auth SignUp
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name.trim(),
              },
            },
          });

          if (signUpError) {
            setError(signUpError.message || 'Error al registrar usuario en Supabase.');
            return;
          }

          if (data?.session) {
            // Logged in immediately
            const sessionUser = data.user;
            const finalName = sessionUser?.user_metadata?.name || name.trim() || email.split('@')[0];
            
            onLogin({
              email: sessionUser?.email || email,
              name: finalName,
              provider: 'email',
            });
          } else if (data?.user) {
            setSuccessMessage('✨ Registro exitoso. Por favor verifica tu correo electrónico si es requerido.');
          } else {
            setError('No se pudo completar el registro en Supabase.');
            return;
          }
        } else {
          // Real Supabase Auth SignIn
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setError(signInError.message || 'Correo o contraseña incorrectos.');
            return;
          }

          if (!data || !data.user) {
            setError('No se pudo verificar el usuario con Supabase Auth.');
            return;
          }

          const sessionUser = data.user;
          const finalName = sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || name.trim() || 'Usuario';
          
          let finalBizId = undefined;
          if (level === 'merchant') {
            const isSuperUser = email.toLowerCase() === 'admin@menuscan.com' || email.toLowerCase() === 'luisborges31@gmail.com';
            const matchedBiz = businesses.find(b => b.email.toLowerCase() === email.toLowerCase());
            if (!isSuperUser && !matchedBiz) {
              setError('Acceso denegado: Tu usuario de Supabase no está registrado como Kiosco. Registra tu correo en el Super Master.');
              return;
            }
            finalBizId = matchedBiz ? matchedBiz.id : selectedBusiness;
          }

          onLogin({
            email: sessionUser.email || email,
            name: finalName,
            provider: 'email',
            businessId: finalBizId,
          });
        }
      } else {
        // Offline / Simulation fallback mode (solamente cuando Supabase NO está configurado)
        await new Promise((resolve) => setTimeout(resolve, 800));

        let finalName = isSignUp ? name.trim() : email.split('@')[0];
        finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);

        let finalBizId = undefined;
        if (level === 'merchant') {
          const isSuperUser = email.toLowerCase() === 'admin@menuscan.com' || email.toLowerCase() === 'luisborges31@gmail.com';
          const matchedBiz = businesses.find(b => b.email.toLowerCase() === email.toLowerCase());
          if (!isSuperUser && !matchedBiz) {
            setError('Acceso denegado: El correo no coincide con ningún Kiosco Registrado.');
            return;
          }
          finalBizId = matchedBiz ? matchedBiz.id : selectedBusiness;
        }

        onLogin({
          email,
          name: finalName,
          provider: 'email',
          businessId: finalBizId,
        });
      }
    } catch (err: any) {
      console.warn("Error en autenticación:", err);
      setError(err.message || 'Ocurrió un error inesperado al autenticar.');
    } finally {
      setIsLoading(false);
    }
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
          badge: 'Diner Access'
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

      {/* Supabase status indicator */}
      {!isSupabaseConfigured && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-400 leading-normal flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span className="font-bold">Modo de simulación offline:</span> Supabase no está conectado. Puedes ingresar con cualquier email y contraseña para probar el flujo de inmediato.
          </div>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleAuthSubmit} className="space-y-4">
        
        {/* Full Name input for registration */}
        {isSignUp && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Nombre Completo:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none transition-all placeholder:text-slate-600 font-medium"
              />
            </div>
          </div>
        )}

        {/* Business Selector for Merchant (Only on login or signup to map correct store) */}
        {level === 'merchant' && (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Asociar a Sucursal / Kiosco:
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
              className="text-[9px] text-brand-500 hover:underline font-bold flex items-center gap-1"
            >
              {showPassword ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Mostrar
                </>
              )}
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

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-950/20 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Autenticando...
              </span>
            ) : (
              <>
                {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Toggle between login and registration */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-[11px] text-slate-400 hover:text-white hover:underline transition-all font-medium"
            >
              {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
