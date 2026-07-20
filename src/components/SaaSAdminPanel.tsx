/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, Users, FileText, Settings, ShieldCheck, 
  Trash2, Plus, Sparkles, Database, Check, AlertTriangle, Key
} from 'lucide-react';
import { Business, SystemLog } from '../types';

interface SaaSAdminPanelProps {
  businesses: Business[];
  logs: SystemLog[];
  onAddBusiness: (name: string, email: string, emoji: string, tier: 'free' | 'premium') => void;
  onToggleStatus: (id: string) => void;
  onToggleTier: (id: string) => void;
  onResetSystem: () => void;
  onOptimizeIndexes: () => void;
  onClearLogs: () => void;
}

export default function SaaSAdminPanel({
  businesses,
  logs,
  onAddBusiness,
  onToggleStatus,
  onToggleTier,
  onResetSystem,
  onOptimizeIndexes,
  onClearLogs
}: SaaSAdminPanelProps) {
  const [saasTab, setSaasTab] = useState<'stores' | 'db-maintenance' | 'logs'>('stores');
  const [showForm, setShowForm] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizEmoji, setNewBizEmoji] = useState('🍔');
  const [newBizTier, setNewBizTier] = useState<'free' | 'premium'>('premium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim() || !newBizEmail.trim()) return;
    onAddBusiness(newBizName, newBizEmail, newBizEmoji, newBizTier);
    setNewBizName('');
    setNewBizEmail('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-indigo-500/15">
            Super Master Panel (SaaS Multiempresa)
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-master-500" /> Consola Global de Control
          </h2>
        </div>
        
        {/* Navigation Tab Pills */}
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex self-stretch md:self-auto shrink-0 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSaasTab('stores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${saasTab === 'stores' ? 'bg-master-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🏢 Negocios ({businesses.length})
          </button>
          <button 
            onClick={() => setSaasTab('db-maintenance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${saasTab === 'db-maintenance' ? 'bg-master-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Database className="w-3.5 h-3.5" /> Mantenimiento DB
          </button>
          <button 
            onClick={() => setSaasTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${saasTab === 'logs' ? 'bg-master-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📋 Logs Servidor
          </button>
        </div>
      </div>

      {/* RENDER STORES DIRECTORY */}
      {saasTab === 'stores' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Directorio de Kioscos Registrados</h3>
              <p className="text-xs text-slate-500">Supervisa las marcas activas en el SaaS, aprueba accesos o suspende licencias morosas.</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-master-600 hover:bg-master-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md self-end sm:self-auto transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Agregar Kiosco
            </button>
          </div>

          {/* New store modal form inline */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl gap-4 grid grid-cols-1 md:grid-cols-4 items-end animate-fade-in shadow-xl">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Nombre Comercial</label>
                <input 
                  type="text" 
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="Ej: Burger Station" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-master-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Administrador</label>
                <input 
                  type="email" 
                  value={newBizEmail}
                  onChange={(e) => setNewBizEmail(e.target.value)}
                  placeholder="contacto@estacion.com" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-master-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Logo (Emoji)</label>
                  <select 
                    value={newBizEmoji}
                    onChange={(e) => setNewBizEmoji(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="🍔">🍔 Hamburguesa</option>
                    <option value="🍕">🍕 Pizza</option>
                    <option value="🌮">🌮 Taco</option>
                    <option value="☕">☕ Café</option>
                    <option value="🍣">🍣 Sushi</option>
                    <option value="🍦">🍦 Helado</option>
                    <option value="🍹">🍹 Bebida</option>
                    <option value="🍜">🍜 Ramen</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Plan / Licencia</label>
                  <select 
                    value={newBizTier}
                    onChange={(e) => setNewBizTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="premium">🏆 Premium</option>
                    <option value="free">Estándar (Free)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors">
                  Registrar Kiosco
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-lg text-xs"
                >
                  Cerrar
                </button>
              </div>
            </form>
          )}

          {/* Stores Grid list */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/60">
                    <th class="py-3.5 px-4">Kiosco / Sucursal</th>
                    <th class="py-3.5 px-4">Email Admin</th>
                    <th class="py-3.5 px-4 text-center">Licencia</th>
                    <th class="py-3.5 px-4 text-center">Aislamiento RLS</th>
                    <th class="py-3.5 px-4 text-center">Estado Acceso</th>
                    <th class="py-3.5 px-4 text-right">Controles Master</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b) => (
                    <tr key={b.id} className="border-b border-slate-800/80 hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4 text-sm font-bold text-white flex items-center gap-2.5">
                        <span className="text-xl bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-sm">{b.logo}</span>
                        <div>
                          <p className="text-white font-bold text-xs">{b.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">ID: {b.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-medium">{b.email}</td>
                      <td className="py-3.5 px-4 text-center">
                        {b.tier === 'premium' ? (
                          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                            🏆 Premium
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Estándar
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/15 rounded-md px-1.5 py-0.5 font-mono">
                          RLS: Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {b.status === 'active' ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Habilitado
                          </span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => onToggleStatus(b.id)}
                            className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all ${b.status === 'active' ? 'bg-rose-950/40 text-rose-300 border-rose-800/30 hover:bg-rose-900/40' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/30 hover:bg-emerald-900/40'}`}
                          >
                            {b.status === 'active' ? 'Suspender' : 'Habilitar'}
                          </button>
                          <button 
                            onClick={() => onToggleTier(b.id)}
                            className="text-[10px] bg-indigo-950/40 border border-indigo-800/30 text-indigo-300 font-bold px-2.5 py-1.5 rounded-lg hover:bg-indigo-900/40 transition-all"
                          >
                            Plan
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DATABASE MAINTENANCE TAB */}
      {saasTab === 'db-maintenance' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Mantenimiento Global y Auditoría de Datos</h3>
            <p className="text-xs text-slate-500">Inspecciona registros almacenados de forma física o simula comandos DBA de Postgres.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Inquilinos SaaS</span>
              <h4 className="text-2xl font-black text-white">{businesses.length}</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aislamiento RLS</span>
              <h4 className="text-xl font-black text-brand-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-5 h-5 text-brand-500" /> 100% OK
              </h4>
            </div>
            <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Índices Postgres</span>
              <h4 className="text-2xl font-black text-indigo-400">8 Activos</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-2xl text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Conexiones Pooler</span>
              <h4 className="text-2xl font-black text-emerald-400 font-mono">15/40</h4>
            </div>
          </div>

          {/* DBA Maintenance actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-rose-500" /> Operaciones de Base de Datos
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reinstala los esquemas limpios de producción con datos de prueba semilla preconfigurados aislados por RLS.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button 
                  onClick={onResetSystem}
                  className="bg-rose-950 border border-rose-800/60 hover:bg-rose-900 text-rose-300 text-xs font-bold px-3 py-2.5 rounded-lg flex-1 text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Restablecer Fábrica
                </button>
                <button 
                  onClick={onOptimizeIndexes}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2.5 rounded-lg flex-1 text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-brand-500" /> Optimizar Índices
                </button>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-master-500" /> API Gateway & Connection Pool
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-mono text-[10px]">
                Configuración del Supabase Connection Pooler (Supavisor) en modo Transaction para optimizar microservicios altamente concurrentes.
              </p>
              <div className="space-y-1.5 text-xs text-slate-400 font-mono text-[11px]">
                <p className="flex justify-between"><span>Pool Mode:</span> <span className="text-emerald-400 font-bold">Transaction (Max 1500 clients)</span></p>
                <p className="flex justify-between"><span>Connection String:</span> <span className="text-white">postgresql://postgres.xxx:6543/postgres</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE SERVER LOGS */}
      {saasTab === 'logs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Historial de Eventos del Servidor</h3>
              <p className="text-xs text-slate-500">Transacciones y cambios del sistema monitoreados en tiempo real con aislamiento multi-inquilino.</p>
            </div>
            <button 
              onClick={onClearLogs}
              className="text-xs text-slate-500 hover:text-slate-300 font-bold"
            >
              Limpiar consola
            </button>
          </div>

          <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-2xl h-80 overflow-y-auto no-scrollbar font-mono text-[11px] space-y-2 shadow-inner">
            {logs.length === 0 ? (
              <p className="text-slate-600 text-center text-xs py-8 font-mono">Consola limpia. No hay eventos nuevos.</p>
            ) : (
              logs.map((l, idx) => {
                let colorClass = "text-slate-400";
                if (l.type === "auth") colorClass = "text-indigo-400";
                if (l.type === "billing") colorClass = "text-emerald-400 font-bold";
                if (l.type === "alert") colorClass = "text-amber-400 animate-pulse";
                if (l.type === "security") colorClass = "text-red-400 font-extrabold";

                return (
                  <div key={idx} className="flex items-start gap-3 py-1.5 border-b border-slate-900/40 text-xs font-mono">
                    <span className="text-slate-600 shrink-0 select-none">[{l.timestamp}]</span>
                    <span className="text-slate-500 select-none shrink-0 uppercase text-[9px] font-bold">[{l.type}]</span>
                    <span className={colorClass}>{l.event}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
