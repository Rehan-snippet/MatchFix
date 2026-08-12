import { useEffect, useState } from 'react';
import api from '../api/client';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);

  function load() {
    setLoading(true);
    api
      .get('/orders/mine')
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleReview(orderId, productId) {
    const rating = Number(prompt('Rate this product 1-5'));
    if (!rating) return;
    const comment = prompt('Leave a comment (optional)') || '';
    const key = `${orderId}-${productId}`;
    setBusyKey(key);
    try {
      await api.post(`/orders/${orderId}/items/${productId}/review`, { rating, comment });
      alert('Thanks for the review!');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not submit review');
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p className="muted">No orders yet — go shop the marketplace!</p>
      ) : (
        <div className="list">
          {orders.map((o) => (
            <div key={o.order_id} className="card">
              <div className="card-row">
                <strong>Order #{o.order_id}</strong>
                <span>৳{o.total}</span>
              </div>
              <p className="muted">Deliver to: {o.delivery_address}</p>
              <ul>
                {o.items.map((item) => (
                  <li key={item.product_id} className="card-row">
                    <span>
                      {item.title} × {item.qty} — ৳{item.unit_price} each
                    </span>
                    <span className="badge">{item.status}</span>
                    {item.status === 'delivered' && (
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={busyKey === `${o.order_id}-${item.product_id}`}
                        onClick={() => handleReview(o.order_id, item.product_id)}
                      >
                        Rate
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
