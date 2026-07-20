/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Building2, Store, Smartphone, 
  Terminal, Database, HelpCircle, RefreshCw, Zap, Bell, CheckCircle
} from 'lucide-react';

import { Business, MenuItem, Order, OrderItem, Review, SystemLog } from './types';
import SaaSAdminPanel from './components/SaaSAdminPanel';
import MerchantPanel from './components/MerchantPanel';
import ClientSmartphoneSimulator from './components/ClientSmartphoneSimulator';
import SupabaseAuditConsole from './components/SupabaseAuditConsole';

// Seed Businesses
const DEFAULT_BUSINESSES: Business[] = [
  { id: "biz-burger", name: "Burger Station", logo: "🍔", tier: "premium", status: "active", email: "contacto@burgerstation.com" },
  { id: "biz-pizza", name: "Bella Italia Pizza", logo: "🍕", tier: "premium", status: "active", email: "info@bellaitaliapizza.com" },
  { id: "biz-cafe", name: "La Cafetería del Barrio", logo: "☕", tier: "free", status: "active", email: "cafecito@barrio.com" },
  { id: "biz-tacos", name: "Tacoteca Express", logo: "🌮", tier: "premium", status: "suspended", email: "pagos@tacoteca.com" }
];

// Seed Menus isolated by businessId
const DEFAULT_MENUS: MenuItem[] = [
  // Burger Station
  { id: 101, businessId: "biz-burger", name: "Smash Burger Extra Quesera", price: 9.50, description: "Doble carne de 100g smash, queso cheddar americano derretido, salsa secreta de la casa en pan brioche de papa tostado.", category: "Platos", emoji: "🍔", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", available: true },
  { id: 102, businessId: "biz-burger", name: "Papas Rústicas de la Estación", price: 4.00, description: "Papas cortadas a mano con piel, fritas dos veces para máxima textura crujiente y condimentadas con sal de hierbas y pimentón.", category: "Acompañantes", emoji: "🍟", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", available: true },
  { id: 103, businessId: "biz-burger", name: "Milkshake de Oreo Premium", price: 4.80, description: "Crema helada batida con galletas Oreo trituradas, coronado con crema batida casera y un toque de sirope de chocolate.", category: "Bebidas", emoji: "🥤", image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80", available: true },
  
  // Bella Italia Pizza
  { id: 201, businessId: "biz-pizza", name: "Pizza Napolitana Clásica", price: 12.50, description: "Salsa marinara de tomates San Marzano, queso mozzarella fior di latte fresco, hojas de albahaca dulce y un toque de aceite de oliva.", category: "Platos", emoji: "🍕", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", available: true },
  { id: 202, businessId: "biz-pizza", name: "Pan de Ajo Crujiente", price: 4.50, description: "Bastones de masa de masa madre untados con mantequilla batida de ajo asado, parmesano de 12 meses de maduración y orégano.", category: "Acompañantes", emoji: "🥖", image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=600&q=80", available: true },

  // La Cafetería del Barrio (Free - Emoji only, no photos allowed)
  { id: 301, businessId: "biz-cafe", name: "Café Latte de Especialidad", price: 2.80, description: "Doble shot de expresso de grano origen colombiano con leche emulsionada sedosa y un arte latte personalizado.", category: "Bebidas", emoji: "☕", image: "", available: true },
  { id: 302, businessId: "biz-cafe", name: "Medialunas Calientes (x3)", price: 1.50, description: "Auténticas medialunas de mantequilla, horneadas frescas cada mañana y pintadas con un suave almíbar de cítricos.", category: "Acompañantes", emoji: "🥐", image: "", available: true }
];

// Seed Orders isolated by businessId
const DEFAULT_ORDERS: Order[] = [
  {
    id: "MS-4412",
    businessId: "biz-burger",
    customer: "Marcos Del Río",
    email: "marcos@gmail.com",
    type: "Delivery",
    address: "Calle Falsa 123, Depto 4B",
    tableNum: null,
    phone: "+54 9 11 5555-1212",
    notes: "Por favor que la hamburguesa sea sin aderezos.",
    items: [{ id: 101, name: "Smash Burger Extra Quesera", price: 9.50, qty: 1, emoji: "🍔" }],
    subtotal: 9.50,
    deliveryFee: 2.00,
    total: 11.50,
    status: "Preparando",
    payment: { method: "Transferencia", sender: "Marcos Del Rio", reference: "TX-9981", amount: 11.50, status: "Por Conciliar", timestamp: "08:15" },
    timestamp: "08:15",
    date: "2026-07-20"
  },
  {
    id: "MS-8811",
    businessId: "biz-pizza",
    customer: "Lucía Fernández",
    email: "lucia.fer@outlook.com",
    type: "Mesa",
    tableNum: "Mesa 3",
    address: null,
    phone: "+54 9 11 3211-9988",
    notes: "Traer platos para compartir por favor.",
    items: [{ id: 201, name: "Pizza Napolitana Clásica", price: 12.50, qty: 2, emoji: "🍕" }],
    subtotal: 25.00,
    deliveryFee: 0,
    total: 25.00,
    status: "Entregado",
    payment: { method: "Efectivo", sender: "Lucía", reference: "CASH", amount: 25.00, status: "Conciliado", timestamp: "07:45" },
    timestamp: "07:45",
    date: "2026-07-20"
  }
];

// Seed Reviews isolated by businessId
const DEFAULT_REVIEWS: Review[] = [
  { id: 1, businessId: "biz-burger", orderId: "MS-4412", customer: "Marcos Del Río", foodRating: 5, serviceRating: 4, comment: "La smash burger es un espectáculo. Excelente punto de la carne." }
];

// System Logs for Super Admin Dashboard
const DEFAULT_LOGS: SystemLog[] = [
  { timestamp: "08:45", event: "Sistema multiempresa inicializado.", type: "system" },
  { timestamp: "08:46", event: "Negocio Premium 'Burger Station' verificado.", type: "auth" },
  { timestamp: "08:47", event: "Pago verificado automáticamente por webhook simulado.", type: "billing" }
];

export default function App() {
  // Sync state with LocalStorage
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem('menuscan_saas_businesses');
    return saved ? JSON.parse(saved) : DEFAULT_BUSINESSES;
  });

  const [menus, setMenus] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('menuscan_saas_menus');
    return saved ? JSON.parse(saved) : DEFAULT_MENUS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('menuscan_saas_orders');
    return saved ? JSON.parse(saved) : DEFAULT_ORDERS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('menuscan_saas_reviews');
    return saved ? JSON.parse(saved) : DEFAULT_REVIEWS;
  });

  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('menuscan_saas_logs');
    return saved ? JSON.parse(saved) : DEFAULT_LOGS;
  });

  // Navigation states
  const [currentView, setCurrentView] = useState<'supabase-audit' | 'saas' | 'merchant' | 'client'>('supabase-audit');
  const [activeMerchantId, setActiveMerchantId] = useState<string>('biz-burger');
  const [activeClientId, setActiveClientId] = useState<string>('biz-burger');

  // Client Smartphone Simulator specific states
  const [clientStep, setClientStep] = useState<'menu' | 'cart' | 'checkout' | 'payment' | 'tracking' | 'feedback' | 'add-business'>('menu');
  const [clientOrderType, setClientOrderType] = useState<'Mesa' | 'Delivery'>('Mesa');
  const [clientTable, setClientTable] = useState('Mesa 1');
  const [clientAddress, setClientAddress] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [currentActiveOrderId, setCurrentActiveOrderId] = useState<string | null>(null);
  const [ratingFood, setRatingFood] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Simulation feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Write state changes to localStorage
  useEffect(() => {
    localStorage.setItem('menuscan_saas_businesses', JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem('menuscan_saas_menus', JSON.stringify(menus));
  }, [menus]);

  useEffect(() => {
    localStorage.setItem('menuscan_saas_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('menuscan_saas_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('menuscan_saas_logs', JSON.stringify(logs));
  }, [logs]);

  // Utility to fire notification toasts
  const triggerToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Utility to push server logs
  const addLog = (event: string, type: 'system' | 'auth' | 'billing' | 'alert' | 'security' = 'system') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLog = { timestamp: time, event, type };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // HANDLERS: SaaS Master operations
  const handleAddBusiness = (name: string, email: string, emoji: string, tier: 'free' | 'premium') => {
    let newId = "biz-" + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (businesses.some(b => b.id === newId)) {
      newId += "-" + Math.floor(10 + Math.random() * 90);
    }
    const newBiz: Business = { id: newId, name, logo: emoji, tier, status: 'active', email };
    setBusinesses(prev => [...prev, newBiz]);
    addLog(`SaaS Master: Nueva sucursal registrada '${name}' con ID: ${newId}. Plan: ${tier.toUpperCase()}`, 'billing');
    triggerToast(`🎉 Negocio '${name}' registrado exitosamente.`);
  };

  const handleToggleStatus = (id: string) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === id) {
        const nextStatus = b.status === 'active' ? 'suspended' : 'active';
        addLog(`SaaS Master: Acceso de '${b.name}' modificado a: ${nextStatus.toUpperCase()}`, 'alert');
        triggerToast(`Sucursal '${b.name}' ahora está ${nextStatus === 'active' ? 'Habilitada' : 'Suspendida'}.`);
        return { ...b, status: nextStatus };
      }
      return b;
    }));
  };

  const handleToggleTier = (id: string) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === id) {
        const nextTier = b.tier === 'premium' ? 'free' : 'premium';
        addLog(`SaaS Master: Suscripción de '${b.name}' actualizada a: ${nextTier.toUpperCase()}`, 'billing');
        triggerToast(`Licencia de '${b.name}' modificada a: ${nextTier === 'premium' ? '🏆 Premium' : 'Estándar'}.`);
        return { ...b, tier: nextTier };
      }
      return b;
    }));
  };

  const handleResetSystem = () => {
    localStorage.clear();
    setBusinesses(DEFAULT_BUSINESSES);
    setMenus(DEFAULT_MENUS);
    setOrders(DEFAULT_ORDERS);
    setReviews(DEFAULT_REVIEWS);
    setLogs(DEFAULT_LOGS);
    setCart([]);
    setCurrentActiveOrderId(null);
    setClientStep('menu');
    addLog("Base de datos restaurada a valores semilla de producción.", "system");
    triggerToast("♻️ Base de datos del SaaS restaurada con éxito.");
  };

  const handleOptimizeIndexes = () => {
    addLog("Comando DBA: Ejecutando REINDEX DATABASE y VACUUM ANALYZE en Postgres...", "system");
    addLog("Postgres Optimizer: Se reconstruyeron 8 índices compuestos B-Tree con éxito.", "system");
    triggerToast("✅ Índices de Postgres reconstruidos y optimizados.");
  };

  const handleClearLogs = () => {
    setLogs([]);
    triggerToast("🧹 Historial de consola limpio.");
  };

  // HANDLERS: Merchant operations
  const handleAddProduct = (name: string, price: number, category: 'Platos' | 'Acompañantes' | 'Bebidas', emoji: string, image: string, description: string) => {
    const newItem: MenuItem = {
      id: Date.now(),
      businessId: activeMerchantId,
      name,
      price,
      description: description || "Elaborado al instante con ingredientes locales.",
      category,
      emoji,
      image,
      available: true
    };
    setMenus(prev => [...prev, newItem]);
    addLog(`Comercio '${activeMerchantId}' agregó platillo: ${name} ($${price.toFixed(2)})`, 'system');
    triggerToast(`🎉 '${name}' agregado al catálogo.`);
  };

  const handleUpdateProductPrice = (id: number, price: number) => {
    setMenus(prev => prev.map(m => {
      if (m.id === id) {
        addLog(`Comercio '${activeMerchantId}' actualizó precio de '${m.name}' a $${price.toFixed(2)}`, 'system');
        return { ...m, price };
      }
      return m;
    }));
  };

  const handleToggleProductAvailable = (id: number) => {
    setMenus(prev => prev.map(m => {
      if (m.id === id) {
        const nextState = !m.available;
        triggerToast(`Platillo '${m.name}' marcado como ${nextState ? 'Disponible' : 'Agotado'}.`);
        return { ...m, available: nextState };
      }
      return m;
    }));
  };

  const handleDeleteProduct = (id: number) => {
    setMenus(prev => {
      const item = prev.find(m => m.id === id);
      if (item) {
        addLog(`Comercio '${activeMerchantId}' eliminó producto: ${item.name}`, 'system');
      }
      return prev.filter(m => m.id !== id);
    });
    triggerToast("🗑️ Platillo eliminado del catálogo.");
  };

  const handleUpdateOrderStatus = (id: string, status: 'Preparando' | 'En Camino' | 'Entregado') => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        addLog(`Comercio '${activeMerchantId}' actualizó despacho de Comanda ${id} a: ${status.toUpperCase()}`, 'system');
        triggerToast(`Comanda ${id} actualizada a: ${status}`);
        return { ...o, status };
      }
      return o;
    }));
  };

  const handleConciliateOrder = (id: string, approved: boolean) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const nextStatus = approved ? 'Conciliado' : 'Rechazado';
        addLog(`Caja Kiosco '${activeMerchantId}': Comprobante de comanda ${id} fue ${nextStatus.toUpperCase()}`, 'billing');
        triggerToast(approved ? `✅ Pago de comanda ${id} conciliado.` : `❌ Comprobante ${id} rechazado.`);
        return { ...o, payment: { ...o.payment, status: nextStatus } };
      }
      return o;
    }));
  };

  // HANDLERS: Client smartphone operations
  const handleAddToCart = (id: number) => {
    const item = menus.find(m => m.id === id);
    if (!item || !item.available) return;

    setCart(prev => {
      const existing = prev.find(it => it.id === id);
      if (existing) {
        return prev.map(it => it.id === id ? { ...it, qty: it.qty + 1 } : it);
      } else {
        return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, emoji: item.emoji }];
      }
    });
    triggerToast(`Agregado: ${item.name}`);
  };

  const handleDecreaseCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(it => it.id === id);
      if (!existing) return prev;
      if (existing.qty === 1) {
        return prev.filter(it => it.id !== id);
      } else {
        return prev.map(it => it.id === id ? { ...it, qty: it.qty - 1 } : it);
      }
    });
  };

  const handleSubmitOrder = () => {
    const id = "MS-" + Math.floor(1000 + Math.random() * 9000);
    const subtotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
    const deliveryFee = clientOrderType === 'Delivery' ? 2.00 : 0;
    const total = subtotal + deliveryFee;

    const newOrder: Order = {
      id,
      businessId: activeClientId,
      customer: clientName,
      email: clientEmail || 'comensal@email.com',
      type: clientOrderType,
      address: clientOrderType === 'Delivery' ? clientAddress : null,
      tableNum: clientOrderType === 'Mesa' ? clientTable : null,
      phone: clientPhone,
      notes: clientNotes,
      items: [...cart],
      subtotal,
      deliveryFee,
      total,
      status: 'Preparando',
      payment: {
        method: 'Pendiente',
        sender: '',
        reference: '',
        amount: total,
        status: 'Pendiente',
        timestamp: ''
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0]
    };

    setOrders(prev => [newOrder, ...prev]);
    setCurrentActiveOrderId(id);
    setCart([]);
    setClientNotes('');
    addLog(`Comensal '${clientName}' envió comanda ${id} a Kiosco '${activeClientId}'`, 'system');
    triggerToast(`🎉 Comanda ${id} enviada a cocina.`);
    setClientStep('payment');
  };

  const handleRegisterOnboarding = (name: string, email: string, emoji: string, tier: 'free' | 'premium') => {
    let newId = "biz-" + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (businesses.some(b => b.id === newId)) {
      newId += "-" + Math.floor(10 + Math.random() * 90);
    }
    const newBiz: Business = { id: newId, name, logo: emoji, tier, status: 'active', email };
    setBusinesses(prev => [...prev, newBiz]);

    // Seed initial products for immediate demonstration
    const initialItems: MenuItem[] = [
      { id: Date.now(), businessId: newId, name: `Plato Insignia ${emoji}`, price: 10.50, description: `Especialidad de autor preparada al instante por el chef estrella de la casa.`, category: "Platos", emoji, image: "", available: true },
      { id: Date.now() + 1, businessId: newId, name: "Bebida Refrescante Natural", price: 3.50, description: "Deliciosa infusión helada, excelente para maridar tus platillos.", category: "Bebidas", emoji: "🍹", image: "", available: true }
    ];
    setMenus(prev => [...prev, ...initialItems]);

    setActiveClientId(newId);
    setActiveMerchantId(newId);
    setClientStep('menu');
    addLog(`SaaS Master: Kiosco rápido '${name}' registrado desde el Onboarding Móvil. ID: ${newId}`, 'billing');
    triggerToast(`🎉 Kiosco '${name}' registrado y activo.`);
  };

  const handleSubmitPaymentReport = (method: string, sender: string, reference: string) => {
    if (!currentActiveOrderId) return;
    setOrders(prev => prev.map(o => {
      if (o.id === currentActiveOrderId) {
        addLog(`Comensal reportó pago (${method}) para comanda ${currentActiveOrderId}. Ref: ${reference}`, 'billing');
        return {
          ...o,
          payment: {
            method,
            sender: sender || "Efectivo contra entrega",
            reference: reference || "EFECTIVO",
            amount: o.total,
            status: method === 'Efectivo' ? 'Conciliado' : 'Por Conciliar',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        };
      }
      return o;
    }));
    triggerToast("💳 Comprobante enviado. Cocina notificando...");
    setClientStep('tracking');
  };

  const handleSubmitFeedback = (comment: string) => {
    if (!currentActiveOrderId) return;
    const newReview: Review = {
      id: Date.now(),
      businessId: activeClientId,
      orderId: currentActiveOrderId,
      customer: clientName || "Comensal Anónimo",
      foodRating: ratingFood,
      serviceRating: ratingService,
      comment: comment || "Excelente comida y rapidez."
    };
    setReviews(prev => [newReview, ...prev]);
    addLog(`Kiosco '${activeClientId}' recibió feedback: Comida: ${ratingFood}★, Servicio: ${ratingService}★`, 'system');
    triggerToast("⭐ ¡Gracias por tu calificación!");

    // Reset feedback ratings
    setRatingFood(5);
    setRatingService(5);
    setClientStep('menu');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* MASTER PLATFORM TOP HEADER NAVIGATION */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-master-600 text-white px-2.5 py-1.5 rounded-xl font-black text-xs tracking-wider shadow-lg flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> SaaS MULTIENVIOS
            </span>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-1.5 leading-tight">
                MenuScan <span className="text-brand-500">Multiempresa</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Consola Unificada de Datos, Aislamiento RLS & Auditoría Supabase</p>
            </div>
          </div>

          {/* Master view router pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto max-w-full no-scrollbar">
            <button 
              onClick={() => setCurrentView('supabase-audit')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${currentView === 'supabase-audit' ? 'bg-master-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ShieldCheck className="w-4 h-4 text-brand-500" /> Auditoría Supabase
            </button>
            <button 
              onClick={() => setCurrentView('saas')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${currentView === 'saas' ? 'bg-master-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Building2 className="w-4 h-4 text-indigo-400" /> Super Master
            </button>
            <button 
              onClick={() => setCurrentView('merchant')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${currentView === 'merchant' ? 'bg-master-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Store className="w-4 h-4 text-amber-400" /> Admin Negocio
            </button>
            <button 
              onClick={() => setCurrentView('client')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${currentView === 'client' ? 'bg-master-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" /> Demo Cliente
            </button>
          </div>
        </div>
      </div>

      {/* SYSTEM FEEDBACK TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 border border-brand-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Bell className="w-4 h-4 text-brand-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Notificación SaaS</p>
            <p className="text-xs text-slate-200 font-semibold">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* CONTEXT STRIP */}
      <div className="bg-slate-950/40 border-b border-slate-800/50 py-2 px-4 text-center select-none text-[10px] tracking-wide text-slate-400">
        🚀 <strong>Flujo de Datos en Tiempo Real:</strong> Modifica licencias o bloquea kioscos en el Super Master y observa en vivo cómo afecta al celular QR y al panel del mercante.
      </div>

      {/* CORE SPLIT SCREEN GRID */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: SELECTED PANEL */}
          {currentView !== 'client' ? (
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-2xl min-h-[580px]">
              {currentView === 'supabase-audit' && (
                <SupabaseAuditConsole onAddLog={addLog} />
              )}
              {currentView === 'saas' && (
                <SaaSAdminPanel 
                  businesses={businesses}
                  logs={logs}
                  onAddBusiness={handleAddBusiness}
                  onToggleStatus={handleToggleStatus}
                  onToggleTier={handleToggleTier}
                  onResetSystem={handleResetSystem}
                  onOptimizeIndexes={handleOptimizeIndexes}
                  onClearLogs={handleClearLogs}
                />
              )}
              {currentView === 'merchant' && (
                <MerchantPanel 
                  businesses={businesses}
                  activeMerchantId={activeMerchantId}
                  menus={menus}
                  orders={orders}
                  reviews={reviews}
                  onAddProduct={handleAddProduct}
                  onUpdateProductPrice={handleUpdateProductPrice}
                  onToggleProductAvailable={handleToggleProductAvailable}
                  onDeleteProduct={handleDeleteProduct}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onConciliateOrder={handleConciliateOrder}
                  onSelectMerchant={setActiveMerchantId}
                  triggerToast={triggerToast}
                />
              )}
            </div>
          ) : (
            // Full Screen smartphone on 'client' view tab
            <div className="lg:col-span-8 flex flex-col items-center justify-center py-6 bg-slate-950 rounded-3xl p-6 border border-slate-800 min-h-[580px]">
              <div className="text-center space-y-2 max-w-sm mb-6">
                <Smartphone className="w-8 h-8 text-brand-500 mx-auto" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Demostración Móvil QR</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Estás visualizando la simulación completa en modo pantalla completa. Puedes interactuar con el celular QR utilizando el panel dedicado a la derecha.
                </p>
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: INTERACTIVE PHONE SIMULATOR FRAME */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="w-full max-w-[340px] bg-slate-950 p-2.5 rounded-[36px] shadow-2xl border-4 border-slate-800 relative shadow-indigo-950/20">
              
              {/* Camera Notch simulation */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full flex items-center justify-center gap-1.5 z-30 shadow-inner">
                <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                <div className="w-8 h-0.5 bg-slate-800 rounded-full"></div>
              </div>

              {/* Dynamic Smartphone emulator panel */}
              <div className="bg-slate-50 rounded-[28px] overflow-hidden">
                <ClientSmartphoneSimulator 
                  businesses={businesses}
                  activeClientId={activeClientId}
                  menus={menus}
                  orders={orders}
                  cart={cart}
                  clientStep={clientStep}
                  clientOrderType={clientOrderType}
                  clientTable={clientTable}
                  clientName={clientName}
                  clientPhone={clientPhone}
                  clientEmail={clientEmail}
                  clientAddress={clientAddress}
                  clientNotes={clientNotes}
                  currentActiveOrderId={currentActiveOrderId}
                  ratingFood={ratingFood}
                  ratingService={ratingService}
                  
                  onAddToCart={handleAddToCart}
                  onDecreaseCart={handleDecreaseCart}
                  onSetClientStep={setClientStep}
                  onSetOrderType={setClientOrderType}
                  onSetClientData={(data) => {
                    if (data.clientNotes !== undefined) setClientNotes(data.clientNotes);
                    if (data.clientTable !== undefined) setClientTable(data.clientTable);
                    if (data.clientAddress !== undefined) setClientAddress(data.clientAddress);
                    if (data.clientName !== undefined) setClientName(data.clientName);
                    if (data.clientPhone !== undefined) setClientPhone(data.clientPhone);
                    if (data.clientEmail !== undefined) setClientEmail(data.clientEmail);
                    if (data.ratingFood !== undefined) setRatingFood(data.ratingFood);
                    if (data.ratingService !== undefined) setRatingService(data.ratingService);
                  }}
                  onSubmitOrder={handleSubmitOrder}
                  onSubmitPayment={handleSubmitPaymentReport}
                  onSubmitFeedback={handleSubmitFeedback}
                  onRegisterBusiness={handleRegisterOnboarding}
                  onSelectClientBusiness={setActiveClientId}
                  triggerToast={triggerToast}
                />
              </div>
            </div>

            {/* Selector context helper below phone */}
            <div className="w-full max-w-[340px] mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center select-none shadow-lg">
              <label className="block text-[9px] text-slate-500 font-black uppercase mb-1.5 tracking-wider">Tienda Escaneada en Celular:</label>
              <select 
                value={activeClientId} 
                onChange={(e) => {
                  setActiveClientId(e.target.value);
                  setClientStep('menu');
                  setCart([]);
                  addLog(`Celular: Comensal escaneó código QR de Kiosco '${e.target.value}'`, 'system');
                  triggerToast("📲 Código QR escaneado en vivo.");
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-brand-500 text-center"
              >
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.logo} {b.name} ({b.tier === 'premium' ? 'Premium' : 'Básico'})</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
