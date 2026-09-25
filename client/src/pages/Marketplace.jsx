import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Search, ShoppingBag, Star, Sparkles, Store, CheckCircle2, SlidersHorizontal, Tag } from 'lucide-react';

const CATEGORIES = [
  'All Items',
  'Football Boots',
  'Match Balls',
  'Jerseys & Kits',
  'Goalkeeper Gloves',
  'Training Gear',
  'Accessories',
];

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All Items');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .get('/products', { params: q ? { q } : {} })
        .then((res) => {
          let list = Array.isArray(res.data) ? res.data : res.data?.data || [];
          if (category !== 'All Items') {
            list = list.filter((p) =>
              p.category?.toLowerCase().includes(category.toLowerCase()) ||
              p.title?.toLowerCase().includes(category.toLowerCase())
            );
          }
          setProducts(list);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, category]);

  return (
    <div className="w-full bg-white pb-20">
      {/* Category Pills Header (Airbnb Category Bar style) */}
      <div className="sticky top-[73px] z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-neutral-500 font-medium">
              {products.length} {products.length === 1 ? 'item' : 'items'} available
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search Header Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Official Player Marketplace</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Football Gear & Apparel
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500">
              Verified boots, match balls, and kits sold by top sellers across Bangladesh.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gear, boots, jerseys…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] bg-neutral-50/50 transition"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="bg-neutral-200 rounded-3xl aspect-[4/3] w-full" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 border border-neutral-200 rounded-3xl p-8 max-w-md mx-auto my-6">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-800">No items found</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Try modifying your search or clearing your category filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQ('');
                setCategory('All Items');
              }}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#16a34a] text-white text-xs font-bold shadow-xs hover:bg-[#15803d] transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((p) => (
              <Link
                to={`/marketplace/${p.product_id}`}
                key={p.product_id}
                className="group flex flex-col cursor-pointer"
              >
                {/* Image Container with Airbnb Rounded Borders */}
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 mb-3 shadow-2xs group-hover:shadow-md transition duration-200">
                  <img
                    src={p.cover_image || 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 ease-out"
                    loading="lazy"
                  />
                  {/* Condition Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-neutral-900 text-[10px] font-bold shadow-xs uppercase tracking-wider">
                      {p.condition || 'New'}
                    </span>
                  </div>

                  {/* Stock Status Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-xs shadow-2xs ${
                      p.stock > 0
                        ? 'bg-neutral-900/80 text-white'
                        : 'bg-rose-600/90 text-white'
                    }`}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-sm text-neutral-900 truncate group-hover:text-[#16a34a] transition">
                      {p.title}
                    </h3>
                    {p.avg_rating && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-neutral-800 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        <span>{p.avg_rating}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <Store className="w-3 h-3 text-neutral-400" />
                    <span className="truncate">{p.shop_name}</span>
                  </p>

                  <div className="pt-1 flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-neutral-900">
                      ৳{Number(p.price).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-500">VAT inc.</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
