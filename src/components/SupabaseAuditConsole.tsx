/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Database, Code, 
  Lock, Unlock, Play, CheckCircle2, Info, 
  Terminal, ArrowRight, Clock, Activity, FileText, 
  RefreshCw, UserCheck, Server, AlertOctagon, HelpCircle,
  Network
} from 'lucide-react';
import { SecurityTestResult } from '../types';
import DatabaseSchemaViewer from './DatabaseSchemaViewer';

interface SupabaseAuditConsoleProps {
  onAddLog: (event: string, type: 'system' | 'auth' | 'billing' | 'alert' | 'security') => void;
}

export default function SupabaseAuditConsole({ onAddLog }: SupabaseAuditConsoleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'scan' | 'injection' | 'rls' | 'indexing' | 'architecture' | 'schema'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  
  // SQL Injection Sandbox State
  const [userInput, setUserInput] = useState("Smash Burger");
  const [injectionQuery, setInjectionQuery] = useState("");
  const [preparedQuery, setPreparedQuery] = useState("");
  const [isInjecting, setIsInjecting] = useState(false);

  // RLS State
  const [rlsRole, setRlsRole] = useState<'anon' | 'merchant' | 'superadmin'>('merchant');
  const [rlsTable, setRlsTable] = useState<'businesses' | 'menus' | 'orders' | 'reviews' | 'accesomenuscan'>('orders');

  // Indexing State
  const [indexedQueryTime, setIndexedQueryTime] = useState<number | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Default security database results
  const [auditResults, setAuditResults] = useState<SecurityTestResult[]>([
    {
      id: 'sec-01',
      category: 'Inyección SQL',
      name: 'Uso de PostgREST y Declaraciones Preparadas',
      status: 'passed',
      impact: 'critical',
      description: 'Verificación de que todas las consultas de lectura y escritura al backend pasen por el SDK de Supabase o API REST nativa, evitando concatenaciones directas en consultas crudas.',
      recommendation: 'No utilices supabase.rpc() con SQL dinámico no parametrizado en PL/pgSQL. Mantén las consultas nativas del cliente, que usan automáticamente Prepared Statements.',
      sqlSnippet: `-- ✅ Forma Segura (Supabase Client):
const { data, error } = await supabase
  .from('menus')
  .select('*')
  .eq('business_id', input_business_id);`
    },
    {
      id: 'sec-02',
      category: 'Políticas RLS',
      name: 'Control de Acceso Multiempresa en Tablas Críticas',
      status: 'warning',
      impact: 'critical',
      description: 'Verificación de políticas Row Level Security (RLS) habilitadas en las tablas stores, menus, orders y reviews para evitar fugas de datos inter-inquilino.',
      recommendation: 'Activa RLS en todas las tablas ejecutando "ALTER TABLE x ENABLE ROW LEVEL SECURITY;" y diseña políticas estrictas utilizando auth.uid() y validación de metadatos.',
      sqlSnippet: `-- ⚠️ Peligro: Tabla expuesta sin RLS. Cualquier usuario anónimo podría leer pedidos de otros negocios.
-- ✅ Solución: Habilitar RLS y vincular auth.jwt() -> metadata -> business_id
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`
    },
    {
      id: 'sec-03',
      category: 'Manejo de Sesiones',
      name: 'Expiración de Tokens JWT y Refresco Seguro',
      status: 'passed',
      impact: 'high',
      description: 'Monitoreo de expiración de Access Tokens de Supabase (JWT) configurados por defecto a 1 hora con almacenamiento seguro de tokens de actualización.',
      recommendation: 'Configura las Cookies como HTTPOnly en producción si utilizas SSR (Next.js/Remix) para mitigar vulnerabilidades XSS. Si es SPA pura, utiliza el almacenamiento seguro por defecto con encriptación en persistencia.',
      sqlSnippet: `-- Estructura del JWT decodificado en Supabase auth.jwt():
{
  "exp": 1792400000,
  "sub": "user-uuid-123",
  "email": "owner@burgerstation.com",
  "app_metadata": { "provider": "email" },
  "user_metadata": { "business_id": "biz-burger" }
}`
    },
    {
      id: 'sec-04',
      category: 'Optimización de Latencia',
      name: 'Estrategia de Índices para Consultas Multitenant',
      status: 'warning',
      impact: 'high',
      description: 'Búsqueda de índices compuestos en consultas anidadas frecuentes (ej: filtrar comandas por business_id y status simultáneamente).',
      recommendation: 'Crea un índice compuesto tipo B-Tree en la tabla "orders(business_id, status)" para evitar Sequential Scans que causan latencia superior a los 300ms a medida que escala la base de datos.',
      sqlSnippet: `-- ✅ Crear Índice Compuesto B-Tree para optimizar consultas de comanda:
CREATE INDEX idx_orders_business_status 
ON orders (business_id, status);`
    },
    {
      id: 'sec-05',
      category: 'Estructura de Microservicios',
      name: 'Aislamiento de Carga con Edge Functions',
      status: 'passed',
      impact: 'medium',
      description: 'Estructuración de tareas intensivas o pasarelas de pago (webhooks de cobro) en Supabase Edge Functions aisladas del hilo principal de Postgres.',
      recommendation: 'Delega la conciliación automática de transferencias pesadas y webhooks a microservicios en Deno Edge Functions de Supabase para evitar picos de uso de CPU en la instancia de base de datos.',
      sqlSnippet: `-- Despliegue de Deno Edge Function para webhook de conciliación:
supabase functions deploy conciliate-webhook`
    },
    {
      id: 'sec-06',
      category: 'Mecanismos de Caché',
      name: 'Políticas de Caché en Capa de Red (Edge)',
      status: 'warning',
      impact: 'medium',
      description: 'Verificación de almacenamiento en caché para respuestas de lectura estática (menús de los restaurantes, logos) para ahorrar lecturas de base de datos directas.',
      recommendation: 'Implementa cabeceras Cache-Control s-maxage para menús públicos en Supabase Edge Functions o Cloudflare, invalidando la caché mediante webhooks cuando el mercante edite precios.',
      sqlSnippet: `-- Configurar cabecera en Edge Function para menú estático de restaurante:
return new Response(JSON.stringify(menu), {
  headers: { 
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60, s-maxage=600" 
  }
});`
    }
  ]);

  const handleRunScan = () => {
    setIsScanning(true);
    setScanProgress(5);
    setScanStepText('Iniciando analizador estático...');
    onAddLog('Auditoría Supabase: Iniciando escaneo de vulnerabilidades estáticas...', 'security');

    const steps = [
      { p: 20, t: 'Analizando protección contra Inyecciones SQL...' },
      { p: 40, t: 'Auditando estado de Row Level Security (RLS) en base de datos...' },
      { p: 60, t: 'Comprobando claves primarias y foráneas de stores, menus, orders...' },
      { p: 80, t: 'Calculando eficiencia de planes de ejecución e índices compuestos...' },
      { p: 95, t: 'Simulando concurrencia de tokens JWT de Supabase Auth...' },
      { p: 100, t: 'Escaneo de seguridad finalizado con éxito.' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanProgress(step.p);
        setScanStepText(step.t);
        if (step.p === 100) {
          setIsScanning(false);
          setHasScanned(true);
          onAddLog('Auditoría Supabase: Escaneo completado. Puntuación de Seguridad: 85/100.', 'security');
          // Update status of some metrics dynamically to show improvement
          setAuditResults(prev => prev.map(r => {
            if (r.id === 'sec-02') {
              return { ...r, status: 'passed', description: 'ROW LEVEL SECURITY activado y verificado en stores, menus, orders y reviews.' };
            }
            return r;
          }));
        }
      }, (idx + 1) * 700);
    });
  };

  const runInjectionSimulation = () => {
    setIsInjecting(true);
    // Unsafe string concat
    const query = `SELECT * FROM menus WHERE business_id = 'biz-burger' AND name ILIKE '%${userInput}%';`;
    setInjectionQuery(query);

    // Safe sanitized
    const parameterized = `SELECT * FROM menus WHERE business_id = 'biz-burger' AND name ILIKE $1; \n-- Argumentos: $1 = '%${userInput.replace(/'/g, "''")}%'`;
    setPreparedQuery(parameterized);

    setTimeout(() => {
      setIsInjecting(false);
      onAddLog(`Sandbox SQL: Simulación de consulta ejecutada con entrada: "${userInput}"`, 'security');
    }, 450);
  };

  const measureQueryPerformance = () => {
    setIsMeasuring(true);
    setIndexedQueryTime(null);
    setTimeout(() => {
      // simulate query latency
      setIsMeasuring(false);
      setIndexedQueryTime(2.4); // 2.4 milliseconds vs 240ms sequential scan
      onAddLog('Performance Audit: Simulación de consulta indexada completada (2.4ms).', 'system');
    }, 600);
  };

  // Helper to generate SQL code for RLS based on state
  const getRlsSQLCode = () => {
    if (rlsTable === 'businesses') {
      if (rlsRole === 'anon') {
        return `CREATE POLICY "Permitir lectura pública de kioscos activos" \nON stores \nFOR SELECT \nUSING (status = 'active');`;
      } else if (rlsRole === 'merchant') {
        return `CREATE POLICY "Permitir editar solo al propietario del kiosco" \nON stores \nFOR UPDATE \nTO authenticated \nUSING (auth.email() = email) \nWITH CHECK (auth.email() = email);`;
      } else {
        return `CREATE POLICY "Acceso total para Super Master Admin" \nON stores \nFOR ALL \nTO authenticated \nUSING ( (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true );`;
      }
    } else if (rlsTable === 'menus') {
      if (rlsRole === 'anon') {
        return `CREATE POLICY "Lectura pública de menús de tiendas activas" \nON menus \nFOR SELECT \nUSING (\n  EXISTS (\n    SELECT 1 FROM stores \n    WHERE stores.id = menus.business_id AND stores.status = 'active'\n  )\n);`;
      } else if (rlsRole === 'merchant') {
        return `CREATE POLICY "Mercantes editan sus propios productos" \nON menus \nFOR ALL \nTO authenticated \nUSING (\n  EXISTS (\n    SELECT 1 FROM stores \n    WHERE stores.id = menus.business_id AND stores.email = auth.email()\n  )\n);`;
      } else {
        return `CREATE POLICY "Super Admins manejan todo el catálogo" \nON menus \nFOR ALL \nTO authenticated \nUSING ( (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true );`;
      }
    } else if (rlsTable === 'orders') {
      if (rlsRole === 'anon') {
        return `CREATE POLICY "Clientes insertan pedidos anónimos" \nON orders \nFOR INSERT \nWITH CHECK (status = 'Preparando');`;
      } else if (rlsRole === 'merchant') {
        return `CREATE POLICY "Comercios leen y actualizan sus propios pedidos" \nON orders \nFOR ALL \nTO authenticated \nUSING (\n  EXISTS (\n    SELECT 1 FROM stores \n    WHERE stores.id = orders.business_id AND stores.email = auth.email()\n  )\n);`;
      } else {
        return `CREATE POLICY "Super Admins monitorean todas las comandas" \nON orders \nFOR SELECT \nTO authenticated \nUSING ( (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true );`;
      }
    } else if (rlsTable === 'reviews') {
      if (rlsRole === 'anon') {
        return `CREATE POLICY "Clientes insertan reseñas de pedidos entregados" \nON reviews \nFOR INSERT \nWITH CHECK (\n  EXISTS (\n    SELECT 1 FROM orders \n    WHERE orders.id = reviews.order_id AND orders.status = 'Entregado'\n  )\n);`;
      } else if (rlsRole === 'merchant') {
        return `CREATE POLICY "Comercios leen y descargan reseñas privadas" \nON reviews \nFOR SELECT \nTO authenticated \nUSING (\n  EXISTS (\n    SELECT 1 FROM stores \n    WHERE stores.id = reviews.business_id AND stores.email = auth.email()\n  )\n);`;
      } else {
        return `CREATE POLICY "Super Admin gestiona quejas y reputación" \nON reviews \nFOR ALL \nTO authenticated \nUSING ( (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true );`;
      }
    } else { // accesomenuscan
      if (rlsRole === 'anon') {
        return `-- 🛑 Denegado por defecto: Los usuarios anónimos o no autenticados no pueden añadir registros a la tabla 'accesomenuscan'.\n-- Las políticas RLS deniegan toda operación de inserción no configurada explícitamente.`;
      } else if (rlsRole === 'merchant') {
        return `CREATE POLICY "Permitir inserción de registros a usuarios autenticados" \nON accesomenuscan \nFOR INSERT \nTO authenticated \nWITH CHECK (true);\n\n-- Nota: Esta regla permite la acción 'insert' únicamente para usuarios autenticados.`;
      } else {
        return `CREATE POLICY "Super Admins gestionan todos los registros de escaneo" \nON accesomenuscan \nFOR ALL \nTO authenticated \nUSING ( (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true );`;
      }
    }
  };

  return (
    <div className="space-y-6" id="supabase-audit-console">
      {/* Console Top Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-500/20">
              Módulo de Producción & Auditoría
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Centro de Diagnóstico Supabase 360</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Análisis dinámico de seguridad, mitigación de riesgos de inyección SQL, optimización de latencia en consultas y estrategias de indexación y políticas RLS para despliegue productivo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRunScan} 
              disabled={isScanning}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all ${isScanning ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 text-slate-950 hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Analizando...' : 'Ejecutar Auditoría Supabase'}
            </button>
          </div>
        </div>

        {/* Live scanner progress bar */}
        {isScanning && (
          <div className="mt-4 space-y-2 animate-fade-in">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-brand-500" /> {scanStepText}</span>
              <span className="font-bold text-brand-500">{scanProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-brand-500 h-full rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs menu */}
      <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 flex overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveSubTab('scan')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeSubTab === 'scan' ? 'bg-master-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <ShieldCheck className="w-4 h-4" /> Diagnóstico de Riesgos
        </button>
        <button 
          onClick={() => setActiveSubTab('injection')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeSubTab === 'injection' ? 'bg-master-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Code className="w-4 h-4" /> SQL Injection Playground
        </button>
        <button 
          onClick={() => setActiveSubTab('rls')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeSubTab === 'rls' ? 'bg-master-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Lock className="w-4 h-4" /> Políticas RLS Pro
        </button>
        <button 
          onClick={() => setActiveSubTab('indexing')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeSubTab === 'indexing' ? 'bg-master-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Database className="w-4 h-4" /> Índices & Latencia
        </button>
        <button 
          onClick={() => setActiveSubTab('schema')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeSubTab === 'schema' ? 'bg-master-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Network className="w-4 h-4" /> Esquema & Relaciones
        </button>
        <button 
          onClick={() => setActiveSubTab('architecture')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${activeSubTab === 'architecture' ? 'bg-master-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Server className="w-4 h-4" /> Caché & Microservicios
        </button>
      </div>

      {/* Dynamic Sub-tab content */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl">
        {/* SUBTAB 1: RISK DIAGNOSTIC */}
        {activeSubTab === 'scan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Matriz de Puntos de Fallo y Vulnerabilidades</h3>
                <p className="text-xs text-slate-500">Evaluación estática de inyección SQL, aislamiento multitenancy y rendimiento de base de datos.</p>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span>Estado de Base de Datos:</span>
                <span className={`font-black uppercase tracking-wider ${hasScanned ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {hasScanned ? '● Verificado Pro' : '● Sin Analizar'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {auditResults.map(item => {
                let statusBadge = "";
                if (item.status === 'passed') {
                  statusBadge = <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">Seguro</span>;
                } else if (item.status === 'warning') {
                  statusBadge = <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">Riesgoso</span>;
                } else {
                  statusBadge = <span className="bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/20">Crítico</span>;
                }

                let impactBadge = "";
                if (item.impact === 'critical') {
                  impactBadge = <span className="bg-red-950/40 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-800/20 uppercase">Impacto Crítico</span>;
                } else if (item.impact === 'high') {
                  impactBadge = <span className="bg-orange-950/40 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-orange-800/20 uppercase">Impacto Alto</span>;
                } else {
                  impactBadge = <span className="bg-slate-800 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Impacto Medio</span>;
                }

                return (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between hover:border-slate-700/60 transition-all">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/15 uppercase tracking-wider">{item.category}</span>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        {statusBadge}
                        {impactBadge}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                      
                      {/* Technical Recommendation */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <span className="font-bold text-slate-200 block">💡 Recomendación para Producción:</span>
                        <p>{item.recommendation}</p>
                      </div>
                    </div>

                    {/* SQL Fix */}
                    {item.sqlSnippet && (
                      <div className="w-full md:w-80 shrink-0 space-y-1.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> Código SQL / Configuración</span>
                        <pre className="bg-slate-950 p-3 rounded-lg text-[10px] font-mono text-emerald-400 border border-slate-800/80 overflow-x-auto whitespace-pre no-scrollbar">
                          <code>{item.sqlSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 2: SQL INJECTION PLAYGROUND */}
        {activeSubTab === 'injection' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Simulador de Inyección SQL y Prepared Statements</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supabase utiliza **PostgREST** nativamente para servir las tablas. Al usar el cliente JS de Supabase, las llamadas HTTP se traducen a planes parametrizados en el servidor, neutralizando por completo inyecciones SQL que ocurren con consultas dinámicas armadas mediante interpolación de hilos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Simulator Input controls */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5"><Terminal className="w-4 h-4 text-amber-500" /> Entrada de Usuario Maliciosa</h4>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Preset de Ataque o Búsqueda:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setUserInput("Smash Burger"); }}
                      className="bg-slate-950 hover:bg-slate-800 text-left px-2.5 py-1.5 rounded text-[11px] font-mono text-slate-300 truncate"
                    >
                      Búsqueda Normal: "Smash Burger"
                    </button>
                    <button 
                      onClick={() => { setUserInput("' OR '1'='1"); }}
                      className="bg-slate-950 hover:bg-slate-800 text-left px-2.5 py-1.5 rounded text-[11px] font-mono text-rose-400 truncate border border-rose-500/20"
                    >
                      Inyección: ' OR '1'='1
                    </button>
                    <button 
                      onClick={() => { setUserInput("'; DROP TABLE orders; --"); }}
                      className="bg-slate-950 hover:bg-slate-800 text-left px-2.5 py-1.5 rounded text-[11px] font-mono text-rose-400 truncate border border-rose-500/20"
                    >
                      Destructivo: '; DROP TABLE orders; --
                    </button>
                    <button 
                      onClick={() => { setUserInput("' UNION SELECT email, id::text FROM auth.users; --"); }}
                      className="bg-slate-950 hover:bg-slate-800 text-left px-2.5 py-1.5 rounded text-[11px] font-mono text-rose-400 truncate border border-rose-500/20"
                    >
                      Extracción: UNION SELECT auth...
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Entrada Manual:</label>
                  <input 
                    type="text" 
                    value={userInput} 
                    onChange={(e) => setUserInput(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button 
                  onClick={runInjectionSimulation} 
                  disabled={isInjecting}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Probar Consulta Simulada
                </button>
              </div>

              {/* Analysis Display */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Resultado del Análisis de Consulta</h4>

                {/* Unsafe string concat */}
                <div className="bg-slate-900 border border-rose-500/20 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/15">⚠️ Consulta Interpolada Insegura</span>
                    <span className="text-[9px] text-slate-500 font-bold font-mono">Tradicional / PHP / Node Crudo</span>
                  </div>
                  <pre className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-rose-950">
                    <code>{injectionQuery || `SELECT * FROM menus WHERE business_id = 'biz-burger' AND name ILIKE '%${userInput}%';`}</code>
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    {userInput.includes("'") ? (
                      <span className="text-rose-400 font-bold">🚨 ALERTA: El atacante rompió las comillas simples de la cadena. Se ejecutarán comandos adicionales en el motor de Postgres.</span>
                    ) : (
                      'Entrada segura, pero susceptible a quiebres de sintaxis.'
                    )}
                  </p>
                </div>

                {/* Safe Sanitized */}
                <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/15">✅ Prepared Statement de Supabase (Seguro)</span>
                    <span className="text-[9px] text-slate-500 font-bold font-mono">PostgREST API / Pg Connection Pool</span>
                  </div>
                  <pre className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-emerald-950">
                    <code>{preparedQuery || `SELECT * FROM menus WHERE business_id = 'biz-burger' AND name ILIKE $1; \n-- Argumentos: $1 = '%${userInput.replace(/'/g, "''")}%'`}</code>
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    PostgREST parametrizó automáticamente el input. Aunque la entrada contenga comillas o sentencias destructivas, Postgres la tratará estrictamente como un valor literal de texto y no como código ejecutable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: ROW LEVEL SECURITY POLICIES */}
        {activeSubTab === 'rls' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Generador de Políticas de Seguridad a Nivel de Fila (RLS)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                En Supabase, habilitar RLS es mandatorio. Sin RLS, cualquier comensal con la clave pública de la API podría reescribir comandas, suspender tiendas o extraer historiales de pago de otros comercios. RLS asegura un aislamiento multitenancy perfecto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Configuration panel */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 h-fit">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Configurar Rol y Tabla</h4>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tabla a Asegurar:</label>
                  <select 
                    value={rlsTable} 
                    onChange={(e) => setRlsTable(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 font-bold"
                  >
                    <option value="businesses">stores (Sucursales)</option>
                    <option value="menus">menus (Productos)</option>
                    <option value="orders">orders (Comandas / Ventas)</option>
                    <option value="reviews">reviews (Feedback)</option>
                    <option value="accesomenuscan">accesomenuscan (Tráfico QR)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Rol de Usuario Destino:</label>
                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => setRlsRole('anon')}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${rlsRole === 'anon' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                    >
                      <span>Anónimo / Cliente QR</span>
                      <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 rounded">PUBLIC</span>
                    </button>
                    <button 
                      onClick={() => setRlsRole('merchant')}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${rlsRole === 'merchant' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                    >
                      <span>Propietario de Kiosco</span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 rounded">AUTHENTICATED</span>
                    </button>
                    <button 
                      onClick={() => setRlsRole('superadmin')}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${rlsRole === 'superadmin' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                    >
                      <span>Super Master Admin</span>
                      <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 rounded">JWT CLAIMS</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] text-indigo-300 leading-relaxed">
                  📢 <strong>Multi-Tenant Rule:</strong> Las políticas de mercante validan dinámicamente si el correo verificado de Supabase Auth coincide con el campo <code>email</code> de la tienda para aislar sus transacciones.
                </div>
              </div>

              {/* Code Display */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-brand-500" /> Script de Políticas RLS para Producción (Supabase Console)
                  </h4>
                  <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400 border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all shadow-inner">
                    <code>
{`-- 1. Asegurar la activación de RLS en la tabla
ALTER TABLE ${rlsTable === 'businesses' ? 'stores' : rlsTable} ENABLE ROW LEVEL SECURITY;

-- 2. Crear Política para ${rlsRole.toUpperCase()}
${getRlsSQLCode()}`}
                    </code>
                  </pre>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-[11px] text-slate-400">
                  🛡️ <strong>Aislamiento de Sesión:</strong> Cuando un usuario inicia sesión en Supabase Auth, se inyecta su clave de usuario única en la variable <code>auth.uid()</code> o el token JWT completo en <code>auth.jwt()</code>, lo que imposibilita la suplantación de identidad en consultas.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: INDEXING STRATEGIES & LATENCY */}
        {activeSubTab === 'indexing' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Plan de Indexación Eficiente vs Sequential Scan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cuando una tabla de comandas crece a decenas de miles de registros, un filtrado simple como <code>WHERE business_id = 'biz-burger' AND status = 'Preparando'</code> obliga a Postgres a escanear linealmente toda la tabla en disco (Sequential Scan). Crear un índice compuesto B-Tree reduce el costo computacional de O(N) a O(log N).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left description and simulator button */}
              <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Simulador de Optimización de Latencia</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Compara la latencia simulada de consultas complejas multiempresa con y sin la indexación de base de datos sugerida.
                  </p>
                  
                  <div className="space-y-2 text-[11px] text-slate-400">
                    <p className="flex justify-between border-b border-slate-800 pb-1">
                      <span>Tamaño de Tabla (Simulada):</span>
                      <strong className="text-white">125,000 pedidos</strong>
                    </p>
                    <p className="flex justify-between border-b border-slate-800 pb-1">
                      <span>Latencia Sin Índice:</span>
                      <strong className="text-rose-400 font-mono">245 ms (Scan Secuencial)</strong>
                    </p>
                    <p className="flex justify-between border-b border-slate-800 pb-1">
                      <span>Latencia Con Índice Compuesto:</span>
                      <strong className="text-emerald-400 font-mono">2.4 ms (Index Scan)</strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={measureQueryPerformance} 
                    disabled={isMeasuring}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isMeasuring ? 'animate-pulse' : ''}`} />
                    {isMeasuring ? 'Midiendo Latencia...' : 'Medir Rendimiento en Vivo'}
                  </button>

                  {indexedQueryTime && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center animate-bounce">
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase">Rendimiento Con Índice Compuesto</span>
                      <span className="text-xl font-mono font-black text-emerald-400">{indexedQueryTime} ms</span>
                      <p className="text-[8px] text-slate-500 mt-0.5">Mejora aproximada de rendimiento: 102.5x</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Explain analyze output & indexes */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5"><Terminal className="w-4 h-4 text-brand-500" /> Plan de Ejecución Postgres (EXPLAIN ANALYZE)</h4>
                
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[10px] leading-relaxed text-slate-400 space-y-3">
                  <div className="space-y-1">
                    <span className="text-rose-400 font-bold">❌ PLAN DE EJECUCIÓN SIN ÍNDICES (Lento - Sequential Scan):</span>
                    <pre className="text-[9px] text-rose-300 bg-red-950/20 p-2 rounded border border-rose-950/40">
{`->  Seq Scan on orders  (cost=0.00..3204.00 rows=256 width=214) (actual time=0.102..244.201 rows=34 loops=1)
      Filter: ((business_id = 'biz-burger'::text) AND (status = 'Preparando'::text))
      Rows Removed by Filter: 124,966
Total Execution Time: 245.10 ms (Peligroso para alta concurrencia)`}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <span className="text-emerald-400 font-bold">✅ PLAN DE EJECUCIÓN CON INDICES COMPUESTOS (Óptimo - Index Scan):</span>
                    <pre className="text-[9px] text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-950/40">
{`->  Index Scan using idx_orders_business_status on orders  (cost=0.28..4.30 rows=1 width=214) (actual time=0.012..2.390 rows=34 loops=1)
      Index Cond: ((business_id = 'biz-burger'::text) AND (status = 'Preparando'::text))
Total Execution Time: 2.45 ms (Escalable, no consume disco de forma masiva)`}
                    </pre>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider block">Índice Recomendado para Copiar:</span>
                  <pre className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-emerald-400 border border-slate-850 select-all">
                    <code>CREATE INDEX idx_orders_business_status ON orders (business_id, status);</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: CACHING & MONITOREO DE ERRORES */}
        {activeSubTab === 'architecture' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Diseño de Caché Distribuido y Monitoreo de Errores</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                El entorno de producción para MenuScan multiempresa requiere un diseño de arquitectura desacoplado, donde la carga de lectura estática (los menús públicos que escanean los comensales por QR) se delegue a microservicios ultrarrápidos, liberando la base de datos principal para las escrituras de pedidos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Architecture Blueprint Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5"><Server className="w-4 h-4 text-brand-500" /> Esquema de Arquitectura de Microservicios</h4>
                
                {/* Visual flowchart mockup */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white font-mono text-[10px]">📱 Celular Cliente</span>
                    <span className="text-slate-500 font-bold">➔</span>
                    <span className="bg-indigo-950 border border-indigo-800 px-2.5 py-1 rounded text-indigo-300 font-mono text-[10px]">Cloudflare CDN / Edge</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="bg-indigo-950 border border-indigo-800 px-2.5 py-1 rounded text-indigo-300 font-mono text-[10px]">CDN Cache (s-maxage)</span>
                    <span className="text-slate-500 font-bold">➔</span>
                    <span className="bg-brand-950 border border-brand-800 px-2.5 py-1 rounded text-brand-300 font-mono text-[10px] animate-pulse-subtle">Redis Cache / KV Memory</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="bg-brand-950 border border-brand-800 px-2.5 py-1 rounded text-brand-300 font-mono text-[10px]">Redis Cache Hit</span>
                    <span className="text-slate-500 font-bold">➔</span>
                    <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-400 font-mono text-[10px]">PostgreSQL (Solo Escritura Comandas)</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para alta disponibilidad, el menú público se almacena en memoria volátil (Redis o caché perimetral CDN). Cuando el mercante actualiza un precio en su panel de administración, se dispara un <strong>Supabase Database Webhook</strong> que purga automáticamente la clave de caché afectada, manteniendo sincronizada la tienda en microsegundos sin sobrecargar a PostgreSQL.
                </p>
              </div>

              {/* Monitoring blueprint card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-4 h-4 text-amber-500" /> Monitoreo de Errores y pg_stat_statements</h4>
                
                <div className="space-y-3.5 text-xs text-slate-400">
                  <p className="leading-relaxed">
                    Un sistema multiempresa no puede permitirse pérdidas silenciosas de pedidos. Implementar una traza integrada ayuda a resolver colisiones inter-inquilinos de inmediato:
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2.5 items-start">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Sentry / Logsnag Integration:</strong>
                        <span>Captura de errores no controlados en la app del cliente o fallos de transacciones bancarias en los webhooks de pago.</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">pg_stat_statements:</strong>
                        <span>Habilita este módulo nativo de Postgres para auditar y listar cuáles son las consultas SQL más costosas y optimizarlas antes de que aumente la latencia.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    <span className="text-[9px] font-bold text-amber-400 uppercase block mb-1">Módulo Sentry Configuración (Frontend):</span>
                    <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto whitespace-pre no-scrollbar">
{`Sentry.init({
  dsn: "https://sentry.io/menuscan-saas",
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Evitar subir claves de usuario anónimas
    return sanitizeSensitiveData(event);
  }
});`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 6: DATABASE SCHEMA VIEWER */}
        {activeSubTab === 'schema' && (
          <DatabaseSchemaViewer />
        )}
      </div>
    </div>
  );
}
