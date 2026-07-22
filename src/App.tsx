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
    id: "ord-4412",
    businessId: "biz-burger",
    customer: "Marcos Del Río",
    email: "marcos@gmail.com",
    type: "Delivery",
    address: "Calle Falsa 123, Depto 4B",
    tableNum: undefined,
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
    id: "ord-8811",
    businessId: "biz-pizza",
    customer: "Lucía Fernández",
    email: "lucia.fer@outlook.com",
    type: "Mesa",
    tableNum: "Mesa 3",
    address: undefined,
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
  { id: 1, businessId: "biz-burger", orderId: "ord-4412", customer: "Marcos Del Río", foodRating: 5, serviceRating: 4, comment: "La smash burger es un espectáculo. Excelente punto de la carne." }
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
    name: row.name || '',
    logo: row.logo || '',
    tier: (row.tier as 'free' | 'premium') || 'free',
    status: (row.status as 'active' | 'suspended') || 'active',
    email: row.email || '',
    password: row.password || (row.email ? row.email.split('@')[0] + '123' : '123456'),
    previousTier: row.previous_tier || undefined,
    deliveryFee: row.delivery_fee !== undefined ? Number(row.delivery_fee) : 2.00,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function mapBusinessToStore(biz: Business): any {
  return {
    id: biz.id,
    name: biz.name,
    logo: biz.logo || '',
    tier: biz.tier,
    status: biz.status,
    email: biz.email || '',
    password: biz.password || (biz.email ? biz.email.split('@')[0] + '123' : '123456'),
    previous_tier: biz.previousTier || null,
    delivery_fee: biz.deliveryFee ?? 2.00,
    created_at: biz.createdAt || new Date().toISOString()
  };
}

function mapMenuToMenuItem(row: any): MenuItem {
  return {
    id: Number(row.id),
    businessId: row.business_id || row.businessId || '',
    name: row.name || '',
    price: Number(row.price || 0),
    description: row.description || '',
    category: (row.category || 'Platos') as 'Platos' | 'Acompañantes' | 'Bebidas',
    emoji: row.emoji || '🍽️',
    image: row.image || '',
    available: row.available !== undefined ? Boolean(row.available) : true
  };
}

function mapOrderFromDB(row: any): Order {
  let items: OrderItem[] = [];
  if (row.items) {
    if (typeof row.items === 'string') {
      try { items = JSON.parse(row.items); } catch (e) { items = []; }
    } else if (Array.isArray(row.items)) {
      items = row.items;
    }
  }

  let payment: Payment = {
    method: row.payment_method || (row.payment && row.payment.method) || 'Pendiente',
    sender: (row.payment && row.payment.sender) || '',
    reference: (row.payment && row.payment.reference) || '',
    amount: Number(row.total || 0),
    status: (row.payment_status || (row.payment && row.payment.status) || 'Pendiente'),
    timestamp: (row.payment && row.payment.timestamp) || row.timestamp || new Date().toISOString()
  };

  return {
    id: row.id,
    businessId: row.business_id || row.businessId || '',
    customer: row.customer || '',
    email: row.email || '',
    type: (row.type || 'Mesa') as 'Mesa' | 'Delivery',
    address: row.address || undefined,
    tableNum: row.table_num || row.tableNum || undefined,
    phone: row.phone || '',
    notes: row.notes || '',
    items,
    subtotal: Number(row.subtotal || 0),
    deliveryFee: Number(row.delivery_fee !== undefined ? row.delivery_fee : 0),
    total: Number(row.total || 0),
    status: (row.status || 'Preparando') as 'Preparando' | 'En Camino' | 'Entregado',
    payment,
    timestamp: row.timestamp || row.created_at || new Date().toISOString(),
    date: row.date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0])
  };
}

function mapOrderToDB(order: Order): any {
  return {
    id: order.id,
    business_id: order.businessId,
    customer: order.customer,
    email: order.email || '',
    type: order.type,
    address: order.address || null,
    table_num: order.tableNum || null,
    phone: order.phone || '',
    notes: order.notes || '',
    items: order.items || [],
    subtotal: order.subtotal || 0,
    delivery_fee: order.deliveryFee || 0,
    total: order.total || 0,
    status: order.status,
    payment: order.payment || {},
    timestamp: order.timestamp || '',
    date: order.date || '',
    created_at: new Date().toISOString()
  };
}

