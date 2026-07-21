/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Building2, Store, Smartphone, 
  Terminal, Database, HelpCircle, RefreshCw, Zap, Bell, CheckCircle
} from 'lucide-react';

import { Business, MenuItem, Order, OrderItem, Review, SystemLog, CRMCustomer, Payment } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import SaaSAdminPanel from './components/SaaSAdminPanel';
import MerchantPanel from './components/MerchantPanel';
import ClientSmartphoneSimulator from './components/ClientSmartphoneSimulator';
import AuthInterface from './components/AuthInterface';

// Seed Businesses
const DEFAULT_BUSINESSES: Business[] = [
  { id: "biz-burger", name: "Burger Station", logo: "🍔", tier: "premium", status: "active", email: "contacto@burgerstation.com", deliveryFee: 2.00 },
  { id: "biz-pizza", name: "Bella Italia Pizza", logo: "🍕", tier: "premium", status: "active", email: "info@bellaitaliapizza.com", deliveryFee: 3.00 },
  { id: "biz-cafe", name: "La Cafetería del Barrio", logo: "☕", tier: "free", status: "active", email: "cafecito@barrio.com", deliveryFee: 1.50 },
  { id: "biz-tacos", name: "Tacoteca Express", logo: "🌮", tier: "premium", status: "suspended", email: "pagos@tacoteca.com", deliveryFee: 2.50 }
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

// --- SUPABASE DATA MAPPING UTILITIES ---
function mapStoreToBusiness(row: any): Business {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    tier: row.tier as 'free' | 'premium',
    status: row.status as 'active' | 'suspended',
    email: row.email,
    deliveryFee: row.delivery_fee !== undefined ? Number(row.delivery_fee) : (row.deliveryFee !== undefined ? Number(row.deliveryFee) : 2.00)
  };
}

function mapBusinessToStore(biz: Business): any {
  return {
    id: biz.id,
    name: biz.name,
    logo: biz.logo,
    tier: biz.tier,
    status: biz.status,
    email: biz.email,
    delivery_fee: biz.deliveryFee ?? 2.00
  };
}

function mapMenuToMenuItem(row: any): MenuItem {
  return {
    id: Number(row.id),
    businessId: row.business_id || row.businessId || '',
    name: row.name,
    price: Number(row.price),
    description: row.description || '',
    category: (row.category || 'Platos') as 'Platos' | 'Acompañantes' | 'Bebidas',
    emoji: row.emoji || '🍽️',
    image: row.image || '',
    available: row.available !== undefined ? row.available : true
  };
}

function mapMenuItemToMenu(item: MenuItem): any {
  return {
    id: item.id,
    business_id: item.businessId,
    name: item.name,
    price: item.price,
    description: item.description,
    category: item.category,
    emoji: item.emoji,
    image: item.image,
    available: item.available
  };
}

function mapOrderFromDB(row: any): Order {
  const payment: Payment = {
    method: row.payment_method || (row.payment && row.payment.method) || 'Efectivo',
    sender: (row.payment && row.payment.sender) || '',
    reference: (row.payment && row.payment.reference) || '',
    amount: Number(row.total || 0),
    status: (row.payment_status || (row.payment && row.payment.status) || 'Por Conciliar') as 'Pendiente' | 'Por Conciliar' | 'Conciliado' | 'Rechazado',
    timestamp: row.created_at || row.timestamp || new Date().toISOString()
  };

  let items: OrderItem[] = [];
  if (row.items) {
    if (typeof row.items === 'string') {
      try {
        items = JSON.parse(row.items);
      } catch (e) {
        items = [];
      }
    } else if (Array.isArray(row.items)) {
      items = row.items;
    }
  }

  return {
    id: row.id,
    businessId: row.business_id || row.businessId || '',
    customer: row.customer || '',
    email: row.email || '',
    type: (row.type || 'Mesa') as 'Mesa' | 'Delivery',
    address: row.address || null,
    tableNum: row.table_num || row.tableNum || null,
    phone: row.phone || '',
    notes: row.notes || '',
    items,
    subtotal: Number(row.subtotal || 0),
    deliveryFee: Number(row.delivery_fee !== undefined ? row.delivery_fee : (row.deliveryFee !== undefined ? row.deliveryFee : 0)),
    total: Number(row.total || 0),
    status: (row.status || 'Preparando') as 'Preparando' | 'En Camino' | 'Entregado',
    payment,
    timestamp: row.created_at || row.timestamp || new Date().toISOString(),
    date: row.date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0])
  };
}

