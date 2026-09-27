import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import AirbnbSearchCapsule from '../components/SearchCapsule';
import CategoryBar from '../components/CategoryBar';
import TurfCard from '../components/TurfCard';
import { ArrowRight, Trophy, Sparkles, Shield, ShoppingBag, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [turfs, setTurfs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeFees, setIncludeFees] = useState(true);

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('matchfix_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  function toggleFavorite(id) {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('matchfix_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    Promise.all([
      api.get('/turfs').then((res) => res.data),
      api.get('/products').then((res) => res.data).catch(() => []),
    ])
      .then(([turfList, productList]) => {
        setTurfs(turfList);
        setProducts(productList.slice(0, 10));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full bg-white pb-20">
      {/* 1. Category Bar directly under header */}
      <CategoryBar
        selectedCategory="all"
        onSelectCategory={(cat) => {
          if (cat.isLink) window.location.href = cat.isLink;
          else if (cat.id === 'all') window.location.href = '/turfs';
          else if (cat.filterKey === 'side_type') window.location.href = `/turfs?side_type=${cat.filterVal}`;
          else if (cat.filterKey === 'surface') window.location.href = `/turfs?surface=${cat.filterVal}`;
          else window.location.href = '/turfs';
        }}
        includeFees={includeFees}
        onToggleIncludeFees={() => setIncludeFees(!includeFees)}
      />

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2. Hero Header with OG Logo, subtitle & green ERD pill button */}
        <div className="pt-8 pb-10 text-center max-w-3xl mx-auto">
          {/* Limited light blue accent pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Football Venues & Gear in Dhaka
          </span>

          <div className="block mt-1">
            <h1 className="font-black text-4xl sm:text-6xl text-neutral-900 tracking-tight leading-tight">
              Match<span className="text-[#16a34a]">Fix</span>!
            </h1>
            <p className="mt-2 text-sm sm:text-base font-semibold text-neutral-600">
              A Turf booking platform and Marketplace
            </p>
          </div>

          <div className="mt-7">
            <AirbnbSearchCapsule isHero={true} />
          </div>

          {/* Quick Location Shortcuts */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-700">Quick explore:</span>
            {['Banani', 'Gulshan', 'Uttara', 'Mirpur', 'Mohammadpur', 'Badda'].map((loc) => (
              <Link
                key={loc}
                to={`/turfs?keyword=${loc}`}
                className="px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 transition bg-neutral-50/50"
              >
                {loc}
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Section: Popular Turfs in Dhaka (Grid) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Popular turfs in Dhaka
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Top rated artificial grass pitches with floodlights and verified player reviews
              </p>
            </div>
            <Link
              to="/turfs"
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-neutral-900 hover:text-[#16a34a] transition"
            >
              <span>View all turfs on map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse space-y-3">
                  <div className="aspect-[20/19] bg-neutral-200 rounded-2xl w-full" />
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {turfs.slice(0, 8).map((turf) => (
                <TurfCard
                  key={turf.turf_id}
                  turf={turf}
                  isFavorite={favorites.includes(turf.turf_id)}
                  onToggleFavorite={toggleFavorite}
                  includeFees={includeFees}
                />
              ))}
            </div>
          )}
        </div>

        {/* 4. Section: Host Banner */}
        <div className="mt-16 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-xl relative z-10 space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider">
              For Venue Owners
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Host your football turf on MatchFix
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Accept instant bookings, configure peak hour pricing, track earnings, and eliminate double-bookings with our real-time organizer suite.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/organizer"
                className="px-6 py-3 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-bold shadow-lg transition active:scale-95"
              >
                Start hosting today
              </Link>
              <Link
                to="/turfs"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition"
              >
                Browse directory
              </Link>
            </div>
          </div>

          <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 text-neutral-800 opacity-20">
            <Trophy className="w-80 h-80" />
          </div>
        </div>

        {/* 5. Section: Marketplace Football Gear */}
        {products.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Pro gear for matchday
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Boots, match balls, gloves, and team kits delivered right to your turf
                </p>
              </div>
              <Link
                to="/marketplace"
                className="flex items-center gap-1 text-xs sm:text-sm font-bold text-neutral-900 hover:text-[#16a34a] transition"
              >
                <span>Visit marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link
                  key={p.product_id}
                  to={`/marketplace/${p.product_id}`}
                  className="group rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:shadow-md transition"
                >
                  <div className="aspect-square bg-neutral-100 overflow-hidden relative">
                    <img
                      src={
                        p.cover_image ||
                        'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600'
                      }
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-white/90 text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <div className="text-xs text-neutral-500">{p.shop_name}</div>
                    <div className="text-sm font-bold text-neutral-900 truncate mt-0.5">{p.title}</div>
                    <div className="text-sm font-extrabold text-neutral-900 mt-1">
                      ৳{parseFloat(p.price).toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}