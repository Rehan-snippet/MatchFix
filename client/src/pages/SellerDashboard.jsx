import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function NewProductForm({ onCreated }) {
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    condition: 'new',
    stock: 1,
  });
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data: product } = await api.post('/products', form);
      if (imageUrl) {
        await api.post(`/products/${product.product_id}/images`, { url: imageUrl, is_cover: true });
      }
      setForm({ title: '', category: '', description: '', price: '', condition: 'new', stock: 1 });
      setImageUrl('');
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create product');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form form-inline">
      <h4>New product</h4>
      <input
        placeholder="Title"
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <input
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <input
        placeholder="Price"
        type="number"
        required
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
      />
      <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
        <option value="new">New</option>
        <option value="used">Used</option>
      </select>
      <input
        placeholder="Stock"
        type="number"
        min={0}
        value={form.stock}
        onChange={(e) => setForm({ ...form, stock: e.target.value })}
      />
      <input
        placeholder="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <input
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? 'Creating…' : 'Add product'}
      </button>
    </form>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');

  function loadProducts() {
    api.get('/products', { params: { seller_id: user.user_id } }).then((res) => setProducts(res.data));
  }

  useEffect(loadProducts, [user.user_id]);

  useEffect(() => {
    if (tab === 'orders') {
      api.get('/orders/for-my-products').then((res) => setOrders(res.data));
    }
  }, [tab]);

  async function updateStatus(orderId, productId, status) {
    await api.patch(`/orders/${orderId}/items/${productId}/status`, { status });
    const { data } = await api.get('/orders/for-my-products');
    setOrders(data);
  }

  return (
    <div>
      <h2>Seller Dashboard</h2>
      <div className="tabs">
        <button className={tab === 'products' ? 'tab active' : 'tab'} onClick={() => setTab('products')}>
          My Products
        </button>
        <button className={tab === 'orders' ? 'tab active' : 'tab'} onClick={() => setTab('orders')}>
          Orders
        </button>
      </div>

      {tab === 'products' && (
        <>
          <NewProductForm onCreated={loadProducts} />
          <div className="grid">
            {products.map((p) => (
              <div key={p.product_id} className="card">
                {p.cover_image && <img src={p.cover_image} alt={p.title} className="card-image" />}
                <h4>{p.title}</h4>
                <p className="muted">
                  ৳{p.price} · {p.stock} in stock
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="list">
          {orders.length === 0 ? (
            <p className="muted">No orders for your products yet.</p>
          ) : (
            orders.map((o) => (
              <div key={`${o.order_id}-${o.product_id}`} className="card card-row">
                <span>
                  {o.title} × {o.qty} — {o.customer_name} — ৳{o.unit_price * o.qty}
                </span>
                <select value={o.status} onChange={(e) => updateStatus(o.order_id, o.product_id, e.target.value)}>
                  <option value="placed">placed</option>
                  <option value="confirmed">confirmed</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
