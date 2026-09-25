import NewTurfModal from './NewTurfModal';
import FieldManager from './FieldManager';
import { Trophy } from 'lucide-react';

export default function MyTurfsList({ turfs = [], areas = [], onRefresh }) {
  return (
    <div className="space-y-6">
      <NewTurfModal areas={areas} onCreated={onRefresh} />

      {turfs.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
          <Trophy className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-700">No turf arenas registered yet</p>
          <p className="text-xs text-neutral-500 mt-1">
            Click "Add New Turf Arena" above to list your first venue.
          </p>
        </div>
      ) : (
        turfs.map((t) => <FieldManager key={t.turf_id} turf={t} onChanged={onRefresh} />)
      )}
    </div>
  );
}
