import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .get('/products', { params: q ? { q } : {} })
        .then((res) => setProducts(res.data))
        .finally(() => setLoading(false));
    }, 300); // light debounce
    return () => clearTimeout(timeout);
  }, [q]);

  return (
    <div>
      <div className="page-header">
        <h2>Marketplace</h2>
        <input placeholder="Search gear…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <p>Loading products…</p>
      ) : products.length === 0 ? (
        <p className="muted">No products found.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <Link to={`/marketplace/${p.product_id}`} key={p.product_id} className="card card-link">
              {p.cover_image && <img src={p.cover_image} alt={p.title} className="card-image" />}
              <h3>{p.title}</h3>
              <p className="muted">{p.shop_name}</p>
              <p>৳{p.price}</p>
              {p.avg_rating && <p className="muted">★ {p.avg_rating}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
