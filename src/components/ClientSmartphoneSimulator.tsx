/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingCart, MapPin, CreditCard, ChevronLeft, Star, 
  User, Plus, Minus, ArrowLeft, Clock, Utensils, Sparkles, AlertOctagon, MessageSquare, Mail
} from 'lucide-react';
import { Business, MenuItem, Order, OrderItem } from '../types';

interface ClientSmartphoneSimulatorProps {
  businesses: Business[];
  activeClientId: string;
  menus: MenuItem[];
  orders: Order[];
  cart: OrderItem[];
  clientStep: 'menu' | 'cart' | 'checkout' | 'payment' | 'tracking' | 'feedback' | 'add-business';
  clientOrderType: 'Mesa' | 'Delivery';
  clientTable: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientNotes: string;
  currentActiveOrderId: string | null;
  ratingFood: number;
  ratingService: number;
  
  onAddToCart: (id: number) => void;
  onDecreaseCart: (id: number) => void;
  onSetClientStep: (step: 'menu' | 'cart' | 'checkout' | 'payment' | 'tracking' | 'feedback' | 'add-business') => void;
  onSetOrderType: (type: 'Mesa' | 'Delivery') => void;
  onSetClientData: (data: Partial<{
    clientNotes: string;
    clientTable: string;
    clientAddress: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    ratingFood: number;
    ratingService: number;
  }>) => void;
  onSubmitOrder: () => void;
  onSubmitPayment: (method: string, sender: string, reference: string) => void;
  onSubmitFeedback: (comment: string) => void;
  onRegisterBusiness: (name: string, email: string, emoji: string, tier: 'free' | 'premium') => void;
  onSelectClientBusiness: (id: string) => void;
  triggerToast: (text: string) => void;
}

