import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import TurfCard from '../components/TurfCard';
import TurfMap from '../components/TurfMap';
import CategoryBar from '../components/CategoryBar';
import FilterModal from '../components/FilterModal';
import Pagination from '../components/Pagination';
import { MapPin, Tag, SlidersHorizontal, Map, List, Frown } from 'lucide-react';

export default function Turfs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [turfs, setTurfs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Search query params
  const areaId = searchParams.get('area_id') || '';
  const keyword = searchParams.get('keyword') || '';
  const date = searchParams.get('date') || '';
  const sideType = searchParams.get('side_type') || '';
  const surfaceParam = searchParams.get('surface') || '';

  // UI Interactive States
  const [hoveredTurfId, setHoveredTurfId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [includeFees, setIncludeFees] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'

  // Filter State
  const [filters, setFilters] = useState({
    minPrice: 500,
    maxPrice: 3500,
    formats: sideType ? [sideType] : [],
    surfaces: surfaceParam ? [surfaceParam] : [],
    amenities: [],
    instantBook: false,
  });

  const [quickFilter, setQuickFilter] = useState({
    under1500: false,
    instant: false,
    parking: false,
    floodlit: false,
    lockers: false,
  });

  // Favorites (Wishlist) in localStorage
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

  // Fetch areas
  useEffect(() => {
    api
      .get('/areas')
      .then((res) => setAreas(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('Failed to load areas in Turfs:', err));
  }, []);

  // Fetch turfs from API
  useEffect(() => {
    setLoading(true);
    setFetchError('');
    const params = { page };
    if (areaId) params.area_id = areaId;
    if (keyword) params.search = keyword;

    api
      .get('/turfs', { params })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTurfs(res.data);
          setPagination(null);
        } else {
          setTurfs(res.data.data || []);
          setPagination(res.data.pagination || null);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch turfs:', err);
        setFetchError('Could not load turfs. Please check your connection and try again.');
      })
      .finally(() => setLoading(false));
  }, [areaId, keyword, page]);

  // Handle category click from CategoryBar
  function handleSelectCategory(cat) {
    if (cat.isLink) {
      window.location.href = cat.isLink;
      return;
    }
    setSelectedCategory(cat.id);

    if (cat.filterKey === 'side_type') {
      setFilters((prev) => ({
        ...prev,
        formats: cat.filterVal ? [cat.filterVal] : [],
      }));
    } else if (cat.filterKey === 'surface') {
      setFilters((prev) => ({
        ...prev,
        surfaces: cat.filterVal ? [cat.filterVal] : [],
      }));
    } else if (cat.id === 'all') {
      setFilters((prev) => ({
        ...prev,
        formats: [],
        surfaces: [],
      }));
    }
  }

  function handleToggleQuickFilter(chipId) {
    setQuickFilter((prev) => ({
      ...prev,
      [chipId]: !prev[chipId],
    }));
  }

  // Client-side filtering combining CategoryBar, quick chips, and FilterModal
  const filteredTurfs = useMemo(() => {
    return turfs.filter((t) => {
      const price = parseFloat(t.hourly_rate || 1200);

      // Price filter from modal
      if (price < (filters.minPrice || 0) || price > (filters.maxPrice || 99999)) {
        return false;
      }

      // Quick filter: under 1500
      if (quickFilter.under1500 && price > 1500) {
        return false;
      }

      // Format filter (5v5, 7v7, 11v11)
      if (filters.formats && filters.formats.length > 0) {
        const hasFormat = Array.isArray(t.fields) && t.fields.some((f) => filters.formats.includes(f.side_type));
        if (!hasFormat) return false;
      }

      // Surface filter
      if (filters.surfaces && filters.surfaces.length > 0) {
        const hasSurface = Array.isArray(t.fields) && t.fields.some((f) =>
          filters.surfaces.some((s) => f.surface?.toLowerCase().includes(s.toLowerCase()))
        );
        if (!hasSurface) return false;
      }

      // Quick filter / Amenities
      if (quickFilter.parking || (filters.amenities && filters.amenities.includes('parking'))) {
        const desc = (t.description || '').toLowerCase();
        if (!desc.includes('parking')) return false;
      }

      if (quickFilter.lockers || (filters.amenities && filters.amenities.includes('locker'))) {
        const desc = (t.description || '').toLowerCase();
        if (!desc.includes('locker')) return false;
      }

      if (quickFilter.floodlit || (filters.amenities && filters.amenities.includes('floodlights'))) {
        const desc = (t.description || '').toLowerCase();
        if (!desc.includes('floodlit') && !desc.includes('floodlight')) return false;
      }

      return true;
    });
  }, [turfs, filters, quickFilter]);

  const currentAreaObj = areas.find((a) => String(a.area_id) === String(areaId));
  const locationTitle = currentAreaObj
    ? `in ${currentAreaObj.name}`
    : keyword
    ? `for "${keyword}"`
    : 'in Dhaka';

  return (
    <div className="w-full min-h-screen bg-white">
      {/* 1. Category Bar with Icons & Filter Buttons */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onOpenFilters={() => setFilterModalOpen(true)}
        activeFilterCount={
          (filters.formats.length ? 1 : 0) +
          (filters.surfaces.length ? 1 : 0) +
          (filters.amenities.length ? 1 : 0) +
          (filters.minPrice > 500 || filters.maxPrice < 3500 ? 1 : 0)
        }
        includeFees={includeFees}
        onToggleIncludeFees={() => setIncludeFees(!includeFees)}
        quickFilter={quickFilter}
        onToggleQuickFilter={handleToggleQuickFilter}
      />

      {/* 2. Main Content: Split-Screen Layout (Listings on Left, Map on Right) */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-neutral-100 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {loading
                ? 'Searching available turfs…'
                : filteredTurfs.length > 0
                ? `Over ${filteredTurfs.length} ${
                    filteredTurfs.length === 1 ? 'turf' : 'turfs'
                  } ${locationTitle}`
                : `No turfs found ${locationTitle}`}
            </h1>
            {date && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Matches for <span className="font-semibold text-neutral-800">{date}</span>
              </p>
            )}
          </div>

          {/* Transparent pricing tag */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-full">
            <Tag className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Prices include all taxes and venue charges</span>
          </div>
        </div>

        {/* Split Screen Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
          {/* LEFT SIDE: Turf Listings Grid (7 cols on desktop) */}
          <div
            className={`lg:col-span-7 ${
              mobileView === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {fetchError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
                <span>{fetchError}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p)}
                  className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="animate-pulse space-y-3">
                    <div className="aspect-[20/19] bg-neutral-200 rounded-2xl w-full" />
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                    <div className="h-4 bg-neutral-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredTurfs.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-neutral-200 rounded-3xl p-8 bg-neutral-50/50">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
                  <Frown className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">No exact matches found</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Try broadening your search filters, adjusting your price range, or clearing area restrictions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      minPrice: 500,
                      maxPrice: 3500,
                      formats: [],
                      surfaces: [],
                      amenities: [],
                      instantBook: false,
                    });
                    setQuickFilter({
                      under1500: false,
                      instant: false,
                      parking: false,
                      floodlit: false,
                      lockers: false,
                    });
                    setSearchParams({});
                  }}
                  className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-bold hover:bg-neutral-800 transition"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {filteredTurfs.map((turf) => (
                  <TurfCard
                    key={turf.turf_id}
                    turf={turf}
                    isHovered={hoveredTurfId === turf.turf_id}
                    onHover={(id) => setHoveredTurfId(id)}
                    onLeave={() => setHoveredTurfId(null)}
                    isFavorite={favorites.includes(turf.turf_id)}
                    onToggleFavorite={toggleFavorite}
                    includeFees={includeFees}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <Pagination
              pagination={pagination}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* RIGHT SIDE: Sticky Interactive Map (5 cols on desktop) */}
          <div
            className={`lg:col-span-5 ${
              mobileView === 'list' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="sticky top-24 w-full h-[450px] sm:h-[600px] lg:h-[calc(100vh-140px)]">
              <TurfMap
                turfs={filteredTurfs}
                hoveredTurfId={hoveredTurfId}
                onMarkerHover={(id) => setHoveredTurfId(id)}
                onMarkerLeave={() => setHoveredTurfId(null)}
                includeFees={includeFees}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Floating Mobile Toggle: "Show map" / "Show list" (Airbnb signature) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-neutral-900 text-white text-xs font-bold shadow-2xl hover:scale-105 active:scale-95 transition"
        >
          {mobileView === 'list' ? (
            <>
              <span>Show map</span>
              <Map className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Show list</span>
              <List className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* 4. Full Filter Modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={(f) => setFilters(f)}
        totalResultsCount={filteredTurfs.length}
      />
    </div>
  );
}
