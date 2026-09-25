import NewProductModal from './NewProductModal';
import { Package } from 'lucide-react';

export default function MyProductsList({ products = [], onRefresh }) {
  return (
    <div className="space-y-6">
      <NewProductModal onCreated={onRefresh} />

      {products.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
          <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-700">No products in your catalog yet</p>
          <p className="text-xs text-neutral-500 mt-1">
            Click "List New Football Gear" above to publish your first product.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.product_id}
              className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="aspect-[16/10] rounded-2xl bg-neutral-100 overflow-hidden border border-neutral-100">
                  <img
                    src={
                      p.cover_image ||
                      p.images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wider">
                      {p.category || 'Gear'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.stock > 0
                          ? 'bg-green-50 text-[#16a34a] border border-green-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-neutral-900 mt-1 line-clamp-1">
                    {p.title}
                  </h4>
                  <p className="text-base font-black text-neutral-900 mt-0.5">
                    ৳{Number(p.price).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span className="capitalize">{p.condition || 'New'}</span>
                <span className="font-mono text-[11px]">ID: #{String(p.product_id).slice(0, 6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