export default function ClientSmartphoneSimulator({
  businesses,
  activeClientId,
  menus,
  orders,
  cart,
  clientStep,
  clientOrderType,
  clientTable,
  clientName,
  clientPhone,
  clientEmail,
  clientAddress,
  clientNotes,
  currentActiveOrderId,
  ratingFood,
  ratingService,
  onAddToCart,
  onDecreaseCart,
  onSetClientStep,
  onSetOrderType,
  onSetClientData,
  onSubmitOrder,
  onSubmitPayment,
  onSubmitFeedback,
  onRegisterBusiness,
  onSelectClientBusiness,
  triggerToast
}: ClientSmartphoneSimulatorProps) {
  const [payMethod, setPayMethod] = useState('Transferencia');
  const [paySender, setPaySender] = useState('');
  const [payReference, setPayReference] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  // Quick business onboarding state
  const [obName, setObName] = useState('');
  const [obEmail, setObEmail] = useState('');
  const [obEmoji, setObEmoji] = useState('🍣');
  const [obTier, setObTier] = useState<'free' | 'premium'>('premium');

  // Find business
  const biz = businesses.find(b => b.id === activeClientId) || businesses[0];
  if (!biz) return <div className="p-4 text-center text-xs">Cargando tienda simulada...</div>;

  const isSuspended = biz.status === 'suspended';

  // Math
  const cartQty = cart.reduce((sum, it) => sum + it.qty, 0);
  const subtotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
  const deliveryFee = clientOrderType === 'Delivery' ? (biz.deliveryFee ?? 2.00) : 0;
  const total = subtotal + deliveryFee;

  // Filter products
  const isolatedMenu = menus.filter(m => m.businessId === biz.id);

  const handleRegisterOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obName.trim() || !obEmail.trim()) {
      triggerToast("⚠️ Rellena todos los campos.");
      return;
    }
    onRegisterBusiness(obName, obEmail, obEmoji, obTier);
    setObName('');
    setObEmail('');
  };

  const handleOrderSubmit = () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      triggerToast("⚠️ Nombre y teléfono son obligatorios.");
      return;
    }
    onSubmitOrder();
  };

  const handlePaymentSubmit = () => {
    if (payMethod !== 'Efectivo' && (!paySender.trim() || !payReference.trim())) {
      triggerToast("⚠️ Envía titular y referencia del pago.");
      return;
    }
    onSubmitPayment(payMethod, paySender, payReference);
    setPaySender('');
    setPayReference('');
  };

  const handleFeedbackSubmit = () => {
    onSubmitFeedback(feedbackText);
    setFeedbackText('');
  };

  return (
    <div className="w-full max-w-[340px] bg-white rounded-[32px] min-h-[560px] max-h-[600px] overflow-y-auto no-scrollbar relative flex flex-col text-slate-800 shadow-inner">
      
      {/* PHONE APP BAR / BRAND HEADER */}
      {!isSuspended && clientStep !== 'add-business' && (
        <div className="bg-white border-b border-slate-100 p-3 pb-2 sticky top-0 z-20 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm shrink-0">
                {biz.logo}
              </span>
              <div className="min-w-0">
                <h3 className="text-[11px] font-black text-slate-950 truncate leading-tight">{biz.name}</h3>
                <p className="text-[8px] text-emerald-600 flex items-center gap-0.5 font-bold">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                  Abierto • Auto-QR
                </p>
              </div>
            </div>

            {/* Float cart indicator */}
            {clientStep === 'menu' && cartQty > 0 && (
              <button 
                onClick={() => onSetClientStep('cart')}
                className="relative bg-slate-950 text-white p-1.5 rounded-full hover:bg-brand-500 hover:text-white shadow-md flex items-center justify-center transition-all scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 bg-brand-500 text-slate-950 font-black text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                  {cartQty}
                </span>
              </button>
            )}
          </div>

          {/* Quick inline context dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
            <select 
              value={biz.id}
              onChange={(e) => onSelectClientBusiness(e.target.value)}
              className="flex-1 bg-transparent text-[9px] font-bold text-slate-700 outline-none border-none py-0.5"
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.logo} {b.name}</option>
              ))}
            </select>
            <button 
              onClick={() => onSetClientStep('add-business')}
              className="bg-slate-950 hover:bg-brand-600 text-white p-1 rounded flex items-center justify-center w-5 h-5 shadow"
              title="Registrar nuevo negocio"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CORE DEVICE CONTENT ROUTING */}
      {isSuspended ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <AlertOctagon className="w-12 h-12 text-rose-500 animate-bounce" />
          <h4 className="text-sm font-bold text-slate-900 mt-2">Kiosco Suspendido</h4>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            El acceso de esta sucursal ha sido inhabilitado temporalmente por el Administrador de la plataforma SaaS debido a una revisión de su cuenta.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          
          {/* STEP A: MAIN CATALOG MENU */}
          {clientStep === 'menu' && (
            <div className="flex-1 p-3 bg-slate-50 space-y-4">
              {/* Dine-in Table selection switch */}
              <div className="grid grid-cols-2 gap-1 bg-slate-200 p-0.5 rounded-lg">
                <button 
                  onClick={() => onSetOrderType('Mesa')}
                  className={`py-1 rounded text-[9px] font-bold transition-all ${clientOrderType === 'Mesa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  🍽️ En Mesa
                </button>
                <button 
                  onClick={() => onSetOrderType('Delivery')}
                  className={`py-1 rounded text-[9px] font-bold transition-all ${clientOrderType === 'Delivery' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Delivery ($2.0)
                </button>
              </div>

              {/* Menu items stack */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Menú del Día</span>
                {isolatedMenu.length === 0 ? (
                  <p className="text-slate-400 text-[11px] text-center py-8 italic bg-white border border-slate-100 rounded-xl">No hay platos disponibles en este momento.</p>
                ) : (
                  isolatedMenu.map((item) => (
                    <div 
                      key={item.id} 
                      className={`bg-white p-2 rounded-xl border border-slate-100 flex gap-2.5 transition-all ${!item.available ? 'opacity-40' : 'hover:border-slate-200'}`}
                    >
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0"
                          onError={(e) => {
                            (e.target as any).src = 'https://placehold.co/100x100?text=Food';
                          }}
                        />
                      ) : (
                        <span className="text-2xl bg-slate-50 w-14 h-14 rounded-lg flex items-center justify-center border border-slate-100 shrink-0 select-none">
                          {item.emoji}
                        </span>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-[11px] font-extrabold text-slate-900 truncate leading-tight">{item.name}</h4>
                            <span className="text-[11px] font-black text-brand-600 shrink-0">${item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 line-clamp-2 leading-snug">{item.description}</p>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{item.category}</span>
                          {(() => {
                            const cartItem = cart.find(c => c.id === item.id);
                            const itemQty = cartItem ? cartItem.qty : 0;
                            return item.available ? (
                              <button 
                                onClick={() => onAddToCart(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1 group"
                              >
                                <Plus className="w-3 h-3 text-emerald-200 group-hover:text-white transition-colors" />
                                <span>{itemQty > 0 ? `Agregar (${itemQty})` : 'Agregar'}</span>
                              </button>
                            ) : (
                              <span className="text-[8px] text-rose-500 font-extrabold uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Agotado</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP B: QUICK ONBOARDING FROM CLIENT */}
          {clientStep === 'add-business' && (
            <div className="flex-1 p-3.5 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onSetClientStep('menu')} className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-black text-slate-900 uppercase">Onboarding de Kiosco</h3>
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  Crea tu propio restaurante y pruébalo de inmediato en el simulador multiempresa.
                </p>

                <form onSubmit={handleRegisterOnboarding} className="space-y-3">
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Nombre Comercial</label>
                    <input 
                      type="text" 
                      value={obName}
                      onChange={(e) => setObName(e.target.value)}
                      placeholder="Ej. Sushi Club" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none focus:border-brand-500 text-slate-800 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Email Propietario</label>
                    <input 
                      type="email" 
                      value={obEmail}
                      onChange={(e) => setObEmail(e.target.value)}
                      placeholder="pro@sushiclub.com" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none focus:border-brand-500 text-slate-800"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Estilo (Emoji)</label>
                      <select 
                        value={obEmoji}
                        onChange={(e) => setObEmoji(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none text-slate-800"
                      >
                        <option value="🍣">🍣 Sushi</option>
                        <option value="🍕">🍕 Pizza</option>
                        <option value="🍔">🍔 Burger</option>
                        <option value="🌮">🌮 Tacos</option>
                        <option value="🍰">🍰 Pastelería</option>
                        <option value="☕">☕ Café</option>
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[8px] font-bold text-slate-400 uppercase">Licencia Plan</label>
                      <select 
                        value={obTier}
                        onChange={(e) => setObTier(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none text-slate-800"
                      >
                        <option value="premium">🏆 Premium</option>
                        <option value="free">Estándar</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-brand-500 hover:text-slate-950 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-md mt-2"
                  >
                    Crear & Autologin 🚀
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP C: CART LIST */}
          {clientStep === 'cart' && (
            <div className="flex-1 p-3 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onSetClientStep('menu')} className="text-slate-400 hover:text-slate-900">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-black text-slate-900 uppercase">Carrito ({cartQty})</h3>
                </div>

                {/* Prep notes */}
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  <label className="block text-[8px] font-black text-amber-800 uppercase mb-0.5">📝 ¿Instrucciones especiales?</label>
                  <textarea 
                    value={clientNotes}
                    onChange={(e) => onSetClientData({ clientNotes: e.target.value })}
                    placeholder="Ej. Sin aderezos, pan bien tostado, cebolla aparte..." 
                    rows={2} 
                    className="w-full p-2 rounded border border-amber-200 text-xs focus:ring-1 focus:ring-amber-500 outline-none bg-white resize-none text-slate-800"
                  ></textarea>
                </div>

                {/* Items stack */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto no-scrollbar">
                  {cart.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-6 italic">Carrito vacío. Regresa al menú.</p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base bg-slate-50 w-7 h-7 rounded flex items-center justify-center border border-slate-100 shrink-0">{item.emoji}</span>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{item.name}</h4>
                            <p className="text-[9px] text-slate-500 font-semibold">${item.price.toFixed(2)} c/u</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button 
                            onClick={() => onDecreaseCart(item.id)} 
                            className="w-5 h-5 bg-white hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold text-xs shadow-xs transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-black px-1.5 text-slate-900">{item.qty}</span>
                          <button 
                            onClick={() => onAddToCart(item.id)} 
                            className="w-5 h-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center justify-center font-bold text-xs shadow-xs transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total calculations */}
              <div className="border-t border-slate-200 pt-3">
                <div className="space-y-1 text-[11px] text-slate-500 mb-3 font-medium">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  {clientOrderType === 'Delivery' && (
                    <div className="flex justify-between text-indigo-500 font-bold"><span>Delivery</span><span>${(biz.deliveryFee ?? 2.00).toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 border-t border-dashed border-slate-200 pt-1.5 text-xs">
                    <span>Total de la Comanda</span>
                    <span className="text-brand-600">${total.toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => onSetClientStep('checkout')}
                  disabled={cart.length === 0}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${cart.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-950 hover:bg-slate-900 text-white hover:scale-[1.01]'}`}
                >
                  Continuar con el Pedido →
                </button>
              </div>
            </div>
          )}

          {/* STEP D: CHECKOUT DATA */}
          {clientStep === 'checkout' && (
            <div className="flex-1 p-3 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onSetClientStep('cart')} className="text-slate-400 hover:text-slate-900">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-xs font-black text-slate-900 uppercase">Tus Datos</h3>
                </div>

                {clientEmail ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fade-in">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sesión Activa
                      </p>
                      <p className="text-[10px] font-extrabold text-slate-800 truncate leading-tight">{clientName}</p>
                      <p className="text-[8px] text-slate-500 truncate mt-0.5">{clientEmail}</p>
                    </div>
                    <button
                      onClick={() => {
                        onSetClientData({
                          clientName: '',
                          clientEmail: '',
                          clientPhone: ''
                        });
                        triggerToast("Sesión de comensal cerrada.");
                      }}
                      className="text-[8px] bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold px-1.5 py-1 rounded transition-colors shrink-0"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl space-y-1.5 shadow-sm">
                    <p className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Accede rápido con tu cuenta:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button 
                        onClick={() => {
                          onSetClientData({
                            clientName: "Lucía Fernández",
                            clientEmail: "lucia.fer@outlook.com",
                            clientPhone: "+54 9 11 3211-9988"
                          });
                          triggerToast("🟢 Sesión de Google sincronizada.");
                        }}
                        className="bg-white border border-slate-200 hover:border-slate-300 p-1.5 rounded-lg text-[8.5px] font-bold text-slate-700 flex items-center justify-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <svg className="w-3 h-3 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.79 5.79 0 0 1 8.2 12.729a5.79 5.79 0 0 1 5.79-5.786c1.354 0 2.583.479 3.565 1.265l3.1-3.1C18.681 3.324 16.516 2.333 13.99 2.333 8.358 2.333 3.79 6.9 3.79 12.533s4.568 10.2 10.2 10.2c5.88 0 9.775-4.133 9.775-9.941 0-.623-.056-1.18-.156-1.707H12.24z" />
                        </svg>
                        Google Login
                      </button>
                      <button 
                        onClick={() => {
                          onSetClientData({
                            clientName: "Andrés Silva",
                            clientEmail: "andres.silva@gmail.com",
                            clientPhone: "+54 9 11 9876-5432"
                          });
                          triggerToast("🟢 Sesión de correo iniciada.");
                        }}
                        className="bg-white border border-slate-200 hover:border-slate-300 p-1.5 rounded-lg text-[8.5px] font-bold text-slate-700 flex items-center justify-center gap-1 shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                        Email Login
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={clientName}
                      onChange={(e) => onSetClientData({ clientName: e.target.value })}
                      placeholder="Andrés Silva" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none focus:border-brand-500 text-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Teléfono (WhatsApp)</label>
                    <input 
                      type="tel" 
                      value={clientPhone}
                      onChange={(e) => onSetClientData({ clientPhone: e.target.value })}
                      placeholder="+54 9 11 1234-5678" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none focus:border-brand-500 text-slate-800"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Correo (Promociones)</label>
                    <input 
                      type="email" 
                      value={clientEmail}
                      onChange={(e) => onSetClientData({ clientEmail: e.target.value })}
                      placeholder="andres@email.com" 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none focus:border-brand-500 text-slate-800"
                    />
                  </div>

                  {/* Mesa Selection vs Delivery Address */}
                  {clientOrderType === 'Mesa' ? (
                    <div className="space-y-0.5">
                      <label className="block text-[8px] font-black text-slate-400 uppercase">Mesa</label>
                      <select 
                        value={clientTable}
                        onChange={(e) => onSetClientData({ clientTable: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none text-slate-800 font-bold"
                      >
                        <option value="Mesa 1">Mesa 1</option>
                        <option value="Mesa 2">Mesa 2</option>
                        <option value="Mesa 3">Mesa 3</option>
                        <option value="Barra 1">Barra 1</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <label className="block text-[8px] font-black text-slate-400 uppercase">Dirección de Entrega</label>
                      <textarea 
                        value={clientAddress}
                        onChange={(e) => onSetClientData({ clientAddress: e.target.value })}
                        placeholder="Calle, Número, Referencia o Casa..." 
                        rows={2} 
                        className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none resize-none text-slate-800"
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleOrderSubmit}
                className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 py-2.5 rounded-xl text-xs font-black shadow-md mt-4 transition-transform hover:scale-[1.01]"
              >
                Enviar Comanda a Cocina 🚀
              </button>
            </div>
          )}

          {/* STEP E: SUBMIT PAYMENT COMUNIDAD */}
          {clientStep === 'payment' && (
            <div className="flex-1 p-3 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-[11px] leading-relaxed text-indigo-700">
                  <strong className="text-indigo-900 flex items-center gap-1 mb-0.5"><CreditCard className="w-4 h-4" /> Reporta tu Pago Digital</strong>
                  Envía tu transferencia o Pago móvil de inmediato para agilizar el despacho y reporta la referencia de caja.
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-0.5">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Forma de Pago</label>
                    <select 
                      value={payMethod} 
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none text-slate-800"
                    >
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Pago móvil">Pago móvil</option>
                      <option value="Efectivo">Efectivo contra entrega</option>
                    </select>
                  </div>

                  {payMethod !== 'Efectivo' && (
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">
                          {payMethod === 'Pago móvil' ? 'Teléfono Remitente' : 'Titular / Emisor'}
                        </label>
                        <input 
                          type="text" 
                          value={paySender}
                          onChange={(e) => setPaySender(e.target.value)}
                          placeholder="Andrés Silva" 
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none text-slate-800"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Referencia / ID Operación</label>
                        <input 
                          type="text" 
                          value={payReference}
                          onChange={(e) => setPayReference(e.target.value)}
                          placeholder="TX-22918" 
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none text-slate-800 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handlePaymentSubmit}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all mt-4"
              >
                Enviar Reporte & Monitorear
              </button>
            </div>
          )}

          {/* STEP F: TRACKING SCREEN */}
          {clientStep === 'tracking' && (
            <div className="flex-1 p-3 bg-slate-50 flex flex-col justify-between">
              {(() => {
                const order = orders.find(o => o.id === currentActiveOrderId);
                if (!order) {
                  return <p className="text-xs text-slate-400 text-center py-8">Cargando comanda...</p>;
                }

                let headerText = "Cocina preparando tu comida";
                if (order.status === 'En Camino') {
                  headerText = order.type === 'Delivery' ? "🛵 ¡Tu repartidor va en camino!" : "🍽️ ¡Tu pedido fue servido!";
                } else if (order.status === 'Entregado') {
                  headerText = "🎉 ¡Pedido entregado con éxito!";
                }

                const line1 = 'bg-brand-500';
                const line2 = order.status !== 'Preparando' ? 'bg-brand-500' : 'bg-slate-200';
                const line3 = order.status === 'Entregado' ? 'bg-brand-500' : 'bg-slate-200';

                return (
                  <div className="space-y-4">
                    <div className="text-center py-1">
                      <span className="bg-brand-100 text-brand-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        ID: {order.id}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 mt-2">{headerText}</h4>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-5 space-y-4 border-l-2 border-slate-200 ml-2 py-1">
                      <div className="relative">
                        <div className={`absolute -left-[24px] top-0.5 w-2.5 h-2.5 rounded-full border border-white ${line1}`}></div>
                        <h5 className="text-[10px] font-bold text-slate-900">Enviado a Cocina</h5>
                        <p className="text-[8px] text-slate-400">Ingresado a las {order.timestamp}</p>
                      </div>
                      <div className="relative">
                        <div className={`absolute -left-[24px] top-0.5 w-2.5 h-2.5 rounded-full border border-white ${line2}`}></div>
                        <h5 className="text-[10px] font-bold text-slate-900">
                          {order.type === 'Delivery' ? 'En Camino' : 'Despachado a la Mesa'}
                        </h5>
                        <p className="text-[8px] text-slate-400">Control de calidad e higiene listo.</p>
                      </div>
                      <div className="relative">
                        <div className={`absolute -left-[24px] top-0.5 w-2.5 h-2.5 rounded-full border border-white ${line3}`}></div>
                        <h5 className="text-[10px] font-bold text-slate-900">Entregado</h5>
                        <p className="text-[8px] text-slate-400">¡Que disfrutes tu comanda!</p>
                      </div>
                    </div>

                    {/* Bank audit box */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1 shadow-sm text-[10px] text-slate-500">
                      <span className="font-bold text-slate-400 uppercase text-[8px] block tracking-wider">Caja & Liquidación</span>
                      <div className="flex justify-between items-center">
                        <span>Total: <strong>${order.total.toFixed(2)}</strong></span>
                        <span className="font-extrabold text-slate-700">{order.payment.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button 
                onClick={() => onSetClientStep('feedback')}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold transition-all mt-4"
              >
                Calificar Kiosco ⭐
              </button>
            </div>
          )}

          {/* STEP G: COMMENT & STARS QUALITY FEEDBACK */}
          {clientStep === 'feedback' && (
            <div className="flex-1 p-3.5 bg-slate-50 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500 mx-auto" />
                  <h4 className="text-xs font-extrabold text-slate-900">¿Qué tal estuvo tu comanda?</h4>
                  <p className="text-[9px] text-slate-400 leading-tight">Valoramos tu calificación para mejorar el servicio local.</p>
                </div>

                <div className="space-y-3">
                  {/* Food stars */}
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Calidad de los Alimentos</span>
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starNum = i + 1;
                        return (
                          <button 
                            key={i} 
                            onClick={() => onSetClientData({ ratingFood: starNum })}
                            className="text-base text-amber-500 hover:scale-110"
                          >
                            {ratingFood >= starNum ? '★' : '☆'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Speed stars */}
                  <div className="text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Velocidad de Preparación</span>
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starNum = i + 1;
                        return (
                          <button 
                            key={i} 
                            onClick={() => onSetClientData({ ratingService: starNum })}
                            className="text-base text-amber-500 hover:scale-110"
                          >
                            {ratingService >= starNum ? '★' : '☆'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Tus Comentarios</label>
                    <textarea 
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Escribe opiniones honestas..." 
                      rows={3} 
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs outline-none resize-none text-slate-800"
                    ></textarea>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleFeedbackSubmit}
                className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 py-2.5 rounded-xl text-xs font-black shadow-md mt-4"
              >
                Enviar Comentarios ✅
              </button>
            </div>
          )}

        </div>
      )}

      {/* FOOTER TAB NAV BAR */}
      {!isSuspended && clientStep !== 'add-business' && (
        <div className="bg-white border-t border-slate-100 p-3 flex justify-around text-slate-400 text-xs mt-auto rounded-b-[32px] select-none shadow-inner shrink-0">
          <button 
            onClick={() => onSetClientStep('menu')} 
            className={`flex flex-col items-center gap-0.5 ${clientStep === 'menu' ? 'text-brand-600 font-extrabold' : 'hover:text-slate-600'}`}
          >
            <Utensils className="w-4 h-4" />
            <span className="text-[8px]">Carta</span>
          </button>
          <button 
            onClick={() => onSetClientStep('cart')} 
            className={`flex flex-col items-center gap-0.5 ${clientStep === 'cart' ? 'text-brand-600 font-extrabold' : 'hover:text-slate-600'}`}
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartQty > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-brand-500 text-slate-950 text-[7px] font-black rounded-full w-3 h-3 flex items-center justify-center">
                  {cartQty}
                </span>
              )}
            </div>
            <span className="text-[8px]">Comanda</span>
          </button>
          <button 
            onClick={() => {
              if (currentActiveOrderId) {
                onSetClientStep('tracking');
              } else {
                triggerToast("⚠️ Envía una comanda primero.");
              }
            }} 
            className={`flex flex-col items-center gap-0.5 ${clientStep === 'tracking' ? 'text-brand-600 font-extrabold' : 'hover:text-slate-600'}`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[8px]">Seguimiento</span>
          </button>
        </div>
      )}

    </div>
  );
}
