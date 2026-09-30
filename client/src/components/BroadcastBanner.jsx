import { useState, useEffect } from 'react';
import api from '../api/client';
import { Megaphone, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export default function BroadcastBanner() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('matchfix_broadcast_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }

    async function loadBanner() {
      try {
        const { data } = await api.get('/settings/public');
        if (data && data.broadcast_enabled && data.broadcast_message) {
          setBanner(data);
        }
      } catch (err) {
        // Silently ignore if public settings fail
      }
    }
    loadBanner();
  }, []);

  if (!banner || dismissed || !banner.broadcast_enabled || !banner.broadcast_message?.trim()) {
    return null;
  }

  const typeConfig = {
    info: {
      bg: 'bg-blue-600 text-white',
      border: 'border-blue-700',
      icon: Info,
    },
    warning: {
      bg: 'bg-amber-500 text-neutral-950',
      border: 'border-amber-600',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-emerald-600 text-white',
      border: 'border-emerald-700',
      icon: CheckCircle2,
    },
    alert: {
      bg: 'bg-rose-600 text-white',
      border: 'border-rose-700',
      icon: Megaphone,
    },
  };

  const style = typeConfig[banner.broadcast_type] || typeConfig.info;
  const Icon = style.icon;

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem('matchfix_broadcast_dismissed', 'true');
  }

  return (
    <aside
      aria-label="Platform broadcast announcement"
      className={`relative z-[60] px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 border-b shadow-xs ${style.bg} ${style.border}`}
    >
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 mx-auto text-center truncate sm:text-left">
          <Icon className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="truncate">{banner.broadcast_message}</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-black/15 transition flex-shrink-0 cursor-pointer"
          title="Dismiss announcement"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
