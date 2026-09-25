import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MyTurfsList from '../components/organizer/MyTurfsList';
import OrganizerBookings from '../components/organizer/OrganizerBookings';
import { Trophy, Calendar, CheckCircle2 } from 'lucide-react';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('turfs');
  const [loading, setLoading] = useState(true);

  const loadTurfs = useCallback(async () => {
    try {
      const { data: allRes } = await api.get('/turfs', { params: { all: 'true' } });
      const all = Array.isArray(allRes) ? allRes : (allRes?.data || []);
      const mine = all.filter((t) => t.organizer_id === user?.user_id);
      const detailed = await Promise.all(
        mine.map((t) => api.get(`/turfs/${t.turf_id}`).then((r) => r.data).catch(() => t))
      );
      setTurfs(detailed);
    } catch (err) {
      console.error('Failed to load organizer turfs:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/for-my-turfs');
      setBookings(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Failed to load organizer bookings:', err);
    }
  }, []);

  useEffect(() => {
    api
      .get('/areas')
      .then((res) => setAreas(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('Failed to load areas:', err));
    loadTurfs();
  }, [loadTurfs]);

  useEffect(() => {
    if (tab === 'bookings') {
      loadBookings();
    }
  }, [tab, loadBookings]);

  const totalFields = turfs.reduce((acc, t) => acc + (t.fields?.length || 0), 0);

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1.5">
          <Trophy className="w-3.5 h-3.5" />
          <span>Organizer Management Hub</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Host Studio
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500">
          Manage your football arena properties, set pricing schedules, and verify match bookings.
        </p>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">My Arenas</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{turfs.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Pitches</span>
          <p className="text-2xl sm:text-3xl font-black text-[#16a34a] mt-1">{totalFields}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Reservations</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{bookings.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</span>
          <p className="text-sm font-bold text-[#16a34a] mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Verified Host
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-8">
        <button
          type="button"
          onClick={() => setTab('turfs')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'turfs'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          My Venues & Pitches
        </button>
        <button
          type="button"
          onClick={() => setTab('bookings')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'bookings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Incoming Reservations
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'turfs' ? (
        <MyTurfsList turfs={turfs} areas={areas} onRefresh={loadTurfs} />
      ) : (
        <OrganizerBookings bookings={bookings} onRefresh={loadBookings} />
      )}
    </div>
  );
}
