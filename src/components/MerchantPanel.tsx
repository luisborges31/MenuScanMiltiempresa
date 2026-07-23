/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Clipboard, BarChart2, Users, Star, 
  Trash2, Plus, Check, X, ShieldAlert, Download, Share2, 
  DollarSign, Truck, Sparkles, PlusCircle, CheckCircle2
} from 'lucide-react';
import { Business, MenuItem, Order, Review, CRMCustomer } from '../types';

interface MerchantPanelProps {
  businesses: Business[];
  activeMerchantId: string;
  menus: MenuItem[];
  orders: Order[];
  reviews: Review[];
  onAddProduct: (name: string, price: number, category: 'Platos' | 'Acompañantes' | 'Bebidas', emoji: string, image: string, description: string) => void;
  onUpdateProductPrice: (id: number, price: number) => void;
  onToggleProductAvailable: (id: number) => void;
  onDeleteProduct: (id: number) => void;
  onUpdateOrderStatus: (id: string, status: 'Preparando' | 'En Camino' | 'Entregado') => void;
  onConciliateOrder: (id: string, approved: boolean) => void;
  onSelectMerchant: (id: string) => void;
  triggerToast: (text: string) => void;
  merchantUser?: { email: string; name: string; provider: 'email' | 'google' } | null;
  crmCustomers?: CRMCustomer[];
  onUpdateDeliveryFee?: (businessId: string, fee: number) => void;
}

