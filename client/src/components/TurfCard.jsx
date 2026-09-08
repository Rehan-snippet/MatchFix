import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TurfCard({
  turf,
  isHovered = false,
  onHover,
  onLeave,
  isFavorite = false,
  onToggleFavorite,
  includeFees = true,
}) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Collect image array, falling back to cover_image or placeholder
  const images = Array.isArray(turf.images) && turf.images.length > 0
    ? turf.images
    : turf.cover_image
    ? [turf.cover_image]
    : ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'];

  function handlePrevImage(e) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function handleNextImage(e) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(turf.turf_id);
  }

  // Derive rating (deterministic or from reviews)
  const rating = turf.rating || (4.75 + ((turf.turf_id * 7) % 25) / 100).toFixed(2);
  const reviewCount = turf.review_count || 12 + ((turf.turf_id * 13) % 40);

  // Derive price
  const baseRate = parseFloat(turf.hourly_rate || 1200);
  const displayPrice = includeFees ? Math.round(baseRate * 1.05) : Math.round(baseRate);

  // Field formats tag
  const formats = Array.isArray(turf.fields) && turf.fields.length > 0
    ? turf.fields.map((f) => f.side_type).filter(Boolean).join(' · ')
    : '5v5 & 7v7';
  const surface = Array.isArray(turf.fields) && turf.fields[0]?.surface
    ? turf.fields[0].surface
    : 'Artificial Turf';

  return (
    <div
      onMouseEnter={() => onHover && onHover(turf.turf_id)}
      onMouseLeave={() => onLeave && onLeave()}
      className={`group relative flex flex-col rounded-2xl cursor-pointer transition-all duration-200 ${
        isHovered ? 'scale-[1.01]' : ''
      }`}
    >
      <Link to={`/turfs/${turf.turf_id}`} className="block">
        {/* Photo Container with Carousel & Badges */}
        <div className="relative aspect-[20/19] w-full overflow-hidden rounded-2xl bg-neutral-100">
          <img
            src={images[currentImageIndex]}
            alt={turf.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Guest Favorite Badge */}
          {(turf.turf_id % 2 === 1 || turf.turf_id === 1) && (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-neutral-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-neutral-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              <span>Guest favorite</span>
            </div>
          )}

          {/* Save / Heart Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 rounded-full hover:scale-110 active:scale-95 transition focus:outline-none cursor-pointer"
            title="Save to wishlist"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite
                  ? 'fill-[#16a34a] stroke-[#16a34a]'
                  : 'fill-black/30 stroke-white stroke-[2]'
              }`}
            />
          </button>

          {/* Carousel Arrow Controls (Appear on Card Hover) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-md transition-all hover:scale-105"
                title="Previous photo"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-md transition-all hover:scale-105"
                title="Next photo"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                {images.slice(0, 5).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentImageIndex
                        ? 'w-4 bg-white'
                        : 'w-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Card Metadata (Airbnb typography & spacing) */}
        <div className="mt-3 flex flex-col gap-0.5 text-left">
          {/* Line 1: Location & Star Rating */}
          <div className="flex items-center justify-between text-[15px] font-semibold text-neutral-900 leading-snug">
            <span className="truncate">Turf in {turf.area_name || 'Dhaka'}, Bangladesh</span>
            <div className="flex items-center gap-1 flex-shrink-0 text-sm font-semibold">
              <Star className="w-3.5 h-3.5 fill-neutral-900 stroke-neutral-900" />
              <span>{rating}</span>
              <span className="text-neutral-500 font-normal">({reviewCount})</span>
            </div>
          </div>

          {/* Line 2: Venue Name */}
          <div className="text-[14px] font-medium text-neutral-700 truncate">
            {turf.name}
          </div>

          {/* Line 3: Surface & Pitch Formats */}
          <div className="text-[13px] text-neutral-500 truncate">
            {formats} · {surface}
          </div>

          {/* Line 4: Match schedule preview */}
          <div className="text-[13px] text-neutral-500">
            Open daily · Evening floodlit slots
          </div>

          {/* Line 5: Price breakdown */}
          <div className="mt-1 flex items-baseline gap-1.5 text-[15px] text-neutral-900">
            <span className="font-bold">৳{displayPrice.toLocaleString()}</span>
            <span className="text-neutral-600 text-sm font-normal">/ hour</span>
            {includeFees && (
              <span className="text-[11px] text-neutral-500 font-normal ml-1">all fees incl.</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
