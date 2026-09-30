/**
 * Resolves an image URL for display in the frontend.
 * - Leaves absolute URLs (http, https, data:, blob:) intact.
 * - Handles relative /uploads/... paths by prepending backend origin if configured,
 *   or returning /uploads/... (which works directly via Vite proxy or same-origin server).
 * - Falls back to an optional default image if the URL is empty or null.
 */
export function getImageUrl(url, fallback = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80') {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const trimmed = url.trim();

  // Already an absolute or special protocol URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Relative uploaded path (e.g. /uploads/turfs/... or uploads/turfs/...)
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
    try {
      const origin = new URL(apiBase).origin;
      return `${origin}${cleanPath}`;
    } catch {
      return cleanPath;
    }
  }

  return cleanPath;
}