export default function MerchantPanel({
  businesses,
  activeMerchantId,
  menus,
  orders,
  reviews,
  onAddProduct,
  onUpdateProductPrice,
  onToggleProductAvailable,
  onDeleteProduct,
  onUpdateOrderStatus,
  onConciliateOrder,
  onSelectMerchant,
  triggerToast,
  merchantUser,
  crmCustomers = [],
  onUpdateDeliveryFee
}: MerchantPanelProps) {
  const [merchantTab, setMerchantTab] = useState<'orders' | 'menu-editor' | 'metrics' | 'crm' | 'feedback'>('orders');
  const [metricsInterval, setMetricsInterval] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>('');

  // Active business context
  const activeBiz = businesses.find(b => b.id === activeMerchantId) || businesses[0];

  useEffect(() => {
    if (activeBiz) {
      setDeliveryFeeInput((activeBiz.deliveryFee ?? 2.00).toFixed(2));
    }
  }, [activeMerchantId, activeBiz?.id]);

  // Form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCat, setNewProdCat] = useState<'Platos' | 'Acompañantes' | 'Bebidas'>('Platos');
  const [newProdEmoji, setNewProdEmoji] = useState('🍔');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');

  if (!activeBiz) return <div className="p-4 text-center">Registra un kiosco primero.</div>;

  const isPremium = activeBiz.tier === 'premium';

  // Filters
  const isolatedMenu = menus.filter(m => m.businessId === activeBiz.id);
  const isolatedOrders = [...orders]
    .filter(o => o.businessId === activeBiz.id)
    .sort((a, b) => {
      const getTime = (o: Order) => {
        const rawDate = o.createdAt || o.timestamp || o.date;
        const parsed = new Date(rawDate).getTime();
        if (!isNaN(parsed)) return parsed;
        if (o.date && o.timestamp) {
          const combined = new Date(`${o.date} ${o.timestamp}`).getTime();
          if (!isNaN(combined)) return combined;
        }
        return 0;
      };
      return getTime(b) - getTime(a);
    });
  const isolatedReviews = reviews.filter(r => r.businessId === activeBiz.id);

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newProdPrice);
    if (!newProdName.trim() || isNaN(price)) {
      triggerToast("⚠️ Completa nombre y precio del platillo.");
      return;
    }
    onAddProduct(newProdName, price, newProdCat, newProdEmoji, isPremium ? newProdImage : '', newProdDesc);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setNewProdImage('');
  };

  // Compute stats
  let grossSales = 0;
  let grossOrdersCount = 0;
  let grossUnitsCount = 0;

  let netConciliated = 0;
  let conciliatedOrdersCount = 0;
  let conciliatedUnitsCount = 0;

  let pendingConciliation = 0;
  let pendingOrdersCount = 0;
  let pendingUnitsCount = 0;

  let totalDeliverySold = 0;
  let deliveryOrdersCount = 0;
  let deliveryUnitsCount = 0;

  isolatedOrders.forEach(o => {
    const orderUnits = o.items.reduce((acc, it) => acc + it.qty, 0);

    if (o.payment.status !== 'Rechazado') {
      grossSales += o.total;
      grossOrdersCount += 1;
      grossUnitsCount += orderUnits;

      if (o.type === 'Delivery') {
        totalDeliverySold += o.total;
        deliveryOrdersCount += 1;
        deliveryUnitsCount += orderUnits;
      }
    }

    if (o.payment.status === 'Conciliado') {
      netConciliated += o.total;
      conciliatedOrdersCount += 1;
      conciliatedUnitsCount += orderUnits;
    } else if (o.payment.status === 'Por Conciliar') {
      pendingConciliation += o.total;
      pendingOrdersCount += 1;
      pendingUnitsCount += orderUnits;
    }
  });

  // Unique CRM customer list
  const getUniqueCustomers = () => {
    const customerMap: Record<string, { name: string; phone: string; email: string; totalSpent: number; ordersCount: number; registeredAt?: string }> = {};
    
    // First, seed with any explicit client registrations for this business
    if (crmCustomers) {
      crmCustomers.filter(c => c.businessId === activeBiz.id).forEach(c => {
        const key = c.email && c.email !== 'No Registrado' ? c.email.trim().toLowerCase() : c.phone.replace(/\s+/g, '');
        if (key) {
          customerMap[key] = {
            name: c.name,
            phone: c.phone,
            email: c.email,
            totalSpent: c.totalSpent || 0,
            ordersCount: c.ordersCount || 0,
            registeredAt: c.registeredAt || new Date().toLocaleDateString()
          };
        }
      });
    }

    // Then layer in customers from orders (updating totalSpent and ordersCount)
    isolatedOrders.forEach(o => {
      const key = o.email ? o.email.trim().toLowerCase() : o.phone.replace(/\s+/g, '');
      if (!customerMap[key] && o.customer) {
        customerMap[key] = {
          name: o.customer,
          phone: o.phone || 'No Registrado',
          email: o.email || 'No Registrado',
          totalSpent: 0,
          ordersCount: 0,
          registeredAt: new Date().toLocaleDateString()
        };
      }
      if (customerMap[key]) {
        customerMap[key].ordersCount += 1;
        if (o.payment.status === 'Conciliado') {
          customerMap[key].totalSpent += o.total;
        }
      }
    });
    return Object.values(customerMap);
  };

  const handleExportCSV = (mode: 'copy' | 'download') => {
    const list = getUniqueCustomers();
    if (list.length === 0) {
      triggerToast("⚠️ No hay clientes para exportar.");
      return;
    }

    let csvContent = "Nombre,Telefono,Correo,Pedidos,Monto Gastado\n";
    list.forEach(c => {
      csvContent += `"${c.name}","${c.phone}","${c.email}",${c.ordersCount},${c.totalSpent.toFixed(2)}\n`;
    });

    if (mode === 'copy') {
      const textarea = document.createElement('textarea');
      textarea.value = csvContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      triggerToast("📋 CSV copiado al portapapeles.");
    } else {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `menuscan_crm_${activeBiz.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast("📥 Descarga de CSV iniciada.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector and business Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-lg shrink-0">
            {activeBiz.logo}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">{activeBiz.name}</h2>
              {isPremium ? (
                <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                  🏆 Premium
                </span>
              ) : (
                <span className="bg-slate-850 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-800 uppercase tracking-wider">
                  Estándar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Gestor operativo del Kiosco de Alimentos</p>
          </div>
        </div>

        {/* Change context selector */}
        {merchantUser?.email?.toLowerCase() === 'luisborges31@gmail.com' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" /> Súper Master (Multi-Kioscos):
            </span>
            <select 
              value={activeMerchantId} 
              onChange={(e) => onSelectMerchant(e.target.value)}
              className="bg-slate-900 border border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.logo} {b.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5">
            <span>🔒 Aislamiento RLS de Sucursal</span>
          </div>
        )}
      </div>

      {/* Tabs list menu */}
      <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 flex overflow-x-auto no-scrollbar shadow-inner">
        <button 
          onClick={() => setMerchantTab('orders')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${merchantTab === 'orders' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📥 Comandas Cocina
        </button>
        <button 
          onClick={() => setMerchantTab('menu-editor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${merchantTab === 'menu-editor' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📝 Editor de Catálogo
        </button>
        <button 
          onClick={() => setMerchantTab('metrics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${merchantTab === 'metrics' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          📊 Caja & Auditoría
        </button>
        <button 
          onClick={() => setMerchantTab('crm')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${merchantTab === 'crm' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          👥 Clientes CRM
        </button>
        <button 
          onClick={() => setMerchantTab('feedback')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${merchantTab === 'feedback' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          ⭐ Reputación
        </button>
      </div>

      {/* NESTED TAB VIEWS */}

      {/* 1. ORDERS / COMANDAS */}
      {merchantTab === 'orders' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Comandas Activas</h3>
          {isolatedOrders.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-bold">No hay comandas activas para este Kiosco.</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Usa el simulador del celular a la derecha para enviar un pedido.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {isolatedOrders.map((order) => (
                <div key={order.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-md">
                  {/* Order metadata */}
                  <div className="flex flex-col md:flex-row justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{order.customer}</h4>
                        <span className="bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded-md">
                          {order.type}
                        </span>
                        {order.tableNum && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                            Mesa: {order.tableNum}
                          </span>
                        )}
                        {order.address && (
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-md font-semibold max-w-xs truncate">
                            🛵 Dir: {order.address}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">ID: {order.id} • Recibido a las {order.timestamp} • {order.date}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">Cocina:</span>
                      <select 
                        value={order.status} 
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-lg font-bold focus:outline-none"
                      >
                        <option value="Preparando">🍳 Preparando</option>
                        <option value="En Camino">🛵 En Camino / Despachado</option>
                        <option value="Entregado">✅ Entregado</option>
                      </select>
                    </div>
                  </div>

                  {/* Items and notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Productos</h5>
                      <div className="divide-y divide-slate-800/40 space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-300 py-1.5">
                            <span className="font-semibold">{it.qty}x {it.emoji} {it.name}</span>
                            <span className="font-bold text-white">${(it.price * it.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Prep notes */}
                      <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${order.notes ? 'bg-amber-950/20 border-amber-800/30 text-amber-200' : 'bg-slate-950/60 border-slate-850 text-slate-500'}`}>
                        <span className={`font-bold block uppercase tracking-wider text-[9px] ${order.notes ? 'text-amber-400' : 'text-slate-400'}`}>
                          📝 Instrucciones del Comensal:
                        </span>
                        <p className="mt-0.5 italic">{order.notes ? `"${order.notes}"` : 'Sin adiciones especiales.'}</p>
                      </div>
                    </div>

                    {/* Audit logs & payment verify */}
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verificación de Pago</span>
                          {order.payment.status === 'Por Conciliar' ? (
                            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                              ⏳ Por Conciliar
                            </span>
                          ) : order.payment.status === 'Conciliado' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                              ✅ Conciliado
                            </span>
                          ) : order.payment.status === 'Rechazado' ? (
                            <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded border border-rose-500/20">
                              ❌ Rechazado
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded">
                              Pendiente
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-400">
                          <p className="flex justify-between"><span>Método:</span> <span className="font-semibold text-white">{order.payment.method}</span></p>
                          <p className="flex justify-between"><span>Emisor:</span> <span className="font-semibold text-white truncate max-w-[150px]">{order.payment.sender || 'N/A'}</span></p>
                          <p className="flex justify-between items-center">
                            <span>Código de Referencia:</span> 
                            <span className="font-mono text-[10px] font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-white select-all">
                              {order.payment.reference || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Reconciliation controls */}
                      <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Monto Comanda</span>
                          <span className="text-base font-black text-brand-500">${order.total.toFixed(2)}</span>
                        </div>

                        {order.payment.status === 'Por Conciliar' ? (
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => onConciliateOrder(order.id, true)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md border border-emerald-500/20"
                            >
                              Conciliar
                            </button>
                            <button 
                              onClick={() => onConciliateOrder(order.id, false)}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md border border-rose-500/20"
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900 px-2 py-1 rounded border border-slate-850">
                            Verificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. MENU / CATALOG EDITOR */}
      {merchantTab === 'menu-editor' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-1 space-y-4">
              {/* COSTO DE DELIVERY */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-brand-500" /> Ajuste de Delivery
                </h4>
                <p className="text-[11px] text-slate-400">Ajusta el monto del costo adicional cobrado por el envío a domicilio.</p>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="2.00"
                      value={deliveryFeeInput}
                      onChange={(e) => setDeliveryFeeInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 pl-6 pr-3 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const fee = parseFloat(deliveryFeeInput);
                      if (!isNaN(fee) && fee >= 0) {
                        if (onUpdateDeliveryFee) {
                          onUpdateDeliveryFee(activeBiz.id, fee);
                        } else {
                          triggerToast(`✅ Costo de envío guardado: $${fee.toFixed(2)}`);
                        }
                      } else {
                        triggerToast("⚠️ Monto de envío no válido.");
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-transform hover:scale-105 active:scale-95 whitespace-nowrap shadow-md border border-indigo-500/20"
                  >
                    Guardar Costo
                  </button>
                </div>
              </div>

              {/* ADD PRODUCT FORM */}
              <form onSubmit={handleSubmitProduct} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-brand-500" /> Añadir Platillo al Menú
                </h4>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Nombre Comercial</label>
                <input 
                  type="text" 
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej. Tacos de Birria Suprema" 
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Precio ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="9.50" 
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Categoría</label>
                  <select 
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Platos">Platos</option>
                    <option value="Acompañantes">Acompañantes</option>
                    <option value="Bebidas">Bebidas</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Icono de Respaldo (Emoji)</label>
                <select 
                  value={newProdEmoji}
                  onChange={(e) => setNewProdEmoji(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  <option value="🍔">🍔 Hamburguesa</option>
                  <option value="🍕">🍕 Pizza</option>
                  <option value="🌮">🌮 Taco</option>
                  <option value="🍣">🍣 Sushi</option>
                  <option value="🍟">🍟 Papas Fritas</option>
                  <option value="🧁">🧁 Postre</option>
                  <option value="🍹">🍹 Cóctel / Jugo</option>
                  <option value="☕">☕ Café</option>
                </select>
              </div>

              {/* LICENSING BOUNDARY: PREMIUM PHOTOS */}
              <div className={`relative p-3.5 rounded-xl border ${isPremium ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/40 border-dashed border-slate-800/60 saturate-50'}`}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Enlace Foto Real</label>
                  <span className="bg-amber-500/10 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">Plan Premium</span>
                </div>
                
                {isPremium ? (
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..." 
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      <button 
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80')} 
                        className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                      >
                        Preset Burger
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80')} 
                        className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                      >
                        Preset Pizza
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80')} 
                        className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                      >
                        Preset Taco
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 bg-slate-900/50 rounded-lg">
                    <p className="text-[9px] font-extrabold text-amber-500 flex items-center justify-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Fotos bloqueadas en Plan Estándar
                    </p>
                    <p className="text-[8px] text-slate-500 mt-0.5 px-2">
                      Mejora a Premium en el Panel Super Admin para subir fotos reales de platillos.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Detalle del Platillo</label>
                <textarea 
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Ingredientes, alérgenos y tiempo estimado..." 
                  rows={2} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl transition-all hover:scale-[1.01] shadow-md border border-indigo-500/20"
              >
                Crear Producto en Vivo +
              </button>
            </form>
          </div>

            {/* PRODUCT LIST GRID */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Carta del Restaurante</h4>
              <div className="space-y-2.5">
                {isolatedMenu.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">El catálogo de este negocio está vacío.</p>
                ) : (
                  isolatedMenu.map((item) => (
                    <div key={item.id} className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-800"
                            onError={(e) => {
                              // Fallback
                              (e.target as any).src = 'https://placehold.co/100x100?text=Food';
                            }}
                          />
                        ) : (
                          <span className="text-xl bg-slate-950 w-10 h-10 rounded-lg flex items-center justify-center border border-slate-850">
                            {item.emoji}
                          </span>
                        )}
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{item.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Precio ($)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            defaultValue={item.price} 
                            onBlur={(e) => {
                              const parsed = parseFloat(e.target.value);
                              if (!isNaN(parsed) && parsed >= 0) {
                                onUpdateProductPrice(item.id, parsed);
                              }
                            }}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-md p-1 text-xs font-bold text-right text-white focus:outline-none focus:border-brand-500"
                          />
                        </div>

                        <button 
                          onClick={() => onToggleProductAvailable(item.id)}
                          className={`px-2 py-1 rounded text-[9px] font-black tracking-wide border transition-all ${item.available ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' : 'bg-rose-500/5 text-rose-400 border-rose-500/10'}`}
                        >
                          {item.available ? 'Disponible' : 'Agotado'}
                        </button>

                        <button 
                          onClick={() => onDeleteProduct(item.id)}
                          className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. METRICS / CAJA */}
      {merchantTab === 'metrics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Auditoría de Fondos y Flujo de Caja</h3>
              <p className="text-xs text-slate-500">Métricas analíticas que contrastan ingresos emitidos contra fondos liquidados conciliados.</p>
            </div>

            {/* Interval pills */}
            <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex self-start sm:self-auto shrink-0">
              <button 
                onClick={() => setMetricsInterval('dia')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${metricsInterval === 'dia' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Hoy
              </button>
              <button 
                onClick={() => setMetricsInterval('semana')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${metricsInterval === 'semana' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Semana
              </button>
              <button 
                onClick={() => setMetricsInterval('mes')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold ${metricsInterval === 'mes' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400'}`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Cards metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Ventas Emitidas */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Emitidas</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-black text-white">${grossSales.toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-500">100%</span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 flex justify-between">
                <span>Unidades:</span>
                <span className="font-bold text-white">{grossUnitsCount} u. ({grossOrdersCount} ped.)</span>
              </div>
            </div>

            {/* Fondos Conciliados */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Fondos Conciliados (Caja)</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-black text-emerald-400">${netConciliated.toFixed(2)}</span>
                <span className="text-xs font-bold text-emerald-500/80">
                  {grossSales > 0 ? ((netConciliated / grossSales) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 flex justify-between">
                <span>Unidades:</span>
                <span className="font-bold text-white">{conciliatedUnitsCount} u. ({conciliatedOrdersCount} ped.)</span>
              </div>
            </div>

            {/* Por Conciliar */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block animate-pulse-subtle">Por Conciliar</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-black text-amber-400">${pendingConciliation.toFixed(2)}</span>
                <span className="text-xs font-bold text-amber-500/80">
                  {grossSales > 0 ? ((pendingConciliation / grossSales) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5 flex justify-between">
                <span>Unidades:</span>
                <span className="font-bold text-white">{pendingUnitsCount} u. ({pendingOrdersCount} ped.)</span>
              </div>
            </div>

            {/* Canal Delivery */}
            <div className="bg-slate-900 border border-indigo-950 p-4 rounded-2xl space-y-2 shadow-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Canal Delivery</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-black text-indigo-400">${totalDeliverySold.toFixed(2)}</span>
                <span className="text-xs font-bold text-indigo-400/80">
                  {grossSales > 0 ? ((totalDeliverySold / grossSales) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-indigo-900/60 pt-1.5 flex justify-between">
                <span>Unidades:</span>
                <span className="font-bold text-white">{deliveryUnitsCount} u. ({deliveryOrdersCount} ped.)</span>
              </div>
            </div>
          </div>

          {/* Dynamic Comparative Chart (SVG Grouped Bars) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  📈 Gráfico de Conciliación Bancaria ({metricsInterval.toUpperCase()})
                </h4>
                <p className="text-[9px] text-slate-500">Muestra la correlación entre facturas de clientes (Ventas) y abonos validados en banco (Caja).</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] shrink-0">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500"></span> Emitido</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Liquidado</span>
              </div>
            </div>

            {/* Build SVG Dynamically */}
            {(() => {
              // Generate dynamic numbers based on active business metrics to show variation
              const baseS = grossSales > 0 ? grossSales : 30;
              const baseC = netConciliated > 0 ? netConciliated : 24;

              const data = metricsInterval === 'dia' ? [
                { label: '14 Jul', s: 35, c: 30 },
                { label: '15 Jul', s: 42, c: 40 },
                { label: '16 Jul', s: 28, c: 20 },
                { label: '17 Jul', s: 50, c: 48 },
                { label: '18 Jul', s: 65, c: 60 },
                { label: '19 Jul', s: 55, c: 50 },
                { label: 'Hoy', s: baseS, c: baseC }
              ] : metricsInterval === 'semana' ? [
                { label: 'Sem 1', s: 210, c: 190 },
                { label: 'Sem 2', s: 340, c: 310 },
                { label: 'Sem 3', s: 180, c: 170 },
                { label: 'Sem 4 (Hoy)', s: baseS + 110, c: baseC + 90 }
              ] : [
                { label: 'Mayo', s: 840, c: 790 },
                { label: 'Junio', s: 1200, c: 1100 },
                { label: 'Julio (Hoy)', s: baseS + 450, c: baseC + 410 }
              ];

              let maxVal = 10;
              data.forEach(d => { if (d.s > maxVal) maxVal = d.s; if (d.c > maxVal) maxVal = d.c; });

              const w = 500;
              const h = 150;
              const barSp = w / data.length;
              const gW = barSp - 20;
              const bW = (gW - 4) / 2;

              return (
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
                  <defs>
                    <linearGradient id="barSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#4f46e5"/>
                    </linearGradient>
                    <linearGradient id="barConc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981"/>
                      <stop offset="100%" stopColor="#059669"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Axis line */}
                  <line x1="0" y1={h - 20} x2={w} y2={h - 20} stroke="#1e293b" strokeWidth="1.5" />

                  {data.map((d, idx) => {
                    const xS = idx * barSp + (barSp - gW) / 2;
                    const xC = xS + bW + 3;

                    const hS = (d.s / maxVal) * (h - 40);
                    const yS = h - 20 - hS;

                    const hC = (d.c / maxVal) * (h - 40);
                    const yC = h - 20 - hC;

                    return (
                      <g key={idx} className="group">
                        {/* Emitido */}
                        <rect x={xS} y={yS} width={bW} height={hS} rx="2" fill="url(#barSales)" className="opacity-90 hover:opacity-100 transition-opacity" />
                        <text x={xS + bW/2} y={yS - 3} textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="bold">${d.s.toFixed(0)}</text>

                        {/* Liquidado */}
                        <rect x={xC} y={yC} width={bW} height={hC} rx="2" fill="url(#barConc)" className="opacity-90 hover:opacity-100 transition-opacity" />
                        <text x={xC + bW/2} y={yC - 3} textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="bold">${d.c.toFixed(0)}</text>

                        {/* label */}
                        <text x={xS + bW + 1.5} y={h - 4} textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">{d.label}</text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* Top Selling Products Share */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-md">
              <h4 className="text-xs font-bold text-slate-300 uppercase">📊 Participación de Venta por Producto</h4>
              
              {(() => {
                const map: Record<string, number> = {};
                let totalItemsCount = 0;
                isolatedOrders.forEach(o => {
                  if (o.payment.status !== 'Rechazado') {
                    o.items.forEach(it => {
                      map[it.name] = (map[it.name] || 0) + it.qty;
                      totalItemsCount += it.qty;
                    });
                  }
                });

                const sorted = Object.entries(map).map(([name, qty]) => ({
                  name,
                  qty,
                  pct: totalItemsCount > 0 ? ((qty / totalItemsCount) * 100).toFixed(0) : '0'
                })).sort((a,b) => b.qty - a.qty);

                if (sorted.length === 0) {
                  return <p className="text-slate-500 text-xs italic">No hay comandas procesadas.</p>;
                }

                return (
                  <div className="space-y-3.5">
                    {sorted.slice(0, 5).map((p, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-semibold">{p.name}</span>
                          <span className="text-brand-500 font-bold">{p.qty} u. ({p.pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Distribution metrics summary */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between shadow-md">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase">🍕 Métricas de Cobertura Comercial</h4>
                
                {(() => {
                  let totalItems = 0;
                  const catStats = { Platos: 0, Acompañantes: 0, Bebidas: 0 };
                  const payStats: Record<string, number> = { Transferencia: 0, "Pago móvil": 0, Efectivo: 0, Pendiente: 0 };

                  isolatedOrders.forEach(o => {
                    if (o.payment.status !== 'Rechazado') {
                      const m = o.payment.method;
                      if (payStats[m] !== undefined) {
                        payStats[m]++;
                      } else {
                        payStats.Pendiente++;
                      }

                      o.items.forEach(it => {
                        const mItem = menus.find(menu => menu.id === it.id);
                        const cat = mItem ? mItem.category : 'Platos';
                        if (catStats[cat] !== undefined) {
                          catStats[cat] += it.qty;
                        }
                        totalItems += it.qty;
                      });
                    }
                  });

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Categorías</span>
                        {Object.entries(catStats).map(([cat, qty]) => (
                          <div key={cat} className="text-[11px] flex justify-between border-b border-slate-850 pb-1">
                            <span className="text-slate-400">{cat}</span>
                            <span className="text-white font-bold">{qty} u.</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Pagos Emitidos</span>
                        {Object.entries(payStats).map(([method, qty]) => (
                          <div key={method} className="text-[11px] flex justify-between border-b border-slate-850 pb-1">
                            <span className="text-slate-400">{method}</span>
                            <span className="text-white font-bold">{qty} tx</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mesa vs Delivery</span>
                <div className="flex gap-3">
                  <span className="text-indigo-400 font-bold">🛵 Delivery: {isolatedOrders.filter(o => o.type === 'Delivery').length}</span>
                  <span className="text-emerald-400 font-bold">🍽️ Mesa: {isolatedOrders.filter(o => o.type === 'Mesa').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CRM CUSTOMERS */}
      {merchantTab === 'crm' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Base de Datos CRM del Restaurante</h3>
              <p className="text-xs text-slate-500">Listado de comensales frecuentes que han comprado en este Kiosco.</p>
            </div>

            {/* Export buttons */}
            <div className="flex gap-2 self-end sm:self-auto shrink-0">
              <button 
                onClick={() => handleExportCSV('copy')}
                className="bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs text-slate-200 font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Copiar CSV
              </button>
              <button 
                onClick={() => handleExportCSV('download')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-transform hover:scale-[1.02] border border-indigo-500/20"
              >
                <Download className="w-3.5 h-3.5" /> Descargar CSV
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/80">
                    <th className="py-3.5 px-4">Nombre Comensal</th>
                    <th className="py-3.5 px-4">Teléfono</th>
                    <th className="py-3.5 px-4">Correo</th>
                    <th className="py-3.5 px-4 text-center">Pedidos</th>
                    <th className="py-3.5 px-4 text-right">Inversión Real</th>
                  </tr>
                </thead>
                <tbody>
                  {getUniqueCustomers().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-500 text-xs italic font-semibold">
                        Aún no hay clientes registrados en la base de datos de este kiosco.
                      </td>
                    </tr>
                  ) : (
                    getUniqueCustomers().map((c, idx) => (
                      <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-bold text-white">{c.name}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">{c.phone}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{c.email}</td>
                        <td className="py-3.5 px-4 text-xs text-center text-slate-300 font-bold">{c.ordersCount}</td>
                        <td className="py-3.5 px-4 text-xs text-right font-black text-brand-500">${c.totalSpent.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-brand-500/5 border border-brand-500/15 p-4 rounded-xl text-xs text-brand-400 leading-relaxed flex gap-2">
            <Sparkles className="w-5 h-5 text-brand-500 shrink-0" />
            <div>
              <strong>Inbound Marketing Directo:</strong> Descarga este reporte en formato CSV compatible con Excel o Google Sheets. Puedes cargarlo en campañas masivas de WhatsApp Business para incentivar recompra ofreciendo cupones QR personalizados.
            </div>
          </div>
        </div>
      )}

      {/* 5. FEEDBACK / REPUTATION */}
      {merchantTab === 'feedback' && (
        <div className="space-y-6 animate-fade-in">
          {/* Reputation firewall alert info */}
          <div className="bg-indigo-950/40 border border-indigo-800/40 p-4 rounded-xl text-xs space-y-1.5 shadow-sm leading-relaxed text-indigo-200">
            <h4 className="font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
              🛡️ Cortafuegos de Reputación QR Activo
            </h4>
            <p>
              Supabase e integraciones asociadas: Cuando un cliente califica el kiosco en su celular con <strong>4 o 5 estrellas</strong>, el sistema lo redirecciona automáticamente a tu ficha pública de Google Maps para acumular reputación. Si califica con <strong>1, 2 o 3 estrellas</strong>, el cortafuegos captura la queja de forma privada y la guarda exclusivamente en esta bandeja para que resuelvas el conflicto sin dañar tu SEO local.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Calidad Alimentos</span>
              <h4 className="text-3xl font-black text-white mt-1">
                {(() => {
                  if (isolatedReviews.length === 0) return '0.0';
                  const sum = isolatedReviews.reduce((s, r) => s + r.foodRating, 0);
                  return (sum / isolatedReviews.length).toFixed(1);
                })()} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
              </h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Velocidad de Entrega</span>
              <h4 className="text-3xl font-black text-white mt-1">
                {(() => {
                  if (isolatedReviews.length === 0) return '0.0';
                  const sum = isolatedReviews.reduce((s, r) => s + r.serviceRating, 0);
                  return (sum / isolatedReviews.length).toFixed(1);
                })()} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
              </h4>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Reseñas Privadas (Cortafuegos)</h4>
            
            {isolatedReviews.length === 0 ? (
              <p className="text-slate-500 text-xs italic">Aún no hay feedback capturado de comensales.</p>
            ) : (
              <div className="space-y-3">
                {isolatedReviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2 shadow-sm">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div>
                        <h5 className="text-xs font-bold text-white">{rev.customer}</h5>
                        <p className="text-[9px] text-slate-500">Asociado a Comanda: {rev.orderId}</p>
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] text-right font-mono text-slate-400">
                        <div className="flex items-center gap-1 justify-end">
                          <span>Comida:</span>
                          <span className="text-amber-400 flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{rev.foodRating > i ? '★' : '☆'}</span>
                            ))}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <span>Servicio:</span>
                          <span className="text-amber-400 flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i}>{rev.serviceRating > i ? '★' : '☆'}</span>
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-850/60 italic leading-relaxed">
                      "{rev.comment || 'El cliente no especificó texto de valoración.'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
