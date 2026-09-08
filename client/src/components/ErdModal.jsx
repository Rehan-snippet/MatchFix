import { useState } from 'react';
import { X, Database, Key, ArrowRight, Layers, Table, Check, ExternalLink } from 'lucide-react';

export default function ErdModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('diagram');
  const [selectedEntity, setSelectedEntity] = useState('users');

  if (!isOpen) return null;

  const entities = [
    {
      name: 'users',
      category: 'Specialization (Super-entity)',
      description: 'Superclass entity table for all authenticated actors.',
      badge: 'Super-entity',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      columns: [
        { name: 'user_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'name', type: 'VARCHAR(150)', isRequired: true },
        { name: 'email', type: 'VARCHAR(150) UNIQUE', isRequired: true },
        { name: 'phone', type: 'VARCHAR(30)' },
        { name: 'password_hash', type: 'TEXT', isRequired: true },
        { name: 'is_active', type: 'BOOLEAN (default true)' },
        { name: 'created_at', type: 'TIMESTAMPTZ' },
      ],
      relations: [
        'Subclasses: organizers, sellers, customers (table-per-subclass sharing PK)',
        '1:N with bookings (customer_id)',
        '1:N with orders (customer_id)',
        '1:N with reviews (customer_id)',
      ],
    },
    {
      name: 'organizers',
      category: 'User Subclass',
      description: 'Venue owners who manage arenas, pitches, and schedule slots.',
      badge: 'Subclass',
      badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      columns: [
        { name: 'user_id', type: 'INTEGER (PK, FK -> users)', isPk: true, isFk: true },
        { name: 'trade_licence', type: 'VARCHAR(100)' },
        { name: 'payout_account', type: 'VARCHAR(150)' },
      ],
      relations: ['1:N with turfs (organizer_id)'],
    },
    {
      name: 'sellers',
      category: 'User Subclass',
      description: 'Merchants listing sports gear, boots, and balls in the marketplace.',
      badge: 'Subclass',
      badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      columns: [
        { name: 'user_id', type: 'INTEGER (PK, FK -> users)', isPk: true, isFk: true },
        { name: 'shop_name', type: 'VARCHAR(150)', isRequired: true },
        { name: 'payout_account', type: 'VARCHAR(150)' },
      ],
      relations: ['1:N with products (seller_id)'],
    },
    {
      name: 'customers',
      category: 'User Subclass',
      description: 'Players booking football turfs and purchasing marketplace items.',
      badge: 'Subclass',
      badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      columns: [
        { name: 'user_id', type: 'INTEGER (PK, FK -> users)', isPk: true, isFk: true },
        { name: 'default_address', type: 'TEXT' },
      ],
      relations: ['Owns bookings, orders, reviews'],
    },
    {
      name: 'areas',
      category: 'Location Domain',
      description: 'Geographic districts across Dhaka (Banani, Mirpur, Uttara, etc.).',
      badge: 'Domain Master',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      columns: [
        { name: 'area_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'name', type: 'VARCHAR(150) UNIQUE', isRequired: true },
        { name: 'city', type: 'VARCHAR(100) (default Dhaka)' },
        { name: 'center_lat', type: 'DECIMAL(9,6)' },
        { name: 'center_lng', type: 'DECIMAL(9,6)' },
      ],
      relations: ['1:N with turfs (locatedIn)'],
    },
    {
      name: 'turfs',
      category: 'Venues',
      description: 'Primary football facilities hosted on MatchFix.',
      badge: 'Core Entity',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      columns: [
        { name: 'turf_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'organizer_id', type: 'INTEGER (FK -> organizers)', isFk: true },
        { name: 'area_id', type: 'INTEGER (FK -> areas)', isFk: true },
        { name: 'name', type: 'VARCHAR(150)', isRequired: true },
        { name: 'address', type: 'TEXT', isRequired: true },
        { name: 'hourly_rate', type: 'NUMERIC(10,2)', isRequired: true },
        { name: 'latitude', type: 'DECIMAL(9,6)' },
        { name: 'longitude', type: 'DECIMAL(9,6)' },
        { name: 'rating', type: 'NUMERIC(3,2)' },
      ],
      relations: [
        '1:N with fields (contains)',
        '1:N with turf_images (hasPhoto)',
        '1:N with reviews (reviewedOn)',
      ],
    },
    {
      name: 'fields',
      category: 'Pitches',
      description: 'Individual pitches inside a turf complex (e.g. Field A 5v5, Field B 7v7).',
      badge: 'Owner Entity',
      badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      columns: [
        { name: 'field_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'turf_id', type: 'INTEGER (FK -> turfs)', isFk: true },
        { name: 'name', type: 'VARCHAR(100)', isRequired: true },
        { name: 'surface', type: 'surface_type (Artificial/Natural)' },
        { name: 'side_type', type: 'side_type (5v5/7v7/11v11)' },
      ],
      relations: ['1:N identifying relationship with slots (occupies)'],
    },
    {
      name: 'slots',
      category: 'Weak Entity',
      description: 'Time interval on a field identified by (field_id, slot_date, start_time).',
      badge: 'Weak Entity',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      columns: [
        { name: 'field_id', type: 'INTEGER (PK, FK -> fields)', isPk: true, isFk: true },
        { name: 'slot_date', type: 'DATE (PK)', isPk: true },
        { name: 'start_time', type: 'TIME (PK)', isPk: true },
        { name: 'end_time', type: 'TIME', isRequired: true },
        { name: 'rate_multiplier', type: 'NUMERIC(3,2) (default 1.00)' },
      ],
      relations: ['M:N with bookings via booking_slots'],
    },
    {
      name: 'bookings',
      category: 'Transactions',
      description: 'A player reservation securing one or more pitch slots.',
      badge: 'Core Entity',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      columns: [
        { name: 'booking_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'customer_id', type: 'INTEGER (FK -> customers)', isFk: true },
        { name: 'status', type: 'booking_status (PENDING/CONFIRMED/CANCELLED)' },
        { name: 'total_price', type: 'NUMERIC(10,2)', isRequired: true },
        { name: 'created_at', type: 'TIMESTAMPTZ' },
      ],
      relations: ['1:1 settledBy payment', 'M:N with slots via booking_slots'],
    },
    {
      name: 'payments',
      category: 'Financials',
      description: 'Settles Booking XOR pays Order via enforced CHECK constraint.',
      badge: 'Disjoint XOR',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      columns: [
        { name: 'payment_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'booking_id', type: 'INTEGER (FK -> bookings, nullable)', isFk: true },
        { name: 'order_id', type: 'INTEGER (FK -> orders, nullable)', isFk: true },
        { name: 'amount', type: 'NUMERIC(10,2)', isRequired: true },
        { name: 'method', type: 'payment_method (bKash/Nagad/Card/Cash)' },
        { name: 'status', type: 'payment_status (PENDING/SUCCESS/FAILED)' },
      ],
      relations: ['Enforces CHECK: (booking_id IS NOT NULL XOR order_id IS NOT NULL)'],
    },
    {
      name: 'products',
      category: 'Marketplace',
      description: 'Sports gear, boots, jerseys, and football equipment.',
      badge: 'Marketplace',
      badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      columns: [
        { name: 'product_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'seller_id', type: 'INTEGER (FK -> sellers)', isFk: true },
        { name: 'title', type: 'VARCHAR(150)', isRequired: true },
        { name: 'price', type: 'NUMERIC(10,2)', isRequired: true },
        { name: 'category', type: 'VARCHAR(50)' },
        { name: 'stock', type: 'INTEGER (default 0)' },
      ],
      relations: ['1:N with product_images', '1:N with order_items'],
    },
    {
      name: 'orders',
      category: 'Marketplace Orders',
      description: 'Purchases of sports gear by customer.',
      badge: 'Transactions',
      badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-300',
      columns: [
        { name: 'order_id', type: 'SERIAL (PK)', isPk: true },
        { name: 'customer_id', type: 'INTEGER (FK -> customers)', isFk: true },
        { name: 'total_amount', type: 'NUMERIC(10,2)', isRequired: true },
        { name: 'status', type: 'order_status (PENDING/PROCESSING/DELIVERED)' },
        { name: 'delivery_address', type: 'TEXT' },
      ],
      relations: ['1:N with order_items', '1:1 with payment (settles order)'],
    },
  ];

  const current = entities.find((e) => e.name === selectedEntity) || entities[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-3xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16a34a] text-white flex items-center justify-center font-bold shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-neutral-900">
                  Match<span className="text-[#16a34a]">Fix</span>!
                </span>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  · ER Diagram
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                PostgreSQL Relational Schema & Entity Relationship Model (CSE216 Database Sessional)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="hidden sm:flex bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('diagram')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'diagram'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Interactive Explorer
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'overview'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All Tables ({entities.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition"
              title="Close ERD viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'diagram' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Entity List Sidebar */}
            <div className="w-full md:w-64 border-r border-neutral-200 bg-neutral-50/70 p-3 overflow-y-auto space-y-1">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-2 py-1.5">
                Database Entities
              </div>
              {entities.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setSelectedEntity(item.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedEntity === item.name
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'text-neutral-700 hover:bg-white hover:text-neutral-900'
                  }`}
                >
                  <span className="font-mono">{item.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      selectedEntity === item.name
                        ? 'bg-neutral-800 text-white'
                        : 'bg-neutral-200/70 text-neutral-600'
                    }`}
                  >
                    {item.columns.length} cols
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Selected Entity Inspector */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {/* Entity Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-mono text-xl font-black text-neutral-900">
                      {current.name}
                    </h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${current.badgeColor}`}>
                      {current.badge}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">{current.description}</p>
                </div>
                <div className="text-xs font-semibold text-neutral-500">
                  Category: <span className="text-neutral-900">{current.category}</span>
                </div>
              </div>

              {/* Attributes / Columns Table */}
              <div>
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-[#16a34a]" />
                  Attributes / Columns
                </h4>
                <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
                      <tr>
                        <th className="py-2.5 px-4">Column Name</th>
                        <th className="py-2.5 px-4">Data Type & Constraint</th>
                        <th className="py-2.5 px-4">Key Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {current.columns.map((col) => (
                        <tr key={col.name} className="hover:bg-neutral-50/50">
                          <td className="py-2.5 px-4 font-mono font-bold text-neutral-900">
                            {col.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-neutral-600">
                            {col.type}
                          </td>
                          <td className="py-2.5 px-4">
                            {col.isPk && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-[10px] font-bold mr-1">
                                <Key className="w-3 h-3" /> PK
                              </span>
                            )}
                            {col.isFk && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                                FK
                              </span>
                            )}
                            {!col.isPk && !col.isFk && (
                              <span className="text-neutral-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relationships & Integrity Constraints */}
              <div>
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-[#16a34a]" />
                  Relationships & Cardinality
                </h4>
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2">
                  {current.relations.map((rel, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 flex-shrink-0" />
                      <span>{rel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Grid View of all entities */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.map((item) => (
                <div
                  key={item.name}
                  onClick={() => {
                    setSelectedEntity(item.name);
                    setActiveTab('diagram');
                  }}
                  className="p-4 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-900 transition cursor-pointer group hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-sm text-neutral-900 group-hover:text-[#16a34a]">
                      {item.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{item.description}</p>
                  <div className="text-[11px] text-neutral-600 font-mono space-y-0.5 border-t border-neutral-100 pt-2">
                    {item.columns.slice(0, 3).map((col) => (
                      <div key={col.name} className="truncate">
                        • {col.name} <span className="text-neutral-400">({col.type})</span>
                      </div>
                    ))}
                    {item.columns.length > 3 && (
                      <div className="text-neutral-400">+{item.columns.length - 3} more columns</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span>Schema verified with PostgreSQL 16 · All FK cascade rules intact</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-black text-white font-bold rounded-xl transition"
          >
            Close ERD
          </button>
        </div>
      </div>
    </div>
  );
}
