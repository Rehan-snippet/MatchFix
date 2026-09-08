import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function FilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  totalResultsCount = 0,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  function handleFormatToggle(fmt) {
    const list = localFilters.formats || [];
    const exists = list.includes(fmt);
    const updated = exists ? list.filter((f) => f !== fmt) : [...list, fmt];
    setLocalFilters({ ...localFilters, formats: updated });
  }

  function handleAmenityToggle(amenity) {
    const list = localFilters.amenities || [];
    const exists = list.includes(amenity);
    const updated = exists ? list.filter((a) => a !== amenity) : [...list, amenity];
    setLocalFilters({ ...localFilters, amenities: updated });
  }

  function handleClear() {
    setLocalFilters({
      minPrice: 500,
      maxPrice: 3500,
      formats: [],
      surfaces: [],
      amenities: [],
      instantBook: false,
    });
  }

  function handleApply() {
    onApplyFilters(localFilters);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold text-neutral-900">Filters</h3>
          <div className="w-6" />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Price Range */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 mb-1">Price range</h4>
            <p className="text-xs text-neutral-500 mb-4">Hourly match rate for field bookings</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 border border-neutral-300 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-neutral-900">
                <span className="text-[11px] text-neutral-500 block uppercase font-bold">Minimum</span>
                <div className="flex items-center text-sm font-bold text-neutral-900">
                  <span>৳</span>
                  <input
                    type="number"
                    value={localFilters.minPrice || 500}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, minPrice: Number(e.target.value) })
                    }
                    className="w-full pl-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-neutral-400 font-bold">—</div>

              <div className="flex-1 border border-neutral-300 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-neutral-900">
                <span className="text-[11px] text-neutral-500 block uppercase font-bold">Maximum</span>
                <div className="flex items-center text-sm font-bold text-neutral-900">
                  <span>৳</span>
                  <input
                    type="number"
                    value={localFilters.maxPrice || 3500}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, maxPrice: Number(e.target.value) })
                    }
                    className="w-full pl-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* Pitch Formats */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 mb-3">Pitch Format</h4>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: '5v5', label: '5-a-side' },
                { id: '7v7', label: '7-a-side' },
                { id: '11v11', label: '11-a-side' },
              ].map((fmt) => {
                const isSelected = (localFilters.formats || []).includes(fmt.id);
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => handleFormatToggle(fmt.id)}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-[#16a34a] bg-[#16a34a] text-white'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-800'
                    }`}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* Surface */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 mb-3">Pitch Surface</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {['Artificial Turf', 'Natural Grass'].map((surf) => {
                const isSelected = (localFilters.surfaces || []).includes(surf);
                return (
                  <button
                    key={surf}
                    type="button"
                    onClick={() => {
                      const cur = localFilters.surfaces || [];
                      const next = cur.includes(surf) ? cur.filter((s) => s !== surf) : [...cur, surf];
                      setLocalFilters({ ...localFilters, surfaces: next });
                    }}
                    className={`py-2.5 px-4 rounded-2xl border text-xs font-semibold text-left transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#16a34a] bg-[#16a34a] text-white'
                        : 'border-neutral-200 hover:border-neutral-400 text-neutral-800'
                    }`}
                  >
                    <span>{surf}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* Amenities Checklist */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 mb-3">Venue Amenities</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'floodlights', label: 'Floodlights (Night Play)' },
                { id: 'parking', label: 'Free Parking Space' },
                { id: 'locker', label: 'Locker & Changing Rooms' },
                { id: 'showers', label: 'Showers & Washroom' },
                { id: 'balls', label: 'Bibs & Balls Rental' },
                { id: 'water', label: 'Free Drinking Water' },
              ].map((item) => {
                const checked = (localFilters.amenities || []).includes(item.id);
                return (
                  <label
                    key={item.id}
                    onClick={() => handleAmenityToggle(item.id)}
                    className="flex items-center gap-2.5 text-xs text-neutral-800 cursor-pointer select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                        checked
                          ? 'border-[#16a34a] bg-[#16a34a] text-white'
                          : 'border-neutral-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50/70">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-neutral-700 underline hover:text-neutral-950"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-2xl shadow transition active:scale-95"
          >
            Show {totalResultsCount} Turfs
          </button>
        </div>
      </div>
    </div>
  );
}
