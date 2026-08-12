import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Turfs() {
  const [turfs, setTurfs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/areas').then((res) => setAreas(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get('/turfs', { params: areaId ? { area_id: areaId } : {} })
      .then((res) => setTurfs(res.data))
      .finally(() => setLoading(false));
  }, [areaId]);

  return (
    <div>
      <div className="page-header">
        <h2>Turfs</h2>
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a.area_id} value={a.area_id}>
              {a.name} ({a.city})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading turfs…</p>
      ) : turfs.length === 0 ? (
        <p className="muted">No turfs found.</p>
      ) : (
        <div className="grid">
          {turfs.map((t) => (
            <Link to={`/turfs/${t.turf_id}`} key={t.turf_id} className="card card-link">
              {t.cover_image && <img src={t.cover_image} alt={t.name} className="card-image" />}
              <h3>{t.name}</h3>
              <p className="muted">
                {t.area_name}, {t.city}
              </p>
              <p className="muted">Organized by {t.organizer_name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
