import { useState } from 'react';
import { Star, X } from 'lucide-react';

export default function ReviewModal({
  isOpen,
  title = 'Write a Review',
  subtitle = 'Share your experience to help the MatchFix community.',
  commentPlaceholder = 'Write your thoughts here...',
  initialRating = 5,
  initialComment = '',
  onSubmit,
  onClose,
}) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSubmit({ rating, comment });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  }

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 cursor-pointer transition hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= activeRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-neutral-800">
                {activeRating} of 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Comments & Details
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={commentPlaceholder}
              className="w-full p-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
