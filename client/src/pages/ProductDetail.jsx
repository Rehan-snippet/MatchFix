import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res.data);
    });
  }

  useEffect(load, [id]);

  useEffect(() => {
    if (user?.customer?.default_address) setAddress(user.customer.default_address);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  async function handleBuy() {
    setMessage('');
    if (!user) return setMessage('Please log in first.');
    if (!user.roles?.includes('customer')) return setMessage('Add the Customer role from your profile first.');
    if (!address) return setMessage('Delivery address is required.');

    setBusy(true);
    try {
      const { data: order } = await api.post('/orders', {
        items: [{ product_id: product.product_id, qty }],
        delivery_address: address,
        delivery_phone: phone,
      });
      await api.post('/payments', {
        order_id: order.order_id,
        amount: order.total,
        purpose: 'full',
        method: 'card',
      });
      setMessage('Order placed and paid! Check "My Orders" for status.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Order failed');
    } finally {
      setBusy(false);
    }
  }

  if (!product) return <p>Loading…</p>;

  return (
    <div>
      {product.images?.[0] && <img src={product.images[0].url} alt={product.title} className="detail-image" />}
      <h2>{product.title}</h2>
      <p className="muted">
        {product.category} · Sold by {product.shop_name} · {product.condition}
      </p>
      <p>{product.description}</p>
      <p className="price">৳{product.price}</p>
      <p className="muted">{product.stock} in stock</p>

      <div className="buy-box">
        <label>
          Qty
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
        <label>
          Delivery address
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Where to deliver?" />
        </label>
        <label>
          Delivery phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <button className="btn btn-primary" disabled={busy || product.stock === 0} onClick={handleBuy}>
          {busy ? 'Placing order…' : product.stock === 0 ? 'Out of stock' : 'Buy now'}
        </button>
        {message && <p className="form-note">{message}</p>}
      </div>

      <h3>Reviews</h3>
      {product.reviews?.length ? (
        <ul className="list">
          {product.reviews.map((r) => (
            <li key={r.review_id} className="card">
              <strong>{r.reviewer_name}</strong> — ★ {r.rating}
              <p className="muted">{r.comment}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No reviews yet.</p>
      )}
    </div>
  );
}
