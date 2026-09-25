import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { MapPin, Calendar, Clock, DollarSign, Layers } from 'lucide-react';

export default function FieldManager({ turf, onChanged }) {
  const toast = useToast();
  const [fieldForm, setFieldForm] = useState({ name: '', side_type: '5v5', surface: 'Artificial Turf' });
  const [ruleForm, setRuleForm] = useState({});
  const [genForm, setGenForm] = useState({});
  const [busyRule, setBusyRule] = useState(false);
  const [busyGen, setBusyGen] = useState(false);
  const [busyField, setBusyField] = useState(false);

  async function addField(e) {
    e.preventDefault();
    setBusyField(true);
    try {
      await api.post('/fields', { turf_id: turf.turf_id, ...fieldForm });
      toast.success(`Pitch "${fieldForm.name}" added successfully!`);
      setFieldForm({ name: '', side_type: '5v5', surface: 'Artificial Turf' });
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add pitch.');
    } finally {
      setBusyField(false);
    }
  }

  async function addRule(fieldId, e) {
    e.preventDefault();
    setBusyRule(true);
    try {
      const f = ruleForm[fieldId] || {};
      await api.post(`/fields/${fieldId}/pricing-rules`, {
        day_of_week: Number(f.day_of_week ?? 6),
        start_time: f.start_time || '16:00',
        end_time: f.end_time || '22:00',
        hourly_rate: Number(f.hourly_rate || 1800),
      });
      toast.success('Custom pricing rule saved!');
      setRuleForm({ ...ruleForm, [fieldId]: {} });
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save pricing rule.');
    } finally {
      setBusyRule(false);
    }
  }

  async function generate(fieldId, e) {
    e.preventDefault();
    setBusyGen(true);
    try {
      const g = genForm[fieldId] || {};
      await api.post('/slots/generate', {
        field_id: fieldId,
        start_date: g.start_date,
        end_date: g.end_date,
      });
      toast.success('Hourly match slots generated successfully!');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not generate match slots.');
    } finally {
      setBusyGen(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-xl font-black text-neutral-900">{turf.name}</h3>
          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span>{turf.address}</span>
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold self-start sm:self-auto">
          {turf.fields?.length || 0} {turf.fields?.length === 1 ? 'Pitch' : 'Pitches'}
        </span>
      </div>

      {/* Fields List */}
      <div className="space-y-5">
        {turf.fields?.map((f) => (
          <div
            key={f.field_id}
            className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-neutral-900">{f.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-green-50 text-[#16a34a] border border-green-200 text-[11px] font-bold">
                  {f.side_type}
                </span>
                <span className="text-xs text-neutral-500 font-medium">({f.surface})</span>
              </div>
            </div>

            {/* Set Pricing Rule Form */}
            <form
              onSubmit={(e) => addRule(f.field_id, e)}
              className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2"
            >
              <span className="text-[11px] font-bold text-neutral-800">
                Peak / Weekend Pricing Rule
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <select
                  value={ruleForm[f.field_id]?.day_of_week ?? 5}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], day_of_week: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
                <input
                  type="time"
                  value={ruleForm[f.field_id]?.start_time ?? '16:00'}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], start_time: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <input
                  type="time"
                  value={ruleForm[f.field_id]?.end_time ?? '22:00'}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], end_time: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <input
                  type="number"
                  placeholder="Rate (৳)"
                  value={ruleForm[f.field_id]?.hourly_rate ?? ''}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], hourly_rate: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <button
                  type="submit"
                  disabled={busyRule}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
                >
                  Save Rate
                </button>
              </div>
            </form>

            {/* Generate Slots Form */}
            <form
              onSubmit={(e) => generate(f.field_id, e)}
              className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2"
            >
              <span className="text-[11px] font-bold text-neutral-800">Generate Bookable Slots</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="date"
                  required
                  placeholder="Start Date"
                  onChange={(e) =>
                    setGenForm({
                      ...genForm,
                      [f.field_id]: { ...genForm[f.field_id], start_date: e.target.value },
                    })
                  }
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <input
                  type="date"
                  required
                  placeholder="End Date"
                  onChange={(e) =>
                    setGenForm({
                      ...genForm,
                      [f.field_id]: { ...genForm[f.field_id], end_date: e.target.value },
                    })
                  }
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <button
                  type="submit"
                  disabled={busyGen}
                  className="px-4 py-1.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition cursor-pointer"
                >
                  {busyGen ? 'Generating…' : 'Generate Slots'}
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>

      {/* Add Field Form */}
      <form
        onSubmit={addField}
        className="p-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 flex flex-col sm:flex-row items-center gap-3"
      >
        <input
          placeholder="New Pitch Name (e.g. Pitch 1)"
          required
          value={fieldForm.name}
          onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
          className="flex-1 w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white"
        />
        <select
          value={fieldForm.side_type}
          onChange={(e) => setFieldForm({ ...fieldForm, side_type: e.target.value })}
          className="w-full sm:w-28 px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white font-semibold"
        >
          <option value="5v5">5v5</option>
          <option value="7v7">7v7</option>
          <option value="11v11">11v11</option>
        </select>
        <input
          placeholder="Surface (e.g. 3G Artificial)"
          value={fieldForm.surface}
          onChange={(e) => setFieldForm({ ...fieldForm, surface: e.target.value })}
          className="w-full sm:w-40 px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white"
        />
        <button
          type="submit"
          disabled={busyField}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
        >
          {busyField ? 'Adding…' : '+ Add Pitch'}
        </button>
      </form>
    </div>
  );
}
