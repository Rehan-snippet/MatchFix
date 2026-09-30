import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Maximize2, RotateCcw, Plus, Minus } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

// Clean OpenStreetMap tile layer (100% free, zero watermark, no API key required)
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function TurfMap({
  turfs = [],
  hoveredTurfId = null,
  onMarkerHover,
  onMarkerLeave,
  selectedTurfId = null,
  onSelectTurf,
  includeFees = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const navigate = useNavigate();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Dhaka default center
    const defaultCenter = [23.7937, 90.4043];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: false, // We'll render modern Airbnb controls
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: ATTRIBUTION,
    }).addTo(map);

    // Add minimal attribution at bottom right
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers whenever turfs list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    const validCoords = [];

    turfs.forEach((t) => {
      const lat = parseFloat(t.latitude);
      const lng = parseFloat(t.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      validCoords.push([lat, lng]);

      const baseRate = parseFloat(t.hourly_rate || 1200);
      const displayPrice = includeFees ? Math.round(baseRate * 1.05) : Math.round(baseRate);
      const priceText = `৳${displayPrice.toLocaleString()}`;

      // Custom Airbnb Price Marker HTML
      const isHovered = hoveredTurfId === t.turf_id;
      const customIcon = L.divIcon({
        className: 'custom-airbnb-marker',
        html: `<div id="marker-turf-${t.turf_id}" class="airbnb-price-pin ${
          isHovered ? 'active' : ''
        }">${priceText}</div>`,
        iconSize: [64, 28],
        iconAnchor: [32, 14],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Popup mini-card (Airbnb style)
      const rawCover = t.cover_image || (t.images && (typeof t.images[0] === 'string' ? t.images[0] : t.images[0]?.url)) || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400';
      const cover = getImageUrl(rawCover, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400');
      const numRating = Number(t.average_rating || t.rating || 0);
      const ratingText = numRating > 0 ? `★ ${numRating.toFixed(1)}` : '★ New';
      const popupHtml = `
        <div style="width: 220px; font-family: inherit;">
          <div style="width: 100%; height: 130px; border-radius: 12px 12px 0 0; overflow: hidden; position: relative;">
            <img src="${cover}" alt="${t.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; top: 8px; left: 8px; background: rgba(255,255,255,0.92); font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px;">
              ${t.area_name || 'Dhaka'}
            </div>
          </div>
          <div style="padding: 10px 12px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; font-size: 13px; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                ${t.name}
              </span>
              <span style="font-size: 12px; font-weight: 600; color: #111;">${ratingText}</span>
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${t.address || ''}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px solid #f0f0f0; padding-top: 8px;">
              <div>
                <span style="font-weight: 800; font-size: 14px; color: #111;">${priceText}</span>
                <span style="font-size: 11px; color: #666;"> /hr</span>
              </div>
              <a href="/turfs/${t.turf_id}" style="background: #16a34a; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-decoration: none;">
                View
              </a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'airbnb-popup',
        maxWidth: 240,
        offset: [0, -10],
      });

      marker.on('mouseover', () => {
        if (onMarkerHover) onMarkerHover(t.turf_id);
      });
      marker.on('mouseout', () => {
        if (onMarkerLeave) onMarkerLeave();
      });
      marker.on('click', () => {
        if (onSelectTurf) onSelectTurf(t.turf_id);
      });

      markersRef.current[t.turf_id] = marker;
    });

    // Auto fit bounds if coordinates exist
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [turfs, includeFees]);

  // Sync Hovered State on Markers
  useEffect(() => {
    Object.keys(markersRef.current).forEach((id) => {
      const el = document.getElementById(`marker-turf-${id}`);
      if (el) {
        if (String(id) === String(hoveredTurfId)) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  }, [hoveredTurfId]);

  function handleZoomIn() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  }

  function handleZoomOut() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  }

  function handleRecenter() {
    if (!mapInstanceRef.current || turfs.length === 0) return;
    const validCoords = turfs
      .map((t) => [parseFloat(t.latitude), parseFloat(t.longitude)])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
    if (validCoords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(validCoords), { padding: [40, 40] });
    } else {
      mapInstanceRef.current.setView([23.7937, 90.4043], 12);
    }
  }

  return (
    <div className="relative z-0 isolate w-full h-full min-h-[420px] rounded-3xl overflow-hidden shadow-inner border border-neutral-200">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Modern Airbnb Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2.5 hover:bg-neutral-100 text-neutral-700 active:bg-neutral-200 border-b border-neutral-100 transition"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2.5 hover:bg-neutral-100 text-neutral-700 active:bg-neutral-200 transition"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Recenter Button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-6 right-4 z-10 p-2.5 bg-white rounded-xl shadow-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 transition"
        title="Recenter Map"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