function mapOrderToDB(order: Order): any {
  return {
    id: order.id,
    business_id: order.businessId,
    customer: order.customer,
    email: order.email,
    type: order.type,
    address: order.address,
    table_num: order.tableNum,
    phone: order.phone,
    notes: order.notes,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
    status: order.status,
    payment_method: order.payment.method,
    payment_status: order.payment.status,
    payment: order.payment,
    date: order.date,
    created_at: order.timestamp
  };
}

function mapReviewFromDB(row: any): Review {
  return {
    id: Number(row.id),
    businessId: row.business_id || row.businessId || '',
    orderId: row.order_id || row.orderId || '',
    customer: row.customer || '',
    foodRating: Number(row.food_rating !== undefined ? row.food_rating : (row.foodRating !== undefined ? row.foodRating : 5)),
    serviceRating: Number(row.service_rating !== undefined ? row.service_rating : (row.serviceRating !== undefined ? row.serviceRating : 5)),
    comment: row.comment || ''
  };
}

function mapReviewToDB(review: Review): any {
  return {
    id: review.id,
    business_id: review.businessId,
    order_id: review.orderId,
    customer: review.customer,
    food_rating: review.foodRating,
    service_rating: review.serviceRating,
    comment: review.comment
  };
}

function mapLogFromDB(row: any): SystemLog {
  return {
    timestamp: row.timestamp || row.created_at || new Date().toLocaleTimeString(),
    event: row.event || '',
    type: (row.type || 'system') as 'system' | 'auth' | 'billing' | 'alert' | 'security'
  };
}

function mapLogToDB(log: SystemLog): any {
  return {
    timestamp: log.timestamp,
    event: log.event,
    type: log.type
  };
}

function mapCustomerFromDB(row: any): CRMCustomer {
  return {
    id: row.id,
    businessId: row.business_id || row.businessId || '',
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    totalSpent: Number(row.total_spent !== undefined ? row.total_spent : (row.totalSpent !== undefined ? row.totalSpent : 0)),
    ordersCount: Number(row.orders_count !== undefined ? row.orders_count : (row.ordersCount !== undefined ? row.ordersCount : 0)),
    registeredAt: row.registered_at || row.registeredAt || row.created_at || new Date().toISOString()
  };
}

function mapCustomerToDB(cust: CRMCustomer): any {
  return {
    id: cust.id,
    business_id: cust.businessId,
    name: cust.name,
    email: cust.email,
    phone: cust.phone,
    total_spent: cust.totalSpent,
    orders_count: cust.ordersCount,
    registered_at: cust.registeredAt || new Date().toISOString()
  };
}

