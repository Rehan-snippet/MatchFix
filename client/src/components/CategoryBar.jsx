import { useState } from 'react';
import {
  Sparkles,
  Users,
  Shield,
  Flag,
  Moon,
  TreePine,
  Building2,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  Check,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Turfs', icon: Sparkles },
  { id: '5v5', label: '5-a-side', icon: Users, filterKey: 'side_type', filterVal: '5v5' },
  { id: '7v7', label: '7-a-side', icon: Shield, filterKey: 'side_type', filterVal: '7v7' },
  { id: '11v11', label: '11-a-side', icon: Flag, filterKey: 'side_type', filterVal: '11v11' },
  { id: 'floodlit', label: 'Floodlit Night', icon: Moon, filterKey: 'amenity', filterVal: 'floodlit' },
  { id: 'artificial', label: 'Artificial Turf', icon: Sparkles, filterKey: 'surface', filterVal: 'Artificial' },
  { id: 'natural', label: 'Natural Grass', icon: TreePine, filterKey: 'surface', filterVal: 'Natural' },
  { id: 'indoor', label: 'Indoor Arena', icon: Building2, filterKey: 'amenity', filterVal: 'indoor' },
  { id: 'gear', label: 'Gear Shop', icon: ShoppingBag, isLink: '/marketplace' },
];

export default function CategoryBar({
  selectedCategory = 'all',
  onSelectCategory,
  onOpenFilters,
  activeFilterCount = 0,
  includeFees = true,
  onToggleIncludeFees,
  quickFilter,
  onToggleQuickFilter,
}) {
  return (
    <div className="w-full bg-white border-b border-neutral-200">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Categories Icons Carousel */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 scroll-smooth">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory && onSelectCategory(cat)}
                  className={`flex flex-col items-center gap-1.5 pb-1 flex-shrink-0 transition group cursor-pointer border-b-2 ${
                    isActive
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-neutral-900 stroke-[2.2]' : 'text-neutral-500 stroke-[1.8]'
                    }`}
                  />
                  <span className="text-xs font-semibold whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Controls: Filters button & Include fees pill */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Filter Dialog Trigger Button */}
            <button
              onClick={onOpenFilters}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition ${
                activeFilterCount > 0
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 text-neutral-800 hover:border-neutral-400 bg-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#16a34a] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* "Prices include all fees" toggle pill */}
            <button
              type="button"
              onClick={onToggleIncludeFees}
              className={`hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-medium transition cursor-pointer ${
                includeFees
                  ? 'border-neutral-300 bg-neutral-50 text-neutral-800 shadow-sm'
                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 bg-white'
              }`}
              title="Display transparent pricing with all taxes and arena fees included"
            >
              <Tag className={`w-3.5 h-3.5 ${includeFees ? 'text-[#16a34a]' : 'text-neutral-400'}`} />
              <span className="whitespace-nowrap">Prices include all fees</span>
              <div
                className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                  includeFees ? 'bg-[#16a34a]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    includeFees ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips (Free parking, Instant Book, Under 1500) */}
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-neutral-100 overflow-x-auto no-scrollbar">
          {[
            { id: 'under1500', label: 'Under ৳1,500/hr' },
            { id: 'instant', label: 'Instant Book' },
            { id: 'parking', label: 'Free parking' },
            { id: 'floodlit', label: 'Night floodlights' },
            { id: 'lockers', label: 'Locker rooms' },
          ].map((chip) => {
            const isChipActive = quickFilter && quickFilter[chip.id];
            return (
              <button
                key={chip.id}
                onClick={() => onToggleQuickFilter && onToggleQuickFilter(chip.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                  isChipActive
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
