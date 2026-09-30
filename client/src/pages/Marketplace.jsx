import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Search, ShoppingBag, ShoppingCart, Plus, Star, Sparkles, Store, CheckCircle2, SlidersHorizontal, Tag, Heart } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const urlCategory = searchParams.get('category');
  const urlSearch = searchParams.get('search') || searchParams.get('q');

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState(urlSearch || '');
  const [category, setCategory] = useState(urlCategory || 'All Items');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [wishlist, setWishlist] = useState(new Set());

  // Sync state if URL changes externally (e.g. back/forward navigation)
  useEffect(() => {
    const currentUrlCat = searchParams.get('category') || 'All Items';
    const currentUrlSearch = searchParams.get('search') || searchParams.get('q') || '';
    if (currentUrlCat !== category) {
      setCategory(currentUrlCat);
    }
    if (currentUrlSearch !== q) {
      setQ(currentUrlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      api.get('/users/me/wishlist')
        .then(res => {
          setWishlist(new Set(res.data.map(item => item.product_id)));
        })
        .catch(console.error);
    } else {
      setWishlist(new Set());
    }
  }, [user]);

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Reset page on search or category change
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [q, category]);

  useEffect(() => {
    if (!hasMore && page > 1) return;
    setLoading(true);
    const timeout = setTimeout(() => {
      const params = { page, limit: 10 };
      if (q) params.search = q;
      if (category !== 'All Items') params.category = category;
      
      api
        .get('/products', { params })
        .then((res) => {
          const list = res.data || [];
          if (list.length < 10) setHasMore(false);
          setProducts((prev) => {
            if (page === 1) return list;
            const existingIds = new Set(prev.map((item) => item.product_id));
            const newItems = list.filter((item) => !existingIds.has(item.product_id));
            return [...prev, ...newItems];
          });
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [q, category, page]);

  function handleCategorySelect(cat) {
    setCategory(cat);
    const nextParams = new URLSearchParams(searchParams);
    if (cat === 'All Items') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', cat);
    }
    setSearchParams(nextParams);
  }

  function handleSearchChange(val) {
    setQ(val);
    const nextParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      nextParams.set('search', val);
    } else {
      nextParams.delete('search');
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  }

  function toggleWishlist(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please log in to add items to your wishlist.');
      return;
    }

    const isWished = wishlist.has(productId);
    const apiCall = isWished 
      ? api.delete(`/users/me/wishlist/${productId}`)
      : api.post(`/users/me/wishlist/${productId}`);

    apiCall.then(() => {
      setWishlist(prev => {
        const next = new Set(prev);
        if (isWished) next.delete(productId);
        else next.add(productId);
        return next;
      });
    }).catch(console.error);
  }

  return (
    <div className="w-full bg-white pb-20">
      {/* Category Pills Header (Airbnb Category Bar style) */}
      <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
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
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search gear, boots, jerseys…"
              value={q}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] bg-neutral-50/50 transition"
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading && page === 1 ? (
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
                setSearchParams({});
              }}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#16a34a] text-white text-xs font-bold shadow-xs hover:bg-[#15803d] transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((p, index) => (
              <Link
                ref={products.length === index + 1 ? lastElementRef : null}
                to={`/marketplace/${p.product_id}`}
                key={p.product_id}
                className="group flex flex-col cursor-pointer"
              >
                {/* Image Container with Airbnb Rounded Borders */}
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 mb-3 shadow-2xs group-hover:shadow-md transition duration-200">
                  <img
                    src={getImageUrl(p.cover_image, 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80')}
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

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => toggleWishlist(e, p.product_id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur hover:bg-white text-neutral-600 hover:scale-110 active:scale-95 transition"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.has(p.product_id) ? 'fill-rose-500 text-rose-500' : 'text-neutral-700'}`} />
                  </button>

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
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <h3 className="font-bold text-sm text-neutral-900 truncate min-w-0 flex-1 group-hover:text-[#16a34a] transition">
                      {p.title}
                    </h3>
                    {Number(p.avg_rating || p.average_rating) > 0 ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-neutral-800 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        <span>{Number(p.avg_rating || p.average_rating).toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-neutral-400 shrink-0">New</span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 flex items-center gap-1 min-w-0">
                    <Store className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate min-w-0">{p.shop_name}</span>
                  </p>

                  <div className="pt-1 flex items-center justify-between gap-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-neutral-900">
                        ৳{Number(p.price).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-neutral-500">VAT inc.</span>
                    </div>

                    {p.stock > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(p, 1);
                        }}
                        title="Add to cart"
                        className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-[#16a34a] text-neutral-700 hover:text-white transition shadow-2xs flex items-center justify-center cursor-pointer active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {loading && page > 1 && (
          <div className="py-6 text-center text-neutral-500 font-semibold animate-pulse">
            Loading more items...
          </div>
        )}
      </div>
    </div>
  );
}
