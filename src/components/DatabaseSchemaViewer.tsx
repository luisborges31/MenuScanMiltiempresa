/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, Key, Link2, Shield, CheckCircle, AlertTriangle, 
  Terminal, ArrowRight, Eye, RefreshCw, Network, Code, Zap, Layers, HelpCircle
} from 'lucide-react';

interface DBColumn {
  name: string;
  type: string;
  key?: 'PK' | 'FK';
  refTable?: string;
  refColumn?: string;
  isPartitionKey: boolean;
  nullable: boolean;
  comment: string;
}

interface DBIndex {
  name: string;
  columns: string[];
  type: string;
  status: 'optimal' | 'warning' | 'missing';
  sql: string;
  purpose: string;
}

interface DBTable {
  name: string;
  description: string;
  rlsEnabled: boolean;
  columns: DBColumn[];
  indexes: DBIndex[];
}

const TABLES_DATA: Record<string, DBTable> = {
  stores: {
    name: 'stores',
    description: 'Tabla raíz del SaaS. Almacena las configuraciones de los comercios (nombre, plan de pago, logo y credenciales de acceso).',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'VARCHAR(255)', key: 'PK', isPartitionKey: true, nullable: false, comment: 'Identificador único del comercio (ej: "biz-burger"). Usado como clave de partición multi-tenant.' },
      { name: 'name', type: 'VARCHAR(255)', isPartitionKey: false, nullable: false, comment: 'Nombre comercial de la sucursal o kiosco.' },
      { name: 'logo', type: 'VARCHAR(50)', isPartitionKey: false, nullable: false, comment: 'Emoji o URL de imagen de la marca.' },
      { name: 'tier', type: 'VARCHAR(50)', isPartitionKey: false, nullable: false, comment: 'Plan de suscripción: "free" o "premium".' },
      { name: 'status', type: 'VARCHAR(50)', isPartitionKey: false, nullable: false, comment: 'Estado de operación: "active" o "suspended".' },
      { name: 'email', type: 'VARCHAR(255)', isPartitionKey: false, nullable: false, comment: 'Correo electrónico del propietario. Crucial para la validación RLS con auth.email().' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isPartitionKey: false, nullable: false, comment: 'Fecha de registro en el SaaS.' }
    ],
    indexes: [
      {
        name: 'stores_pkey',
        columns: ['id'],
        type: 'B-Tree (Unique)',
        status: 'optimal',
        sql: 'ALTER TABLE stores ADD PRIMARY KEY (id);',
        purpose: 'Garantiza unicidad y optimiza búsquedas de primer nivel de cada sucursal.'
      },
      {
        name: 'idx_stores_email',
        columns: ['email'],
        type: 'B-Tree',
        status: 'optimal',
        sql: 'CREATE INDEX idx_stores_email ON stores (email);',
        purpose: 'Optimiza la validación RLS de Supabase Auth en cada operación del mercante, haciendo consultas O(1) basadas en el JWT del usuario.'
      }
    ]
  },
  menus: {
    name: 'menus',
    description: 'Catálogo de platillos, bebidas y acompañantes pertenecientes a las tiendas. Protegido por RLS para aislamiento de inventario.',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'BIGINT', key: 'PK', isPartitionKey: false, nullable: false, comment: 'ID autoincremental del producto.' },
      { name: 'business_id', type: 'VARCHAR(255)', key: 'FK', refTable: 'stores', refColumn: 'id', isPartitionKey: true, nullable: false, comment: 'Clave foránea que asocia el producto al comercio. Enlaza con la partición multitenant.' },
      { name: 'name', type: 'VARCHAR(255)', isPartitionKey: false, nullable: false, comment: 'Nombre del platillo o ítem.' },
      { name: 'price', type: 'NUMERIC(10,2)', isPartitionKey: false, nullable: false, comment: 'Precio de venta al público.' },
      { name: 'description', type: 'TEXT', isPartitionKey: false, nullable: true, comment: 'Ingredientes o descripción detallada.' },
      { name: 'category', type: 'VARCHAR(100)', isPartitionKey: false, nullable: false, comment: 'Agrupamiento: "Platos", "Acompañantes" o "Bebidas".' },
      { name: 'emoji', type: 'VARCHAR(50)', isPartitionKey: false, nullable: false, comment: 'Emoji representativo del platillo.' },
      { name: 'image', type: 'TEXT', isPartitionKey: false, nullable: true, comment: 'URL de la foto de alta calidad (solo disponible en plan Premium).' },
      { name: 'available', type: 'BOOLEAN', isPartitionKey: false, nullable: false, comment: 'Estado de stock actual para el menú digital.' }
    ],
    indexes: [
      {
        name: 'menus_pkey',
        columns: ['id'],
        type: 'B-Tree (Unique)',
        status: 'optimal',
        sql: 'ALTER TABLE menus ADD PRIMARY KEY (id);',
        purpose: 'Garantiza búsquedas directas e integridad referencial del producto.'
      },
      {
        name: 'idx_menus_business_id',
        columns: ['business_id'],
        type: 'B-Tree',
        status: 'optimal',
        sql: 'CREATE INDEX idx_menus_business_id ON menus (business_id);',
        purpose: 'Asegura tiempos de carga instantáneos en celulares QR al cargar todo el menú de un comercio específico sin escaneos secuenciales.'
      }
    ]
  },
  orders: {
    name: 'orders',
    description: 'Registro de transacciones, comandas y flujos de pago de comensales. Tabla de alta concurrencia que requiere indexación óptima.',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'VARCHAR(100)', key: 'PK', isPartitionKey: false, nullable: false, comment: 'Código de pedido único de cara al cliente (ej: MS-4412).' },
      { name: 'business_id', type: 'VARCHAR(255)', key: 'FK', refTable: 'stores', refColumn: 'id', isPartitionKey: true, nullable: false, comment: 'Clave de aislamiento multi-tenant. Enlaza con stores para definir de qué tienda es la venta.' },
      { name: 'customer', type: 'VARCHAR(255)', isPartitionKey: false, nullable: false, comment: 'Nombre provisto por el comensal.' },
      { name: 'email', type: 'VARCHAR(255)', isPartitionKey: false, nullable: false, comment: 'Email del cliente (asociado para recibos de cobro).' },
      { name: 'type', type: 'VARCHAR(50)', isPartitionKey: false, nullable: false, comment: 'Modalidad de pedido: "Mesa" o "Delivery".' },
      { name: 'address', type: 'TEXT', isPartitionKey: false, nullable: true, comment: 'Dirección física si es orden de entrega a domicilio.' },
      { name: 'table_num', type: 'VARCHAR(50)', isPartitionKey: false, nullable: true, comment: 'Número o etiqueta de mesa del cliente (para pedidos in-situ).' },
      { name: 'phone', type: 'VARCHAR(50)', isPartitionKey: false, nullable: false, comment: 'Teléfono de contacto o Whatsapp de despacho.' },
      { name: 'notes', type: 'TEXT', isPartitionKey: false, nullable: true, comment: 'Instrucciones especiales de cocina.' },
      { name: 'subtotal', type: 'NUMERIC(10,2)', isPartitionKey: false, nullable: false, comment: 'Suma de los productos adquiridos.' },
      { name: 'delivery_fee', type: 'NUMERIC(10,2)', isPartitionKey: false, nullable: false, comment: 'Tasa cobrada por el envío (Premium).' },
      { name: 'total', type: 'NUMERIC(10,2)', isPartitionKey: false, nullable: false, comment: 'Total final a recaudar.' },
      { name: 'status', type: 'VARCHAR(50)', isPartitionKey: false, nullable: false, comment: 'Estado en cocina/despacho: "Preparando", "En Camino", "Entregado".' },
      { name: 'payment_method', type: 'VARCHAR(100)', isPartitionKey: false, nullable: false, comment: 'Medio de cobro: "Efectivo", "Transferencia", etc.' },
      { name: 'payment_status', type: 'VARCHAR(100)', isPartitionKey: false, nullable: false, comment: 'Conciliación contable: "Pendiente", "Por Conciliar", "Conciliado".' },
      { name: 'created_at', type: 'TIMESTAMPTZ', isPartitionKey: false, nullable: false, comment: 'Momento de emisión de la orden.' }
    ],
    indexes: [
      {
        name: 'orders_pkey',
        columns: ['id'],
        type: 'B-Tree (Unique)',
        status: 'optimal',
        sql: 'ALTER TABLE orders ADD PRIMARY KEY (id);',
        purpose: 'Busca un pedido específico y reconcilia comprobantes de pago.'
      },
      {
        name: 'idx_orders_business_status',
        columns: ['business_id', 'status'],
        type: 'B-Tree (Composite)',
        status: 'optimal',
        sql: 'CREATE INDEX idx_orders_business_status ON orders (business_id, status);',
        purpose: 'ÍNDICE CRÍTICO COMPUESTO: Permite al panel del mercante filtrar y listar las comandas activas de su tienda de forma instantánea sin ralentizar el servidor a medida que el historial histórico de ventas crece.'
      }
    ]
  },
  reviews: {
    name: 'reviews',
    description: 'Retroalimentación y auditorías de servicio enviadas por los comensales. Enlazadas directamente para verificar el índice de reputación.',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'BIGINT', key: 'PK', isPartitionKey: false, nullable: false, comment: 'Identificador único de la reseña.' },
      { name: 'business_id', type: 'VARCHAR(255)', key: 'FK', refTable: 'stores', refColumn: 'id', isPartitionKey: true, nullable: false, comment: 'Clave de partición directa. Evita joins costosos para auditar la reputación local de un comercio.' },
      { name: 'order_id', type: 'VARCHAR(100)', key: 'FK', refTable: 'orders', refColumn: 'id', isPartitionKey: false, nullable: false, comment: 'Comanda evaluada en este feedback.' },
      { name: 'customer', type: 'VARCHAR(255)', isPartitionKey: false, nullable: false, comment: 'Nombre del calificador.' },
      { name: 'food_rating', type: 'INTEGER', isPartitionKey: false, nullable: false, comment: 'Puntuación de la comida (1 al 5 estrellas).' },
      { name: 'service_rating', type: 'INTEGER', isPartitionKey: false, nullable: false, comment: 'Puntuación de la atención (1 al 5 estrellas).' },
      { name: 'comment', type: 'TEXT', isPartitionKey: false, nullable: true, comment: 'Mensaje de opinión del comensal.' }
    ],
    indexes: [
      {
        name: 'reviews_pkey',
        columns: ['id'],
        type: 'B-Tree (Unique)',
        status: 'optimal',
        sql: 'ALTER TABLE reviews ADD PRIMARY KEY (id);',
        purpose: 'Identifica y procesa cada retroalimentación de forma independiente.'
      },
      {
        name: 'idx_reviews_business_order',
        columns: ['business_id', 'order_id'],
        type: 'B-Tree (Composite)',
        status: 'optimal',
        sql: 'CREATE INDEX idx_reviews_business_order ON reviews (business_id, order_id);',
        purpose: 'Evita duplicados asegurando que un comensal califique exactamente una vez su propia comanda y agrupa el dashboard de reputaciones.'
      }
    ]
  },
  accesomenuscan: {
    name: 'accesomenuscan',
    description: 'Historial de lecturas de códigos QR y accesos a menús por parte de comensales. Registra la fecha, dispositivo e IP anonimizada para auditoría de tráfico e insights comerciales.',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'BIGINT', key: 'PK', isPartitionKey: false, nullable: false, comment: 'Identificador único del registro de escaneo.' },
      { name: 'business_id', type: 'VARCHAR(255)', key: 'FK', refTable: 'stores', refColumn: 'id', isPartitionKey: true, nullable: false, comment: 'Clave de aislamiento multi-tenant. Enlaza con stores para identificar a qué negocio pertenece el código QR escaneado.' },
      { name: 'menu_id', type: 'BIGINT', key: 'FK', refTable: 'menus', refColumn: 'id', isPartitionKey: false, nullable: true, comment: 'ID de plato opcional enlazado si el escaneo apuntaba a un producto del menú digital en específico.' },
      { name: 'scanned_at', type: 'TIMESTAMPTZ', isPartitionKey: false, nullable: false, comment: 'Marca de tiempo UTC del instante en que se escaneó el código QR.' },
      { name: 'device_info', type: 'VARCHAR(255)', isPartitionKey: false, nullable: true, comment: 'Cadena con información del navegador y dispositivo móvil del usuario.' },
      { name: 'ip_address', type: 'VARCHAR(45)', isPartitionKey: false, nullable: true, comment: 'Dirección IP anonimizada del cliente para control de spam y geolocalización básica.' }
    ],
    indexes: [
      {
        name: 'accesomenuscan_pkey',
        columns: ['id'],
        type: 'B-Tree (Unique)',
        status: 'optimal',
        sql: 'ALTER TABLE accesomenuscan ADD PRIMARY KEY (id);',
        purpose: 'Garantiza la identificación unívoca de cada registro de interacción por escaneo.'
      },
      {
        name: 'idx_accesomenuscan_business_scanned',
        columns: ['business_id', 'scanned_at'],
        type: 'B-Tree (Composite)',
        status: 'optimal',
        sql: 'CREATE INDEX idx_accesomenuscan_business_scanned ON accesomenuscan (business_id, scanned_at);',
        purpose: 'ÍNDICE COMPUESTO MULTI-TENANT: Optimiza los reportes analíticos de tráfico diario por comercio agilizando filtros por rango temporal.'
      }
    ]
  }
};