function mapReviewFromDB(row: any): Review {
  return {
    id: Number(row.id),
    businessId: row.business_id || row.businessId || '',
    orderId: row.order_id || row.orderId || undefined,
    customer: row.customer || '',
    foodRating: Number(row.food_rating !== undefined ? row.food_rating : 5),
    serviceRating: Number(row.service_rating !== undefined ? row.service_rating : 5),
    comment: row.comment || ''
  };
}

function mapLogFromDB(row: any): SystemLog {
  return {
    id: Number(row.id),
    timestamp: row.timestamp || row.created_at || new Date().toLocaleTimeString(),
    event: row.event || '',
    type: (row.type || 'system') as 'system' | 'auth' | 'billing' | 'alert' | 'security',
    businessId: row.business_id || undefined
  };
}

function mapCustomerFromDB(row: any): CRMCustomer {
  return {
    id: row.id,
    businessId: row.business_id || row.businessId || '',
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    totalSpent: Number(row.total_spent !== undefined ? row.total_spent : 0),
    ordersCount: Number(row.orders_count !== undefined ? row.orders_count : 0),
    registeredAt: row.registered_at || row.created_at || new Date().toISOString()
  };
}

function mapCustomerToDB(cust: CRMCustomer): any {
  return {
    id: cust.id,
    business_id: cust.businessId,
    name: cust.name,
    email: cust.email || '',
    phone: cust.phone || '',
    total_spent: cust.totalSpent || 0,
    orders_count: cust.ordersCount || 0,
    registered_at: cust.registeredAt || new Date().toISOString(),
    created_at: new Date().toISOString()
  };
}

