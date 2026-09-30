import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DHAKA_DEFAULT = [23.7937, 90.4043];

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  height = '240px',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [detecting, setDetecting] = useState(false);

  const parsedLat = parseFloat(latitude);
  const parsedLng = parseFloat(longitude);
  const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0;

  // Custom emerald pin icon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-location-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #16a34a;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg) translate(-8px, -8px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          border: 2.5px solid white;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = hasCoords ? [parsedLat, parsedLng] : DHAKA_DEFAULT;
    const initialZoom = hasCoords ? 14 : 12;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: ATTRIBUTION,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    // Initial marker if coordinates exist
    if (hasCoords) {
      const marker = L.marker([parsedLat, parsedLng], {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        if (onChange) {
          onChange({
            latitude: pos.lat.toFixed(6),
            longitude: pos.lng.toFixed(6),
          });
        }
      });

      markerRef.current = marker;
    }

    // Click handler to drop or move pin
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: createPinIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', (ev) => {
          const pos = ev.target.getLatLng();
          if (onChange) {
            onChange({
              latitude: pos.lat.toFixed(6),
              longitude: pos.lng.toFixed(6),
            });
          }
        });

        markerRef.current = marker;
      }

      if (onChange) {
        onChange({
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        });
      }
    });

    mapRef.current = map;

    // Invalidate size to ensure proper tile loading
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when latitude/longitude props change from inputs
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hasCoords) {
      if (markerRef.current) {
        markerRef.current.setLatLng([parsedLat, parsedLng]);
      } else {
        const marker = L.marker([parsedLat, parsedLng], {
          icon: createPinIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          if (onChange) {
            onChange({
              latitude: pos.lat.toFixed(6),
              longitude: pos.lng.toFixed(6),
            });
          }
        });

        markerRef.current = marker;
      }
    }
  }, [latitude, longitude]);

  function handleLocateMe(e) {
    if (e) e.preventDefault();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 15);
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else if (mapRef.current) {
          const marker = L.marker([lat, lng], {
            icon: createPinIcon(),
            draggable: true,
          }).addTo(mapRef.current);

          marker.on('dragend', (ev) => {
            const mPos = ev.target.getLatLng();
            if (onChange) {
              onChange({
                latitude: mPos.lat.toFixed(6),
                longitude: mPos.lng.toFixed(6),
              });
            }
          });

          markerRef.current = marker;
        }

        if (onChange) {
          onChange({
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          });
        }
      },
      (err) => {
        setDetecting(false);
        alert(err.message || 'Unable to retrieve your location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function handleResetToDhaka(e) {
    if (e) e.preventDefault();
    if (mapRef.current) {
      mapRef.current.flyTo(DHAKA_DEFAULT, 12);
    }
  }

  return (
    <div className="w-full space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#16a34a]" />
          <span>Interactive Location Picker</span>
          <span className="text-[11px] text-neutral-400 font-normal">
            (click map or drag pin)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDhaka}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 transition"
            title="Recenter on Dhaka"
          >
            <Compass className="w-3 h-3" />
            <span>Dhaka</span>
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={detecting}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16a34a] hover:text-[#15803d] transition disabled:opacity-50"
          >
            <Navigation className="w-3 h-3" />
            <span>{detecting ? 'Locating…' : 'My Location'}</span>
          </button>
        </div>
      </div>

      <div
        className="w-full rounded-2xl overflow-hidden border border-neutral-200/90 shadow-2xs relative z-0"
        style={{ height }}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {hasCoords ? (
        <p className="text-[11px] text-neutral-500 flex items-center justify-between">
          <span>
            Selected: <strong className="text-neutral-800">{parsedLat.toFixed(5)}, {parsedLng.toFixed(5)}</strong>
          </span>
          <span className="text-[#16a34a] font-medium">✓ Location pinned</span>
        </p>
      ) : (
        <p className="text-[11px] text-amber-600">
          ⚠️ No location pinned yet. Click anywhere on the map above to set GPS.
        </p>
      )}
    </div>
  );
}