export default function DatabaseSchemaViewer() {
  const [selectedTable, setSelectedTable] = useState<string>('stores');
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [rebuiltIndex, setRebuiltIndex] = useState<string | null>(null);

  const tableKeys = Object.keys(TABLES_DATA);
  const currentTable = TABLES_DATA[selectedTable];

  const handleSimulateIndexRebuild = (idxName: string) => {
    setSimulationStatus('running');
    setRebuiltIndex(idxName);
    setTimeout(() => {
      setSimulationStatus('success');
      setTimeout(() => {
        setSimulationStatus('idle');
        setRebuiltIndex(null);
      }, 2500);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="database-schema-viewer">
      {/* Visual interactive section header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-brand-500" /> Relaciones Físicas & Particionamiento Multitenant
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-1">
            Visualizador del esquema PostgreSQL. Examina de qué forma el diseño de claves foráneas y la replicación del campo de partición <code>business_id</code> en todas las tablas hijas garantiza un aislamiento RLS hermético y velocidad de acceso óptima.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0 text-[10px] font-bold text-emerald-400">
          <Shield className="w-3.5 h-3.5 text-brand-500" /> Aislamiento RLS: Hermético (100%)
        </div>
      </div>

      {/* SVG RELATIONAL DIAGRAM MAP */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-inner select-none">
        <div className="absolute top-2 right-4 text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3 h-3" /> Diagrama Interactivo de Relaciones (FK Map)
        </div>
        
        {/* Dynamic relational map container */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6 relative z-10">
          
          {/* PARENT TABLE: stores (Left) */}
          <div className="md:col-span-3 flex flex-col justify-center">
            <div 
              onClick={() => setSelectedTable('stores')}
              onMouseEnter={() => setHoveredRelation('stores')}
              onMouseLeave={() => setHoveredRelation(null)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.03] duration-200 shadow-lg ${
                selectedTable === 'stores' 
                  ? 'bg-indigo-950/40 border-indigo-500/80 ring-2 ring-indigo-500/30' 
                  : hoveredRelation === 'stores' ? 'bg-slate-900 border-indigo-500/40' : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" /> stores
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-500/25">Raíz</span>
              </div>
              <ul className="space-y-1.5 text-[10px] font-mono">
                <li className="flex items-center justify-between text-indigo-300 font-bold">
                  <span className="flex items-center gap-1"><Key className="w-2.5 h-2.5 text-indigo-400" /> id</span>
                  <span>PK</span>
                </li>
                <li className="text-slate-400">email</li>
                <li className="text-slate-400">name</li>
                <li className="text-slate-400">status</li>
              </ul>
              <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                <span>Particionado por:</span>
                <span className="text-indigo-400 bg-indigo-500/10 px-1 rounded">stores.id</span>
              </div>
            </div>
          </div>

          {/* CONNECTIONS (Middle SVG Lines on md screens, stack indicator on mobile) */}
          <div className="md:col-span-1 hidden md:flex flex-col items-center justify-center">
            <svg width="40" height="240" className="overflow-visible pointer-events-none">
              <path 
                d="M 0 120 C 20 120, 20 40, 40 40" 
                fill="none" 
                stroke={hoveredRelation === 'menus' || selectedTable === 'menus' ? '#f59e0b' : '#334155'} 
                strokeWidth={selectedTable === 'menus' ? '2.5' : '1.5'}
                className="transition-all duration-300"
              />
              <path 
                d="M 0 120 C 20 120, 20 120, 40 120" 
                fill="none" 
                stroke={hoveredRelation === 'orders' || selectedTable === 'orders' ? '#3b82f6' : '#334155'} 
                strokeWidth={selectedTable === 'orders' ? '2.5' : '1.5'}
                className="transition-all duration-300"
              />
              <path 
                d="M 0 120 C 20 120, 20 200, 40 200" 
                fill="none" 
                stroke={hoveredRelation === 'reviews' || selectedTable === 'reviews' ? '#10b981' : '#334155'} 
                strokeWidth={selectedTable === 'reviews' ? '2.5' : '1.5'}
                className="transition-all duration-300"
              />
            </svg>
          </div>

          {/* CHILDREN TABLES: menus & orders (Middle-Right) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            
            {/* menus Table Card */}
            <div 
              onClick={() => setSelectedTable('menus')}
              onMouseEnter={() => setHoveredRelation('menus')}
              onMouseLeave={() => setHoveredRelation(null)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.02] duration-200 shadow-md ${
                selectedTable === 'menus' 
                  ? 'bg-amber-950/20 border-amber-500/80 ring-2 ring-amber-500/30' 
                  : hoveredRelation === 'menus' ? 'bg-slate-900 border-amber-500/40' : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-400" /> menus
                </span>
                <span className="bg-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-700">FK Enlazado</span>
              </div>
              <ul className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <li className="text-slate-400">id <span className="text-slate-600">(PK)</span></li>
                <li className="text-amber-300 font-black flex items-center gap-0.5 truncate">
                  <Link2 className="w-2.5 h-2.5 text-amber-500 shrink-0" /> business_id <span className="text-slate-500 text-[8px]">(FK)</span>
                </li>
                <li className="text-slate-400">name</li>
                <li className="text-slate-400">price</li>
                <li className="text-slate-400">category</li>
                <li className="text-slate-400">available</li>
              </ul>
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[9px] text-slate-500">
                <span className="font-bold text-amber-500">Aislamiento RLS:</span>
                <span className="font-mono text-slate-400">menus.business_id = stores.id</span>
              </div>
            </div>

            {/* orders Table Card */}
            <div 
              onClick={() => setSelectedTable('orders')}
              onMouseEnter={() => setHoveredRelation('orders')}
              onMouseLeave={() => setHoveredRelation(null)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.02] duration-200 shadow-md ${
                selectedTable === 'orders' 
                  ? 'bg-blue-950/20 border-blue-500/80 ring-2 ring-blue-500/30' 
                  : hoveredRelation === 'orders' ? 'bg-slate-900 border-blue-500/40' : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" /> orders
                </span>
                <span className="bg-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-700">FK Enlazado</span>
              </div>
              <ul className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <li className="text-slate-400">id <span className="text-slate-600">(PK)</span></li>
                <li className="text-blue-300 font-black flex items-center gap-0.5 truncate">
                  <Link2 className="w-2.5 h-2.5 text-blue-500 shrink-0" /> business_id <span className="text-slate-500 text-[8px]">(FK)</span>
                </li>
                <li className="text-slate-400">customer</li>
                <li className="text-slate-400">status</li>
                <li className="text-slate-400">total</li>
                <li className="text-slate-400">payment_status</li>
              </ul>
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[9px] text-slate-500">
                <span className="font-bold text-blue-400">Aislamiento RLS:</span>
                <span className="font-mono text-slate-400">orders.business_id = stores.id</span>
              </div>
            </div>

          </div>

          {/* CONNECTIONS (Right SVG Lines on md screens) */}
          <div className="md:col-span-1 hidden md:flex flex-col items-center justify-center">
            <svg width="40" height="240" className="overflow-visible pointer-events-none">
              {/* orders -> reviews */}
              <path 
                d="M -5 160 C 15 160, 15 120, 35 120" 
                fill="none" 
                stroke={hoveredRelation === 'reviews' || selectedTable === 'reviews' ? '#10b981' : '#334155'} 
                strokeWidth={selectedTable === 'reviews' ? '2' : '1.2'}
                className="transition-all duration-300"
              />
            </svg>
          </div>

          {/* NESTED GRANDCHILD TABLE: reviews (Far Right) */}
          <div className="md:col-span-2 flex flex-col justify-center">
            <div 
              onClick={() => setSelectedTable('reviews')}
              onMouseEnter={() => setHoveredRelation('reviews')}
              onMouseLeave={() => setHoveredRelation(null)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-[1.03] duration-200 shadow-md ${
                selectedTable === 'reviews' 
                  ? 'bg-emerald-950/20 border-emerald-500/80 ring-2 ring-emerald-500/30' 
                  : hoveredRelation === 'reviews' ? 'bg-slate-900 border-emerald-500/40' : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> reviews
                </span>
              </div>
              <ul className="space-y-1.5 text-[10px] font-mono">
                <li className="text-slate-400">id <span className="text-slate-600">(PK)</span></li>
                <li className="text-emerald-300 font-bold flex items-center gap-0.5 truncate">
                  <Link2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" /> business_id <span className="text-slate-500 text-[8px]">(FK)</span>
                </li>
                <li className="text-emerald-300 font-bold flex items-center gap-0.5 truncate">
                  <Link2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" /> order_id <span className="text-slate-500 text-[8px]">(FK)</span>
                </li>
                <li className="text-slate-400">food_rating</li>
              </ul>
              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex flex-col gap-0.5 text-[8px] text-slate-500 font-semibold">
                <div>Aislamiento RLS Directo:</div>
                <div className="font-mono text-emerald-400">reviews.business_id = stores.id</div>
              </div>
            </div>
          </div>

        </div>

        {/* Informative box demonstrating strict data partitioning rule */}
        <div className="mt-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 text-xs text-slate-400 space-y-2 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            ¿Por qué todas las tablas duplican el campo <code>business_id</code>?
          </div>
          <p>
            En bases de datos relacionales estándar, la reseña podría llegar al comercio a través de <code>reviews.order_id ➔ orders.business_id</code> sin duplicar el campo. Sin embargo, para <strong>Row Level Security (RLS)</strong>, la evaluación directa de políticas necesita resolver la propiedad de los registros en microsegundos sin hacer un <code>JOIN</code> en cada fila leída. Al propagar <code>business_id</code> de forma redundante pero indexada, las políticas de seguridad se evalúan en la capa de almacenamiento de manera ultraeficiente.
          </p>
        </div>
      </div>

      {/* TABS FOR SELECTED TABLE DETAILS: Columns vs Index Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SELECTED TABLE LIST SELECTOR */}
        <div className="lg:col-span-3 space-y-2.5">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Tablas de la Base de Datos:</label>
          <div className="flex flex-col gap-1.5 bg-slate-900/30 p-2 rounded-2xl border border-slate-800">
            {tableKeys.map(tName => {
              const table = TABLES_DATA[tName];
              const isSelected = selectedTable === tName;
              
              let accentColor = "text-indigo-400";
              if (tName === 'menus') accentColor = "text-amber-400";
              if (tName === 'orders') accentColor = "text-blue-400";
              if (tName === 'reviews') accentColor = "text-emerald-400";
              if (tName === 'accesomenuscan') accentColor = "text-rose-400";

              return (
                <button
                  key={tName}
                  onClick={() => setSelectedTable(tName)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs font-bold ${
                    isSelected 
                      ? 'bg-slate-800 text-white border border-slate-700/80 shadow-md' 
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Database className={`w-4 h-4 ${accentColor}`} />
                    <code>{table.name}</code>
                  </span>
                  <span className="bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded font-mono text-[9px]">
                    {table.columns.length} col
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL VIEW PANELS */}
        <div className="lg:col-span-9 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6">
          
          {/* Table Header Detail */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white px-2.5 py-1 rounded-lg font-mono text-xs font-black border border-slate-800">
                  TABLE "{currentTable.name}"
                </span>
                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/15 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-brand-500" /> RLS Activo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {currentTable.description}
              </p>
            </div>
          </div>

          {/* TWO PANEL SECTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PANEL 1: COLUMN DICTIONARY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" /> Diccionario de Columnas
                </span>
                <span className="text-[9px] text-slate-500 font-bold font-mono">Físico (PostgreSQL)</span>
              </div>
              
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden max-h-[350px] overflow-y-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] text-slate-400 font-black tracking-wider uppercase">
                      <th className="p-2.5 font-mono">Nombre</th>
                      <th className="p-2.5 font-mono">Tipo</th>
                      <th className="p-2.5 font-mono text-center">Atributos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-[11px]">
                    {currentTable.columns.map(col => {
                      let tag = null;
                      if (col.key === 'PK') {
                        tag = <span className="bg-yellow-500/10 text-yellow-500 font-mono text-[8px] font-black px-1.5 py-0.5 rounded border border-yellow-500/25">PK</span>;
                      } else if (col.key === 'FK') {
                        tag = <span className="bg-indigo-500/10 text-indigo-400 font-mono text-[8px] font-black px-1.5 py-0.5 rounded border border-indigo-500/25">FK</span>;
                      }

                      return (
                        <tr key={col.name} className="hover:bg-slate-900/30 group">
                          <td className="p-2.5 font-mono text-slate-200">
                            <div className="font-bold flex items-center gap-1">
                              {col.name}
                              {col.isPartitionKey && (
                                <span className="text-[8px] text-brand-500 bg-brand-500/10 px-1 py-0.2 rounded font-sans uppercase shrink-0">Partition</span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-500 font-sans mt-0.5 group-hover:text-slate-400 leading-snug">
                              {col.comment}
                            </div>
                            {col.key === 'FK' && (
                              <div className="text-[8px] text-indigo-400 font-mono mt-1">
                                ➔ {col.refTable}.{col.refColumn}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-slate-400 text-xs">
                            {col.type}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {tag}
                              <span className="text-[8px] text-slate-500 uppercase font-mono">
                                {col.nullable ? 'NULL' : 'NOT NULL'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PANEL 2: INDEX COVERAGE DIAGNOSTIC */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Cobertura de Índices en Postgres
              </span>

              <div className="space-y-3">
                {currentTable.indexes.map(idx => {
                  const isRebuildingThis = simulationStatus === 'running' && rebuiltIndex === idx.name;
                  const isRebuiltSuccess = simulationStatus === 'success' && rebuiltIndex === idx.name;

                  return (
                    <div key={idx.name} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                      {isRebuiltSuccess && (
                        <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in">
                          <div className="bg-slate-900 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-400 shadow-2xl">
                            <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                            Índice reconstruido (VACUUM ANALYZE)
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="text-xs font-mono font-black text-white">{idx.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{idx.type} para ({idx.columns.join(', ')})</div>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                          Óptimo
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {idx.purpose}
                      </p>

                      <div className="space-y-1.5">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Instrucción DDL</span>
                          <button
                            onClick={() => handleSimulateIndexRebuild(idx.name)}
                            disabled={simulationStatus !== 'idle'}
                            className="text-[9px] text-brand-500 hover:text-brand-400 font-bold uppercase tracking-wider flex items-center gap-1 hover:underline disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRebuildingThis ? 'animate-spin' : ''}`} />
                            {isRebuildingThis ? 'Reindexando...' : 'Reindexar'}
                          </button>
                        </div>
                        <pre className="bg-slate-900/60 p-2.5 rounded-lg text-[9.5px] font-mono text-brand-400 border border-slate-800 overflow-x-auto whitespace-pre no-scrollbar">
                          <code>{idx.sql}</code>
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RLS EXECUTION PATHWAY SIMULATOR (Footer Info) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Shield className="w-4 h-4 text-indigo-400" />
              Ruta de Ejecución del Optimizador (Aislamiento Multi-Tenant)
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Cuando un comercio ejecuta <code>SELECT * FROM {currentTable.name}</code>, Supabase intercepta la consulta y le inyecta la cláusula RLS activa: 
              <code> WHERE {currentTable.name}.business_id = auth.jwt() ➔ 'business_id'</code>. 
              Gracias al índice <code>idx_{currentTable.name}_business_id</code> (o compuesto compatible), el Query Planner ejecuta un <strong>Index Scan</strong> directo en lugar de un Sequential Scan de toda la base de datos, garantizando búsquedas en tiempo O(log N) que nunca filtran filas de otros inquilinos.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