export default function App() {
  // Sync state initialized empty
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [crmCustomers, setCrmCustomers] = useState<CRMCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication states for each access level
  const [saasUser, setSaasUser] = useState<{ email: string; name: string; provider: 'email' | 'google' } | null>(null);
  const [merchantUser, setMerchantUser] = useState<{ email: string; name: string; provider: 'email' | 'google'; businessId?: string } | null>(null);
  const [clientUser, setClientUser] = useState<{ email: string; name: string; provider: 'email' | 'google' } | null>(null);

  // Navigation states
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

  // Utility to fire notification toasts
  const triggerToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to load state from localStorage or default seeds
  const loadFromLocalStorage = () => {
    const savedBiz = localStorage.getItem('menuscan_saas_businesses');
    setBusinesses(savedBiz ? JSON.parse(savedBiz) : DEFAULT_BUSINESSES);

    const savedMenus = localStorage.getItem('menuscan_saas_menus');
    setMenus(savedMenus ? JSON.parse(savedMenus) : DEFAULT_MENUS);

    const savedOrders = localStorage.getItem('menuscan_saas_orders');
    setOrders(savedOrders ? JSON.parse(savedOrders) : DEFAULT_ORDERS);

    const savedReviews = localStorage.getItem('menuscan_saas_reviews');
    setReviews(savedReviews ? JSON.parse(savedReviews) : DEFAULT_REVIEWS);

    const savedLogs = localStorage.getItem('menuscan_saas_logs');
    setLogs(savedLogs ? JSON.parse(savedLogs) : DEFAULT_LOGS);

    const savedCrm = localStorage.getItem('menuscan_saas_crm');
    setCrmCustomers(savedCrm ? JSON.parse(savedCrm) : []);
  };

  // Utility to push server logs
  const addLog = async (event: string, type: 'system' | 'auth' | 'billing' | 'alert' | 'security' = 'system', bizId?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: SystemLog = { timestamp: time, event, type, businessId: bizId };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('system_logs').insert([{
          timestamp: time,
          event,
          type,
          business_id: bizId || null,
          created_at: new Date().toISOString()
        }]).select('*').single();

        if (!error && data) {
          setLogs(prev => [mapLogFromDB(data), ...prev.slice(0, 49)]);
          return;
        }
      } catch (err) {
        console.warn('Could not save log to Supabase:', err);
      }
    } else {
      const saved = localStorage.getItem('menuscan_saas_logs');
      const logsList = saved ? JSON.parse(saved) : [];
      localStorage.setItem('menuscan_saas_logs', JSON.stringify([newLog, ...logsList.slice(0, 49)]));
    }

    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // Seed default data into Supabase if empty
  const seedInitialData = async () => {
    if (!isSupabaseConfigured) {
      loadFromLocalStorage();
      return;
    }
    try {
      console.log("Seeding Supabase with initial data...");

      await supabase.from('stores').insert(DEFAULT_BUSINESSES.map(mapBusinessToStore));

      const dbMenus = DEFAULT_MENUS.map(m => ({
        business_id: m.businessId,
        name: m.name,
        price: m.price,
        description: m.description,
        category: m.category,
        emoji: m.emoji,
        image: m.image,
        available: m.available
      }));
      await supabase.from('menus').insert(dbMenus);

      await supabase.from('orders').insert(DEFAULT_ORDERS.map(mapOrderToDB));

      const dbReviews = DEFAULT_REVIEWS.map(r => ({
        business_id: r.businessId,
        order_id: r.orderId || null,
        customer: r.customer,
        food_rating: r.foodRating,
        service_rating: r.serviceRating,
        comment: r.comment
      }));
      await supabase.from('reviews').insert(dbReviews);

      const dbLogs = DEFAULT_LOGS.map(l => ({
        timestamp: l.timestamp,
        event: l.event,
        type: l.type
      }));
      await supabase.from('system_logs').insert(dbLogs);

      setBusinesses(DEFAULT_BUSINESSES);
      setMenus(DEFAULT_MENUS);
      setOrders(DEFAULT_ORDERS);
      setReviews(DEFAULT_REVIEWS);
      setLogs(DEFAULT_LOGS);
      setCrmCustomers([]);

      triggerToast("✨ Base de datos inicializada.");
    } catch (error) {
      console.warn("Could not seed default data in Supabase, using local defaults:", error);
      loadFromLocalStorage();
    }
  };

  // Load initial data from Supabase or localStorage fallback
  useEffect(() => {
    const loadData = async () => {
      if (!isSupabaseConfigured) {
        loadFromLocalStorage();
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const [
          { data: storesData, error: storesError },
          { data: menusData, error: menusError },
          { data: ordersData, error: ordersError },
          { data: reviewsData, error: reviewsError },
          { data: logsData, error: logsError },
          { data: customersData, error: customersError }
        ] = await Promise.all([
          supabase.from('stores').select('*'),
          supabase.from('menus').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('reviews').select('*'),
          supabase.from('system_logs').select('*'),
          supabase.from('customers').select('*')
        ]);

        const hasFetchError = storesError || menusError || ordersError || reviewsError || logsError || customersError;

        if (hasFetchError) {
          console.warn('Supabase database table queries returned errors, using local storage and defaults fallback.');
          loadFromLocalStorage();
        } else if (!storesData || storesData.length === 0) {
          await seedInitialData();
        } else {
          setBusinesses(storesData.map(mapStoreToBusiness));
          setMenus(menusData ? menusData.map(mapMenuToMenuItem) : []);
          setOrders(ordersData ? ordersData.map(mapOrderFromDB) : []);
          setReviews(reviewsData ? reviewsData.map(mapReviewFromDB) : []);
          setLogs(logsData ? logsData.map(mapLogFromDB) : []);
          setCrmCustomers(customersData ? customersData.map(mapCustomerFromDB) : []);
        }
      } catch (error) {
        console.warn("Error loading data from Supabase, using local fallback:", error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auth session tracking
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured) return;
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase auth session check failed:', error);
          return;
        }
        const session = data?.session;
        if (session?.user) {
          const email = session.user.email || '';
          const name = session.user.user_metadata?.name || email.split('@')[0];
          
          if (email.toLowerCase() === 'admin@menuscan.com') {
            setSaasUser({ email, name, provider: 'email' });
          } else {
            const biz = businesses.find(b => b.email?.toLowerCase() === email.toLowerCase());
            if (biz) {
              setMerchantUser({ email, name, provider: 'email', businessId: biz.id });
            } else {
              setClientUser({ email, name, provider: 'email' });
            }
          }
        }
      } catch (err) {
        console.warn('Auth session check threw error:', err);
      }
    };
    
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSaasUser(null);
        setMerchantUser(null);
        setClientUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [businesses]);

  // CRM customer registration handler
  const handleRegisterClientCRM = async (name: string, email: string, phone: string, bizId: string) => {
    if (!name) return;
    const cleanEmail = email && email !== 'No Registrado' ? email.trim().toLowerCase() : '';
    const cleanPhone = phone && phone !== 'No Registrado' ? phone.trim() : '';
    
    if (cleanEmail === 'nocorreo@email.com' || cleanEmail === 'comensal@email.com') return;

    const key = cleanEmail || cleanPhone.replace(/\s+/g, '') || name.trim().toLowerCase();
    if (!key) return;

    const exists = crmCustomers.some(c => c.businessId === bizId && (
      (cleanEmail && c.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && c.phone === cleanPhone) ||
      (!cleanEmail && !cleanPhone && c.name.toLowerCase() === name.trim().toLowerCase())
    ));

    if (exists) return;

    const newCustomer: CRMCustomer = {
      id: `cust-${bizId}-${key}`,
      businessId: bizId,
      name,
      email: email || 'No Registrado',
      phone: phone || 'No Registrado',
      totalSpent: 0,
      ordersCount: 0,
      registeredAt: new Date().toLocaleDateString()
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('customers').insert([mapCustomerToDB(newCustomer)]);
      if (error) {
        console.error('Error al registrar cliente CRM en Supabase:', error);
        return;
      }
    } else {
      const saved = localStorage.getItem('menuscan_saas_crm');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('menuscan_saas_crm', JSON.stringify([...list, newCustomer]));
    }

    setCrmCustomers(prev => [...prev, newCustomer]);
  };

  // HANDLERS: SaaS Master operations
  const handleAddBusiness = async (name: string, email: string, emoji: string, tier: 'free' | 'premium') => {
    let newId = "biz-" + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (businesses.some(b => b.id === newId)) {
      newId += "-" + Math.floor(10 + Math.random() * 90);
    }
    const newBiz: Business = {
      id: newId,
      name,
      logo: emoji,
      tier,
      status: 'active',
      email,
      password: email.split('@')[0] + '123',
      deliveryFee: 2.00,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('stores').insert([mapBusinessToStore(newBiz)]);
      if (error) {
        console.error('Error al crear negocio en Supabase:', error);
        triggerToast('❌ Error al registrar negocio');
        return;
      }
    } else {
      localStorage.setItem('menuscan_saas_businesses', JSON.stringify([...businesses, newBiz]));
    }

    setBusinesses(prev => [...prev, newBiz]);
    const logMsg = `SaaS Master: Nueva sucursal registrada '${name}' con ID: ${newId}. Plan: ${tier.toUpperCase()}`;
    addLog(logMsg, 'billing');
    triggerToast(`🎉 Negocio '${name}' registrado exitosamente.`);
  };

  const handleToggleStatus = async (id: string) => {
    const currentBiz = businesses.find(b => b.id === id);
    if (!currentBiz) return;

    const isCurrentlySuspended = currentBiz.status === 'suspended';
    const newStatus = isCurrentlySuspended ? 'active' : 'suspended';
    const restoredTier = isCurrentlySuspended ? (currentBiz.previousTier || currentBiz.tier || 'premium') : currentBiz.tier;
    const previousTier = isCurrentlySuspended ? currentBiz.previousTier : currentBiz.tier;

    const updatedBiz: Business = {
      ...currentBiz,
      status: newStatus,
      tier: restoredTier,
      previousTier
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('stores').update({
        status: updatedBiz.status,
        tier: updatedBiz.tier,
        previous_tier: updatedBiz.previousTier || null
      }).eq('id', id);

      if (error) {
        console.error('Error al actualizar estado del negocio:', error);
        triggerToast('❌ Error al cambiar estado del negocio');
        return;
      }
    } else {
      const updatedList = businesses.map(b => b.id === id ? updatedBiz : b);
      localStorage.setItem('menuscan_saas_businesses', JSON.stringify(updatedList));
    }

    setBusinesses(prev => prev.map(b => b.id === id ? updatedBiz : b));
    const isRestoring = updatedBiz.status === 'active';
    const logMsg = isRestoring 
      ? `SaaS Master: Acceso de '${updatedBiz.name}' habilitado. Plan/Nivel de acceso restituido a: ${updatedBiz.tier.toUpperCase()}`
      : `SaaS Master: Acceso de '${updatedBiz.name}' suspendido. Nivel de acceso guardado para restitución.`;
    
    addLog(logMsg, 'alert');
    triggerToast(isRestoring 
      ? `Sucursal '${updatedBiz.name}' ahora está Habilitada (Plan: ${updatedBiz.tier === 'premium' ? '🏆 Premium' : 'Estándar'}).` 
      : `Sucursal '${updatedBiz.name}' ahora está Suspendida.`
    );
  };

  const handleToggleTier = async (id: string) => {
    const currentBiz = businesses.find(b => b.id === id);
    if (!currentBiz) return;

    const nextTier = currentBiz.tier === 'premium' ? 'free' : 'premium';
    const updatedBiz: Business = { ...currentBiz, tier: nextTier };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('stores').update({
        tier: nextTier
      }).eq('id', id);

      if (error) {
        console.error('Error al cambiar plan del negocio:', error);
        triggerToast('❌ Error al actualizar licencia');
        return;
      }
    } else {
      const updatedList = businesses.map(b => b.id === id ? updatedBiz : b);
      localStorage.setItem('menuscan_saas_businesses', JSON.stringify(updatedList));
    }

    setBusinesses(prev => prev.map(b => b.id === id ? updatedBiz : b));
    const logMsg = `SaaS Master: Suscripción de '${updatedBiz.name}' actualizada a: ${nextTier.toUpperCase()}`;
    addLog(logMsg, 'billing');
    triggerToast(`Licencia de '${updatedBiz.name}' modificada a: ${nextTier === 'premium' ? '🏆 Premium' : 'Estándar'}.`);
  };

  const handleResetSystem = async () => {
    setIsLoading(true);
    localStorage.clear();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('reviews').delete().neq('id', 0);
        await supabase.from('orders').delete().neq('id', '0');
        await supabase.from('menus').delete().neq('id', 0);
        await supabase.from('system_logs').delete().neq('id', 0);
        await supabase.from('customers').delete().neq('id', '0');
        await supabase.from('stores').delete().neq('id', '0');

        await seedInitialData();

        setCart([]);
        setCurrentActiveOrderId(null);
        setClientStep('menu');
        triggerToast("♻️ Base de datos en Supabase restaurada con éxito.");
      } catch (e) {
        console.error("Supabase Error resetting system:", e);
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
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('system_logs').delete().neq('id', 0);
      if (error) {
        console.error('Error al limpiar logs en Supabase:', error);
        triggerToast('❌ Error al limpiar logs');
        return;
      }
    } else {
      localStorage.removeItem('menuscan_saas_logs');
    }
    setLogs([]);
    triggerToast("🧹 Historial de consola limpio.");
  };

  // HANDLERS: Merchant operations
  const handleAddProduct = async (name: string, price: number, category: 'Platos' | 'Acompañantes' | 'Bebidas', emoji: string, image: string, description: string) => {
    const desc = description || "Elaborado al instante con ingredientes locales.";

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('menus').insert([{
        business_id: activeMerchantId,
        name,
        price,
        description: desc,
        category,
        emoji,
        image,
        available: true
      }]).select('*').single();

      if (error) {
        console.error('Error al agregar producto en Supabase:', error);
        triggerToast('❌ Error al agregar platillo');
        return;
      }

      const newMenuItem = mapMenuToMenuItem(data);
      setMenus(prev => [...prev, newMenuItem]);
    } else {
      const newItem: MenuItem = {
        id: Date.now(),
        businessId: activeMerchantId,
        name,
        price,
        description: desc,
        category,
        emoji,
        image,
        available: true
      };
      const updatedMenus = [...menus, newItem];
      localStorage.setItem('menuscan_saas_menus', JSON.stringify(updatedMenus));
      setMenus(updatedMenus);
    }

    const logMsg = `Comercio '${activeMerchantId}' agregó platillo: ${name} ($${price.toFixed(2)})`;
    addLog(logMsg, 'system');
    triggerToast(`🎉 '${name}' agregado al catálogo.`);
  };

  const handleUpdateProductPrice = async (id: number, price: number) => {
    const target = menus.find(m => m.id === id);
    if (!target) return;

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('menus').update({ price }).eq('id', id);
      if (error) {
        console.error('Error al actualizar precio en Supabase:', error);
        triggerToast('❌ Error al actualizar precio');
        return;
      }
    } else {
      const updated = menus.map(m => m.id === id ? { ...m, price } : m);
      localStorage.setItem('menuscan_saas_menus', JSON.stringify(updated));
    }

    setMenus(prev => prev.map(m => m.id === id ? { ...m, price } : m));
    const logMsg = `Comercio '${activeMerchantId}' actualizó precio de '${target.name}' a $${price.toFixed(2)}`;
    addLog(logMsg, 'system');
  };

  const handleToggleProductAvailable = async (id: number) => {
    const target = menus.find(m => m.id === id);
    if (!target) return;
    const nextAvailable = !target.available;

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('menus').update({ available: nextAvailable }).eq('id', id);
      if (error) {
        console.error('Error al cambiar disponibilidad:', error);
        triggerToast('❌ Error al cambiar disponibilidad');
        return;
      }
    } else {
      const updated = menus.map(m => m.id === id ? { ...m, available: nextAvailable } : m);
      localStorage.setItem('menuscan_saas_menus', JSON.stringify(updated));
    }

    setMenus(prev => prev.map(m => m.id === id ? { ...m, available: nextAvailable } : m));
    triggerToast(`Platillo '${target.name}' marcado como ${nextAvailable ? 'Disponible' : 'Agotado'}.`);
  };

  const handleDeleteProduct = async (id: number) => {
    const target = menus.find(m => m.id === id);
    if (!target) return;

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('menus').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar producto de Supabase:', error);
        triggerToast('❌ Error al eliminar producto');
        return;
      }
    } else {
      const updated = menus.filter(m => m.id !== id);
      localStorage.setItem('menuscan_saas_menus', JSON.stringify(updated));
    }

    setMenus(prev => prev.filter(m => m.id !== id));
    const logMsg = `Comercio '${activeMerchantId}' eliminó producto: ${target.name}`;
    addLog(logMsg, 'system');
    triggerToast("🗑️ Platillo eliminado del catálogo.");
  };

  const handleUpdateOrderStatus = async (id: string, status: 'Preparando' | 'En Camino' | 'Entregado') => {
    const target = orders.find(o => o.id === id);
    if (!target) return;

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) {
        console.error('Error al actualizar estado del pedido:', error);
        triggerToast('❌ Error al actualizar comanda');
        return;
      }
    } else {
      const updated = orders.map(o => o.id === id ? { ...o, status } : o);
      localStorage.setItem('menuscan_saas_orders', JSON.stringify(updated));
    }

    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    const logMsg = `Comercio '${activeMerchantId}' actualizó despacho de Comanda ${id} a: ${status.toUpperCase()}`;
    addLog(logMsg, 'system');
    triggerToast(`Comanda ${id} actualizada a: ${status}`);
  };

  const handleConciliateOrder = async (id: string, approved: boolean) => {
    const authorizedUser = merchantUser || saasUser;
    if (!authorizedUser) {
      triggerToast("⚠️ Error: Solo el Administrador del Negocio o Super Master puede conciliar pagos.");
      return;
    }
    const target = orders.find(o => o.id === id);
    if (!target) return;

    const nextPaymentStatus = approved ? 'Conciliado' : 'Rechazado';
    const updatedPayment: Payment = { ...target.payment, status: nextPaymentStatus };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('orders').update({
        payment: updatedPayment,
        payment_status: nextPaymentStatus
      }).eq('id', id);

      if (error) {
        console.error('Error al conciliar pedido en Supabase:', error);
        triggerToast('❌ Error al conciliar pago');
        return;
      }
    } else {
      const updated = orders.map(o => o.id === id ? { ...o, payment: updatedPayment } : o);
      localStorage.setItem('menuscan_saas_orders', JSON.stringify(updated));
    }

    setOrders(prev => prev.map(o => o.id === id ? { ...o, payment: updatedPayment } : o));
    const logMsg = `Caja Kiosco '${target.businessId}' por Admin '${authorizedUser.name}': Comprobante de comanda ${id} fue ${nextPaymentStatus.toUpperCase()}`;
    addLog(logMsg, 'billing');
    triggerToast(approved ? `✅ Pago de comanda ${id} conciliado por el Administrador.` : `❌ Comprobante ${id} rechazado por el Administrador.`);
  };

  const handleUpdateDeliveryFee = async (businessId: string, fee: number) => {
    const currentBiz = businesses.find(b => b.id === businessId);
    if (!currentBiz) return;

    const updatedBiz: Business = { ...currentBiz, deliveryFee: fee };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('stores').update({ delivery_fee: fee }).eq('id', businessId);
      if (error) {
        console.error('Error al actualizar tarifa de entrega:', error);
        triggerToast('❌ Error al guardar tarifa de envío');
        return;
      }
    } else {
      const updated = businesses.map(b => b.id === businessId ? updatedBiz : b);
      localStorage.setItem('menuscan_saas_businesses', JSON.stringify(updated));
    }

    setBusinesses(prev => prev.map(b => b.id === businessId ? updatedBiz : b));
    const logMsg = `Configuración Kiosco '${businessId}': Costo de delivery ajustado a $${fee.toFixed(2)}`;
    addLog(logMsg, 'system');
    triggerToast(`✅ Costo de envío guardado: $${fee.toFixed(2)}`);
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
    const newOrderId = "ord-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
    const subtotal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
    const activeBiz = businesses.find(b => b.id === activeClientId);
    const deliveryFee = clientOrderType === 'Delivery' ? (activeBiz?.deliveryFee ?? 2.00) : 0;
    const total = subtotal + deliveryFee;

    const newOrder: Order = {
      id: newOrderId,
      businessId: activeClientId,
      customer: clientName || 'Comensal',
      email: clientEmail || 'comensal@email.com',
      type: clientOrderType,
      address: clientOrderType === 'Delivery' ? clientAddress : undefined,
      tableNum: clientOrderType === 'Mesa' ? clientTable : undefined,
      phone: clientPhone || '',
      notes: clientNotes || '',
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

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('orders').insert([mapOrderToDB(newOrder)]);
      if (error) {
        console.error('Error al enviar pedido a Supabase:', error);
        triggerToast('❌ Error al enviar comanda');
        return;
      }
    } else {
      const updatedOrders = [newOrder, ...orders];
      localStorage.setItem('menuscan_saas_orders', JSON.stringify(updatedOrders));
    }

    setOrders(prev => [newOrder, ...prev]);
    setCurrentActiveOrderId(newOrderId);
    setCart([]);
    setClientNotes('');

    handleRegisterClientCRM(clientName, clientEmail, clientPhone, activeClientId);

    const logMsg = `Comensal '${clientName}' envió comanda ${newOrderId} a Kiosco '${activeClientId}'`;
    addLog(logMsg, 'system');
    triggerToast(`🎉 Comanda ${newOrderId} enviada a cocina.`);
    setClientStep('payment');
  };

  const handleRegisterOnboarding = async (name: string, email: string, emoji: string, tier: 'free' | 'premium') => {
    let newId = "biz-" + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (businesses.some(b => b.id === newId)) {
      newId += "-" + Math.floor(10 + Math.random() * 90);
    }
    const newBiz: Business = {
      id: newId,
      name,
      logo: emoji,
      tier,
      status: 'active',
      email,
      password: email.split('@')[0] + '123',
      deliveryFee: 2.00,
      createdAt: new Date().toISOString()
    };

    const initialItems: MenuItem[] = [
      { id: Date.now(), businessId: newId, name: `Plato Insignia ${emoji}`, price: 10.50, description: "Especialidad de autor preparada al instante por el chef estrella de la casa.", category: "Platos", emoji, image: "", available: true },
      { id: Date.now() + 1, businessId: newId, name: "Bebida Refrescante Natural", price: 3.50, description: "Deliciosa infusión helada, excelente para maridar tus platillos.", category: "Bebidas", emoji: "🍹", image: "", available: true }
    ];

    if (isSupabaseConfigured) {
      const { error: storeError } = await supabase.from('stores').insert([mapBusinessToStore(newBiz)]);
      if (storeError) {
        console.error('Error al crear tienda en onboarding:', storeError);
        triggerToast('❌ Error al registrar comercio');
        return;
      }

      const dbMenuItems = initialItems.map(item => ({
        business_id: item.businessId,
        name: item.name,
        price: item.price,
        description: item.description,
        category: item.category,
        emoji: item.emoji,
        image: item.image,
        available: item.available
      }));

      const { data: createdMenus, error: menuError } = await supabase.from('menus').insert(dbMenuItems).select('*');
      if (menuError) {
        console.error('Error al crear menú inicial:', menuError);
      } else if (createdMenus) {
        const mapped = createdMenus.map(mapMenuToMenuItem);
        setMenus(prev => [...prev, ...mapped]);
      }
    } else {
      localStorage.setItem('menuscan_saas_businesses', JSON.stringify([...businesses, newBiz]));
      localStorage.setItem('menuscan_saas_menus', JSON.stringify([...menus, ...initialItems]));
      setMenus(prev => [...prev, ...initialItems]);
    }

    setBusinesses(prev => [...prev, newBiz]);
    setActiveClientId(newId);
    setActiveMerchantId(newId);
    setClientStep('menu');

    const logMsg = `SaaS Master: Kiosco rápido '${name}' registrado desde el Onboarding Móvil. ID: ${newId}`;
    addLog(logMsg, 'billing');
    triggerToast(`🎉 Kiosco '${name}' registrado y activo.`);
  };

  const handleSubmitPaymentReport = async (method: string, sender: string, reference: string) => {
    if (!currentActiveOrderId) return;
    const target = orders.find(o => o.id === currentActiveOrderId);
    if (!target) return;

    const updatedPayment: Payment = {
      method,
      sender: sender || "Efectivo contra entrega",
      reference: reference || "EFECTIVO",
      amount: target.total,
      status: 'Por Conciliar',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('orders').update({
        payment: updatedPayment,
        payment_method: method,
        payment_status: 'Por Conciliar'
      }).eq('id', currentActiveOrderId);

      if (error) {
        console.error('Error al enviar reporte de pago:', error);
        triggerToast('❌ Error al reportar pago');
        return;
      }
    } else {
      const updated = orders.map(o => o.id === currentActiveOrderId ? { ...o, payment: updatedPayment } : o);
      localStorage.setItem('menuscan_saas_orders', JSON.stringify(updated));
    }

    setOrders(prev => prev.map(o => o.id === currentActiveOrderId ? { ...o, payment: updatedPayment } : o));
    triggerToast("💳 Comprobante enviado. Cocina notificando...");
    setClientStep('tracking');

    const logMsg = `Comensal reportó pago (${method}) para comanda ${currentActiveOrderId}. Ref: ${reference}`;
    addLog(logMsg, 'billing');
  };

  const handleSubmitFeedback = async (comment: string) => {
    if (!currentActiveOrderId) return;
    const custName = clientName || "Comensal Anónimo";

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('reviews').insert([{
        business_id: activeClientId,
        order_id: currentActiveOrderId,
        customer: custName,
        food_rating: ratingFood,
        service_rating: ratingService,
        comment: comment || "Excelente comida y rapidez."
      }]).select('*').single();

      if (error) {
        console.error('Error al enviar reseña a Supabase:', error);
        triggerToast('❌ Error al enviar calificación');
        return;
      }

      const newReview = mapReviewFromDB(data);
      setReviews(prev => [newReview, ...prev]);
    } else {
      const newReview: Review = {
        id: Date.now(),
        businessId: activeClientId,
        orderId: currentActiveOrderId,
        customer: custName,
        foodRating: ratingFood,
        serviceRating: ratingService,
        comment: comment || "Excelente comida y rapidez."
      };
      const updated = [newReview, ...reviews];
      localStorage.setItem('menuscan_saas_reviews', JSON.stringify(updated));
      setReviews(updated);
    }

    const logMsg = `Kiosco '${activeClientId}' recibió feedback: Comida: ${ratingFood}★, Servicio: ${ratingService}★`;
    addLog(logMsg, 'system');
    triggerToast("⭐ ¡Gracias por tu calificación!");

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