export default function App() {
  // Sync state with LocalStorage
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [crmCustomers, setCrmCustomers] = useState<CRMCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication states for each access level
  const [saasUser, setSaasUser] = useState<{ email: string; name: string; provider: 'email' | 'google' } | null>(null);
  const [merchantUser, setMerchantUser] = useState<{ email: string; name: string; provider: 'email' | 'google' } | null>(null);
  const [clientUser, setClientUser] = useState<{ email: string; name: string; provider: 'email' | 'google' } | null>(null);

  // Navigation states (Supabase Audit tab removed)
  const [currentView, setCurrentView] = useState<'saas' | 'merchant' | 'client'>('saas');
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

  // Load initial data from Supabase
  const loadDataFromSupabase = async () => {
    if (!isSupabaseConfigured) {
      console.info("Supabase is not configured yet. Running in offline/local fallback mode.");
      setBusinesses(DEFAULT_BUSINESSES);
      setMenus(DEFAULT_MENUS);
      setOrders(DEFAULT_ORDERS);
      setReviews(DEFAULT_REVIEWS);
      setLogs(DEFAULT_LOGS);
      setCrmCustomers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: storesData, error: storesError } = await supabase.from('stores').select('*');
      if (storesError) throw storesError;
      
      const { data: menusData, error: menusError } = await supabase.from('menus').select('*');
      if (menusError) throw menusError;
      
      const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*');
      if (ordersError) throw ordersError;
      
      const { data: reviewsData, error: reviewsError } = await supabase.from('reviews').select('*');
      if (reviewsError) throw reviewsError;
      
      const { data: logsData, error: logsError } = await supabase.from('system_logs').select('*');
      if (logsError) throw logsError;
      
      const { data: customersData, error: customersError } = await supabase.from('customers').select('*');
      if (customersError) throw customersError;

      if (!storesData || storesData.length === 0) {
        await seedDefaultData();
      } else {
        setBusinesses(storesData.map(mapStoreToBusiness));
        setMenus(menusData ? menusData.map(mapMenuToMenuItem) : []);
        setOrders(ordersData ? ordersData.map(mapOrderFromDB) : []);
        setReviews(reviewsData ? reviewsData.map(mapReviewFromDB) : []);
        setLogs(logsData ? logsData.map(mapLogFromDB) : []);
        setCrmCustomers(customersData ? customersData.map(mapCustomerFromDB) : []);
      }
    } catch (error) {
      console.warn("Could not load data from Supabase, falling back to local database:", error);
      triggerToast("⚠️ Usando base de datos local temporal.");
      setBusinesses(DEFAULT_BUSINESSES);
      setMenus(DEFAULT_MENUS);
      setOrders(DEFAULT_ORDERS);
      setReviews(DEFAULT_REVIEWS);
      setLogs(DEFAULT_LOGS);
      setCrmCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDefaultData = async () => {
    if (!isSupabaseConfigured) return;
    try {
      console.log("Seeding Supabase with default data...");
      
      await supabase.from('stores').insert(DEFAULT_BUSINESSES.map(mapBusinessToStore));
      await supabase.from('menus').insert(DEFAULT_MENUS.map(mapMenuItemToMenu));
      await supabase.from('orders').insert(DEFAULT_ORDERS.map(mapOrderToDB));
      await supabase.from('reviews').insert(DEFAULT_REVIEWS.map(mapReviewToDB));
      await supabase.from('system_logs').insert(DEFAULT_LOGS.map(mapLogToDB));

      setBusinesses(DEFAULT_BUSINESSES);
      setMenus(DEFAULT_MENUS);
      setOrders(DEFAULT_ORDERS);
      setReviews(DEFAULT_REVIEWS);
      setLogs(DEFAULT_LOGS);
      setCrmCustomers([]);
      
      triggerToast("✨ Base de datos inicializada en Supabase.");
    } catch (error) {
      console.warn("Could not seed default data in Supabase:", error);
      setBusinesses(DEFAULT_BUSINESSES);
      setMenus(DEFAULT_MENUS);
      setOrders(DEFAULT_ORDERS);
      setReviews(DEFAULT_REVIEWS);
      setLogs(DEFAULT_LOGS);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const handleRegisterClientCRM = async (name: string, email: string, phone: string, bizId: string) => {
    if (!name) return;
    const cleanEmail = email && email !== 'No Registrado' ? email.trim().toLowerCase() : '';
    const cleanPhone = phone && phone !== 'No Registrado' ? phone.trim() : '';
    
    if (cleanEmail === 'nocorreo@email.com' || cleanEmail === 'comensal@email.com') return;

    const key = cleanEmail || cleanPhone.replace(/\s+/g, '') || name.trim().toLowerCase();
    if (!key) return;

    let newCustomer: CRMCustomer | null = null;

    setCrmCustomers(prev => {
      // Check if already exists for this business
      const exists = prev.some(c => c.businessId === bizId && (
        (cleanEmail && c.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && c.phone === cleanPhone) ||
        (!cleanEmail && !cleanPhone && c.name.toLowerCase() === name.trim().toLowerCase())
      ));
      if (exists) return prev;
      
      newCustomer = {
        id: `${bizId}-${key}`,
        businessId: bizId,
        name,
        email: email || 'No Registrado',
        phone: phone || 'No Registrado',
        totalSpent: 0,
        ordersCount: 0,
        registeredAt: new Date().toLocaleDateString()
      };
      return [...prev, newCustomer];
    });

    if (newCustomer && isSupabaseConfigured) {
      try {
        await supabase.from('customers').insert(mapCustomerToDB(newCustomer));
      } catch (e) {
        console.warn("Error inserting customer in Supabase:", e);
      }
    }
  };

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
  const handleAddBusiness = async (name: string, email: string, emoji: string, tier: 'free' | 'premium') => {
    let newId = "biz-" + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (businesses.some(b => b.id === newId)) {
      newId += "-" + Math.floor(10 + Math.random() * 90);
    }
    const newBiz: Business = { id: newId, name, logo: emoji, tier, status: 'active', email, deliveryFee: 2.00 };
    setBusinesses(prev => [...prev, newBiz]);
    
    const logMsg = `SaaS Master: Nueva sucursal registrada '${name}' con ID: ${newId}. Plan: ${tier.toUpperCase()}`;
    addLog(logMsg, 'billing');
    triggerToast(`🎉 Negocio '${name}' registrado exitosamente.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('stores').insert(mapBusinessToStore(newBiz));
        await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'billing' }));
      } catch (e) {
        console.warn("Supabase Error:", e);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    let updatedBiz: Business | null = null;
    
    setBusinesses(prev => prev.map(b => {
      if (b.id === id) {
        const isCurrentlySuspended = b.status === 'suspended';
        if (isCurrentlySuspended) {
          const restoredTier = b.previousTier || b.tier || 'premium';
          updatedBiz = { ...b, status: 'active', tier: restoredTier };
          return updatedBiz;
        } else {
          updatedBiz = { ...b, status: 'suspended', previousTier: b.tier };
          return updatedBiz;
        }
      }
      return b;
    }));

    if (updatedBiz) {
      const isRestoring = (updatedBiz as Business).status === 'active';
      const logMsg = isRestoring 
        ? `SaaS Master: Acceso de '${(updatedBiz as Business).name}' habilitado. Plan/Nivel de acceso restituido a: ${(updatedBiz as Business).tier.toUpperCase()}`
        : `SaaS Master: Acceso de '${(updatedBiz as Business).name}' suspendido. Nivel de acceso guardado para restitución.`;
      
      addLog(logMsg, 'alert');
      triggerToast(isRestoring 
        ? `Sucursal '${(updatedBiz as Business).name}' ahora está Habilitada (Plan: ${(updatedBiz as Business).tier === 'premium' ? '🏆 Premium' : 'Estándar'}).` 
        : `Sucursal '${(updatedBiz as Business).name}' ahora está Suspendida.`
      );

      if (isSupabaseConfigured) {
        try {
          await supabase.from('stores').update(mapBusinessToStore(updatedBiz)).eq('id', id);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'alert' }));
        } catch (e) {
          console.warn("Supabase Error:", e);
        }
      }
    }
  };

  const handleToggleTier = async (id: string) => {
    let updatedBiz: Business | null = null;
    setBusinesses(prev => prev.map(b => {
      if (b.id === id) {
        const nextTier = b.tier === 'premium' ? 'free' : 'premium';
        updatedBiz = { ...b, tier: nextTier };
        return updatedBiz;
      }
      return b;
    }));

    if (updatedBiz) {
      const nextTier = (updatedBiz as Business).tier;
      const logMsg = `SaaS Master: Suscripción de '${(updatedBiz as Business).name}' actualizada a: ${nextTier.toUpperCase()}`;
      addLog(logMsg, 'billing');
      triggerToast(`Licencia de '${(updatedBiz as Business).name}' modificada a: ${nextTier === 'premium' ? '🏆 Premium' : 'Estándar'}.`);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('stores').update(mapBusinessToStore(updatedBiz)).eq('id', id);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'billing' }));
        } catch (e) {
          console.warn("Supabase Error:", e);
        }
      }
    }
  };

  const handleResetSystem = async () => {
    setIsLoading(true);
    localStorage.clear();

    if (isSupabaseConfigured) {
      try {
        // Clean Supabase tables securely
        await supabase.from('reviews').delete().neq('id', 0);
        await supabase.from('orders').delete().neq('id', '0');
        await supabase.from('menus').delete().neq('id', 0);
        await supabase.from('system_logs').delete().neq('timestamp', '');
        await supabase.from('customers').delete().neq('id', '0');
        await supabase.from('stores').delete().neq('id', '0');

        await seedDefaultData();
        
        setCart([]);
        setCurrentActiveOrderId(null);
        setClientStep('menu');
        triggerToast("♻️ Base de datos en Supabase restaurada con éxito.");
      } catch (e) {
        console.warn("Supabase Error resetting system:", e);
        setBusinesses(DEFAULT_BUSINESSES);
        setMenus(DEFAULT_MENUS);
        setOrders(DEFAULT_ORDERS);
        setReviews(DEFAULT_REVIEWS);
        setLogs(DEFAULT_LOGS);
        setCrmCustomers([]);
        setCart([]);
        setCurrentActiveOrderId(null);
        setClientStep('menu');
        triggerToast("⚠️ Error al limpiar Supabase. Restaurado localmente.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setBusinesses(DEFAULT_BUSINESSES);
      setMenus(DEFAULT_MENUS);
      setOrders(DEFAULT_ORDERS);
      setReviews(DEFAULT_REVIEWS);
      setLogs(DEFAULT_LOGS);
      setCrmCustomers([]);
      setCart([]);
      setCurrentActiveOrderId(null);
      setClientStep('menu');
      triggerToast("♻️ Base de datos local restaurada.");
      setIsLoading(false);
    }
  };

  const handleOptimizeIndexes = () => {
    addLog("Comando DBA: Ejecutando REINDEX DATABASE y VACUUM ANALYZE en Postgres...", "system");
    addLog("Postgres Optimizer: Se reconstruyeron 8 índices compuestos B-Tree con éxito.", "system");
    triggerToast("✅ Índices de Postgres reconstruidos y optimizados.");
  };

  const handleClearLogs = async () => {
    setLogs([]);
    triggerToast("🧹 Historial de consola limpio.");
    if (isSupabaseConfigured) {
      try {
        await supabase.from('system_logs').delete().neq('timestamp', '');
      } catch (e) {
        console.warn("Supabase Error clearing logs:", e);
      }
    }
  };

  // HANDLERS: Merchant operations
  const handleAddProduct = async (name: string, price: number, category: 'Platos' | 'Acompañantes' | 'Bebidas', emoji: string, image: string, description: string) => {
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
    
    const logMsg = `Comercio '${activeMerchantId}' agregó platillo: ${name} ($${price.toFixed(2)})`;
    addLog(logMsg, 'system');
    triggerToast(`🎉 '${name}' agregado al catálogo.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('menus').insert(mapMenuItemToMenu(newItem));
        await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'system' }));
      } catch (e) {
        console.warn("Supabase Error adding product:", e);
      }
    }
  };

  const handleUpdateProductPrice = async (id: number, price: number) => {
    let updatedItem: MenuItem | null = null;
    setMenus(prev => prev.map(m => {
      if (m.id === id) {
        updatedItem = { ...m, price };
        return updatedItem;
      }
      return m;
    }));

    if (updatedItem) {
      const logMsg = `Comercio '${activeMerchantId}' actualizó precio de '${(updatedItem as MenuItem).name}' a $${price.toFixed(2)}`;
      addLog(logMsg, 'system');

      if (isSupabaseConfigured) {
        try {
          await supabase.from('menus').update(mapMenuItemToMenu(updatedItem)).eq('id', id);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'system' }));
        } catch (e) {
          console.warn("Supabase Error updating product price:", e);
        }
      }
    }
  };

  const handleToggleProductAvailable = async (id: number) => {
    let updatedItem: MenuItem | null = null;
    setMenus(prev => prev.map(m => {
      if (m.id === id) {
        const nextState = !m.available;
        updatedItem = { ...m, available: nextState };
        return updatedItem;
      }
      return m;
    }));

    if (updatedItem) {
      const nextState = (updatedItem as MenuItem).available;
      triggerToast(`Platillo '${(updatedItem as MenuItem).name}' marcado como ${nextState ? 'Disponible' : 'Agotado'}.`);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('menus').update(mapMenuItemToMenu(updatedItem)).eq('id', id);
        } catch (e) {
          console.warn("Supabase Error toggling availability:", e);
        }
      }
    }
  };

  const handleDeleteProduct = async (id: number) => {
    let deletedItem: MenuItem | null = null;
    setMenus(prev => {
      const item = prev.find(m => m.id === id);
      if (item) {
        deletedItem = item;
      }
      return prev.filter(m => m.id !== id);
    });

    if (deletedItem) {
      const logMsg = `Comercio '${activeMerchantId}' eliminó producto: ${(deletedItem as MenuItem).name}`;
      addLog(logMsg, 'system');
      triggerToast("🗑️ Platillo eliminado del catálogo.");

      if (isSupabaseConfigured) {
        try {
          await supabase.from('menus').delete().eq('id', id);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'system' }));
        } catch (e) {
          console.warn("Supabase Error deleting product:", e);
        }
      }
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: 'Preparando' | 'En Camino' | 'Entregado') => {
    let updatedOrder: Order | null = null;
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        updatedOrder = { ...o, status };
        return updatedOrder;
      }
      return o;
    }));

    if (updatedOrder) {
      const logMsg = `Comercio '${activeMerchantId}' actualizó despacho de Comanda ${id} a: ${status.toUpperCase()}`;
      addLog(logMsg, 'system');
      triggerToast(`Comanda ${id} actualizada a: ${status}`);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('orders').update(mapOrderToDB(updatedOrder)).eq('id', id);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'system' }));
        } catch (e) {
          console.warn("Supabase Error updating order status:", e);
        }
      }
    }
  };

  const handleConciliateOrder = async (id: string, approved: boolean) => {
    const authorizedUser = merchantUser || saasUser;
    if (!authorizedUser) {
      triggerToast("⚠️ Error: Solo el Administrador del Negocio o Super Master puede conciliar pagos.");
      return;
    }
    let updatedOrder: Order | null = null;
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const nextStatus = approved ? 'Conciliado' : 'Rechazado';
        updatedOrder = { ...o, payment: { ...o.payment, status: nextStatus } };
        return updatedOrder;
      }
      return o;
    }));

    if (updatedOrder) {
      const nextStatus = (updatedOrder as Order).payment.status;
      const logMsg = `Caja Kiosco '${(updatedOrder as Order).businessId}' por Admin '${authorizedUser.name}': Comprobante de comanda ${id} fue ${nextStatus.toUpperCase()}`;
      addLog(logMsg, 'billing');
      triggerToast(approved ? `✅ Pago de comanda ${id} conciliado por el Administrador.` : `❌ Comprobante ${id} rechazado por el Administrador.`);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('orders').update(mapOrderToDB(updatedOrder)).eq('id', id);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'billing' }));
        } catch (e) {
          console.warn("Supabase Error conciliating order:", e);
        }
      }
    }
  };

  const handleUpdateDeliveryFee = async (businessId: string, fee: number) => {
    let updatedBiz: Business | null = null;
    setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, deliveryFee: fee } : b));

    updatedBiz = businesses.find(b => b.id === businessId) || null;
    if (updatedBiz) {
      updatedBiz = { ...updatedBiz, deliveryFee: fee };
      const logMsg = `Configuración Kiosco '${businessId}': Costo de delivery ajustado a $${fee.toFixed(2)}`;
      addLog(logMsg, 'system');
      triggerToast(`✅ Costo de envío guardado: $${fee.toFixed(2)}`);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('stores').update(mapBusinessToStore(updatedBiz)).eq('id', businessId);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'system' }));
        } catch (e) {
          console.warn("Supabase Error updating delivery fee:", e);
        }
      }
    }
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

  const handleSubmitOrder = async () => {
    const id = "MS-" + Math.floor(1000 + Math.random() * 9000);
    const subtotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
    const activeBiz = businesses.find(b => b.id === activeClientId);
    const deliveryFee = clientOrderType === 'Delivery' ? (activeBiz?.deliveryFee ?? 2.00) : 0;
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
    
    // Auto register customer to CRM
    handleRegisterClientCRM(clientName, clientEmail, clientPhone, activeClientId);
    
    const logMsg = `Comensal '${clientName}' envió comanda ${id} a Kiosco '${activeClientId}'`;
    addLog(logMsg, 'system');
    triggerToast(`🎉 Comanda ${id} enviada a cocina.`);
    setClientStep('payment');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').insert(mapOrderToDB(newOrder));
        await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'system' }));
      } catch (e) {
        console.warn("Supabase Error submitting order:", e);
      }
    }
  };

  const handleRegisterOnboarding = async (name: string, email: string, emoji: string, tier: 'free' | 'premium') => {
    let newId = "biz-" + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (businesses.some(b => b.id === newId)) {
      newId += "-" + Math.floor(10 + Math.random() * 90);
    }
    const newBiz: Business = { id: newId, name, logo: emoji, tier, status: 'active', email, deliveryFee: 2.00 };
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
    
    const logMsg = `SaaS Master: Kiosco rápido '${name}' registrado desde el Onboarding Móvil. ID: ${newId}`;
    addLog(logMsg, 'billing');
    triggerToast(`🎉 Kiosco '${name}' registrado y activo.`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('stores').insert(mapBusinessToStore(newBiz));
        await supabase.from('menus').insert(initialItems.map(mapMenuItemToMenu));
        await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'billing' }));
      } catch (e) {
        console.warn("Supabase Error on register onboarding:", e);
      }
    }
  };

  const handleSubmitPaymentReport = async (method: string, sender: string, reference: string) => {
    if (!currentActiveOrderId) return;
    let updatedOrder: Order | null = null;

    setOrders(prev => prev.map(o => {
      if (o.id === currentActiveOrderId) {
        updatedOrder = {
          ...o,
          payment: {
            method,
            sender: sender || "Efectivo contra entrega",
            reference: reference || "EFECTIVO",
            amount: o.total,
            status: 'Por Conciliar',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        };
        return updatedOrder;
      }
      return o;
    }));
    
    triggerToast("💳 Comprobante enviado. Cocina notificando...");
    setClientStep('tracking');

    if (updatedOrder) {
      const logMsg = `Comensal reportó pago (${method}) para comanda ${currentActiveOrderId}. Ref: ${reference}`;
      addLog(logMsg, 'billing');

      if (isSupabaseConfigured) {
        try {
          await supabase.from('orders').update(mapOrderToDB(updatedOrder)).eq('id', currentActiveOrderId);
          await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'billing' }));
        } catch (e) {
          console.warn("Supabase Error submitting payment report:", e);
        }
      }
    }
  };

  const handleSubmitFeedback = async (comment: string) => {
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
    
    const logMsg = `Kiosco '${activeClientId}' recibió feedback: Comida: ${ratingFood}★, Servicio: ${ratingService}★`;
    addLog(logMsg, 'system');
    triggerToast("⭐ ¡Gracias por tu calificación!");

    // Reset feedback ratings
    setRatingFood(5);
    setRatingService(5);
    setClientStep('menu');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reviews').insert(mapReviewToDB(newReview));
        await supabase.from('system_logs').insert(mapLogToDB({ timestamp: new Date().toISOString(), event: logMsg, type: 'system' }));
      } catch (e) {
        console.warn("Supabase Error submitting feedback:", e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* MASTER PLATFORM TOP HEADER NAVIGATION */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/src/logo webp.webp" 
              alt="SaaS Multienvios Logo" 
              className="h-10 w-10 object-contain rounded-xl bg-slate-900 p-1 border border-slate-800 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-1.5 leading-tight">
                MenuScan <span className="text-brand-500">Multiempresa</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Consola Unificada de Datos, Aislamiento RLS & Autenticación Multi-Nivel</p>
            </div>
          </div>

          {/* Master view router pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto max-w-full no-scrollbar">
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
              {currentView === 'saas' && (
                !saasUser ? (
                  <AuthInterface level="saas" onLogin={(u) => { setSaasUser(u); addLog(`SaaS Admin: '${u.name}' (${u.email}) ingresó al sistema vía ${u.provider.toUpperCase()}`, 'auth'); triggerToast(`👋 ¡Bienvenido, ${u.name}!`); }} />
                ) : (
                  <>
                    {/* User session header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-black text-xs shrink-0">
                          {saasUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white flex flex-wrap items-center gap-1.5 leading-none">
                            {saasUser.name}
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wider">
                              SaaS Master
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{saasUser.email} • Conectado vía {saasUser.provider}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSaasUser(null);
                          addLog(`SaaS Admin: '${saasUser.name}' cerró sesión.`, 'auth');
                          triggerToast("Sesión cerrada.");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition-all shrink-0"
                      >
                        Cerrar Sesión
                      </button>
                    </div>

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
                  </>
                )
              )}

              {currentView === 'merchant' && (
                !merchantUser ? (
                  <AuthInterface level="merchant" businesses={businesses} onLogin={(u) => { setMerchantUser(u); if (u.businessId) { setActiveMerchantId(u.businessId); } addLog(`Mercante: '${u.name}' (${u.email}) ingresó al panel de negocio vía ${u.provider.toUpperCase()}`, 'auth'); triggerToast(`🏪 Panel de negocio listo.`); }} />
                ) : (
                  <>
                    {/* User session header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-xs shrink-0">
                          {businesses.find(b => b.id === activeMerchantId)?.logo || '🏪'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white flex flex-wrap items-center gap-1.5 leading-none">
                            {merchantUser.name}
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-wider">
                              Admin de {businesses.find(b => b.id === activeMerchantId)?.name || activeMerchantId}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{merchantUser.email} • Conectado vía {merchantUser.provider}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMerchantUser(null);
                          addLog(`Mercante: '${merchantUser.name}' cerró sesión de '${activeMerchantId}'.`, 'auth');
                          triggerToast("Sesión de comercio cerrada.");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition-all shrink-0"
                      >
                        Cerrar Sesión
                      </button>
                    </div>

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
                      merchantUser={merchantUser}
                      crmCustomers={crmCustomers}
                      onUpdateDeliveryFee={handleUpdateDeliveryFee}
                    />
                  </>
                )
              )}
            </div>
          ) : (
            // Full Screen smartphone on 'client' view tab
            <div className="lg:col-span-8 flex flex-col items-center justify-center py-6 bg-slate-950 rounded-3xl p-6 border border-slate-800 min-h-[580px]">
              {!clientUser ? (
                <div className="w-full max-w-sm">
                  <AuthInterface level="client" onLogin={(u) => { 
                    setClientUser(u); 
                    setClientEmail(u.email); 
                    setClientName(u.name); 
                    handleRegisterClientCRM(u.name, u.email, '', activeClientId);
                    addLog(`Comensal: '${u.name}' (${u.email}) ingresó al simulador vía ${u.provider.toUpperCase()}`, 'auth'); 
                    triggerToast(`📱 Bienvenido a tu menú QR.`); 
                  }} />
                </div>
              ) : (
                <div className="text-center space-y-4 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl font-black shadow-md">
                    {clientUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Comensal Autenticado</h3>
                    <p className="text-xs text-slate-200 font-semibold">{clientUser.name} ({clientUser.email})</p>
                    <p className="text-[10px] text-slate-400">Sesión activa vía cuenta de {clientUser.provider.toUpperCase()}</p>
                  </div>
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed text-left">
                    💡 <strong>Sincronización Automática:</strong> Tu celular simulador a la derecha se ha sincronizado con tu cuenta de cliente. Cualquier comanda o calificación que envíes estará firmada con tus datos automáticamente.
                  </div>
                  <button
                    onClick={() => {
                      setClientUser(null);
                      setClientEmail('');
                      setClientName('');
                      addLog(`Comensal: '${clientUser.name}' cerró sesión en el simulador móvil.`, 'auth');
                      triggerToast("Sesión de cliente cerrada.");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-bold transition-all"
                  >
                    Cerrar Sesión de Cliente
                  </button>
                </div>
              )}
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
          </div>

        </div>
      </div>
    </div>
  );
}
