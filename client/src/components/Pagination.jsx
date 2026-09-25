import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { page, total_pages, total, page_size, has_prev, has_next } = pagination;
  const startItem = (page - 1) * page_size + 1;
  const endItem = Math.min(page * page_size, total);

  // Generate page numbers to display (current +/- 2)
  const pages = [];
  const minPage = Math.max(1, page - 2);
  const maxPage = Math.min(total_pages, page + 2);

  for (let i = minPage; i <= maxPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-neutral-100 mt-8">
      <div className="text-xs text-neutral-500 font-medium">
        Showing <strong className="text-neutral-900 font-bold">{startItem}</strong> to{' '}
        <strong className="text-neutral-900 font-bold">{endItem}</strong> of{' '}
        <strong className="text-neutral-900 font-bold">{total}</strong> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!has_prev}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:border-neutral-900 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        {minPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="w-8 h-8 rounded-xl border border-neutral-200 text-xs font-semibold hover:border-neutral-900 transition cursor-pointer"
            >
              1
            </button>
            {minPage > 2 && <span className="px-1 text-xs text-neutral-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
              p === page
                ? 'bg-[#16a34a] text-white shadow-xs'
                : 'border border-neutral-200 text-neutral-700 hover:border-neutral-900'
            }`}
          >
            {p}
          </button>
        ))}

        {maxPage < total_pages && (
          <>
            {maxPage < total_pages - 1 && <span className="px-1 text-xs text-neutral-400">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(total_pages)}
              className="w-8 h-8 rounded-xl border border-neutral-200 text-xs font-semibold hover:border-neutral-900 transition cursor-pointer"
            >
              {total_pages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={!has_next}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:border-neutral-900 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
