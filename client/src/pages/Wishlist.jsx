import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingBag } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/users/me/wishlist')
        .then(res => setItems(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  function handleRemove(productId) {
    api.delete(`/users/me/wishlist/${productId}`)
      .then(() => {
        setItems(prev => prev.filter(i => i.product_id !== productId));
      })
      .catch(console.error);
  }

  if (loading) return <div className="p-8 text-center">Loading wishlist...</div>;

  if (!user) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold">Please log in to view your wishlist</h2>
        <Link to="/login" className="text-[#16a34a] underline mt-2 inline-block">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-[#16a34a]" />
        My Wishlist
      </h1>
      
      {items.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-200">
          <p className="text-neutral-500 font-medium">Your wishlist is empty.</p>
          <Link to="/marketplace" className="mt-4 inline-block px-6 py-2 bg-neutral-900 text-white rounded-full font-bold text-sm">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="flex items-center gap-4 p-4 border border-neutral-200 rounded-2xl bg-white shadow-sm">
              <Link to={`/marketplace/${item.product_id}`} className="flex-shrink-0">
                <img 
                  src={getImageUrl(item.cover_image, 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=200')} 
                  className="w-20 h-20 object-cover rounded-xl border border-neutral-100" 
                  alt={item.title} 
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/marketplace/${item.product_id}`} className="font-bold text-neutral-900 text-lg hover:text-[#16a34a] transition truncate block">
                  {item.title}
                </Link>
                <div className="text-[#16a34a] font-extrabold mt-1">৳{Number(item.price).toLocaleString()}</div>
                <div className="text-xs text-neutral-500 mt-1">Added {new Date(item.added_at).toLocaleDateString()}</div>
              </div>
              <button 
                onClick={() => handleRemove(item.product_id)}
                className="p-3 text-rose-500 hover:bg-rose-50 rounded-full transition"
                title="Remove from wishlist"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
