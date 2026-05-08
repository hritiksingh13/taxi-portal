import { useState, useEffect } from 'react';
import { api } from '../../core/api.client';
import type { Office } from '../../core/store/useDashboardStore';
import {
  Plus, Edit2, Trash2, Building2, CheckCircle2, AlertCircle,
  MapPin, IndianRupee, Loader2,
} from 'lucide-react';
import { FormInput } from '../../shared/components/ui/Form';

/* ── Alert ──────────────────────────────────────────────────────── */

function Alert({ type, message, onDismiss }: { type: 'success' | 'error'; message: string; onDismiss?: () => void }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium animate-fade-up ${
      type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    }`}>
      {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-xs">✕</button>}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────── */

export default function OfficeRent() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [form, setForm] = useState({ name: '', location: '', monthlyRent: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Auto-dismiss
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  const load = async () => {
    try {
      const res = await api.get('/offices');
      setOffices(res.data.data.offices ?? []);
    } catch { /* silently fail */ }
    setPageLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleEdit = (o: Office) => {
    setEditingId(o.id);
    setForm({ name: o.name, location: o.location, monthlyRent: String(o.monthlyRent) });
    setStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this office? This action cannot be undone.')) return;
    try {
      await api.delete(`/offices/${id}`);
      setStatus({ type: 'success', message: 'Office deleted successfully.' });
      load();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      setStatus({ type: 'error', message: 'Name and location are required.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const payload = { name: form.name, location: form.location, monthlyRent: Number(form.monthlyRent) || 0 };
      if (editingId) {
        await api.patch(`/offices/${editingId}`, payload);
        setStatus({ type: 'success', message: 'Office updated successfully.' });
      } else {
        await api.post('/offices', payload);
        setStatus({ type: 'success', message: 'Office added successfully.' });
      }
      setEditingId(null);
      setForm({ name: '', location: '', monthlyRent: '' });
      load();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', location: '', monthlyRent: '' });
    setStatus(null);
  };

  const totalRent = offices.reduce((s, o) => s + o.monthlyRent, 0);

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Total Rent Summary Card */}
      <div className="card p-5 bg-gradient-to-r from-purple-500/8 via-transparent to-transparent border-purple-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={22} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider">Total Monthly Rent</p>
            <p className="text-2xl font-display font-bold text-purple-300 mt-0.5">₹{totalRent.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full font-semibold">
              {offices.length} office{offices.length !== 1 ? 's' : ''}
            </span>
            <p className="text-xs text-slate-600 mt-1">₹{(totalRent * 12).toLocaleString('en-IN')}/yr</p>
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            {editingId ? <Edit2 size={14} className="text-fleet-400" /> : <Plus size={14} className="text-emerald-400" />}
            {editingId ? 'Edit Office' : 'Add New Office'}
          </p>
          {editingId && (
            <button onClick={cancelEdit} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Cancel editing
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormInput label="Office Name *" value={form.name} onChange={set('name')} placeholder="e.g. Head Office" />
          <FormInput label="Location *" value={form.location} onChange={set('location')} placeholder="e.g. Mumbai" />
          <FormInput label="Monthly Rent (₹)" value={form.monthlyRent} onChange={set('monthlyRent')} placeholder="0" type="number" />
        </div>
        {status && <Alert type={status.type} message={status.message} onDismiss={() => setStatus(null)} />}
        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
            {loading ? <Loader2 size={14} className="animate-spin" /> : editingId ? <Edit2 size={14} /> : <Plus size={14} />}
            {loading ? 'Saving...' : editingId ? 'Update Office' : 'Add Office'}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="btn-secondary text-sm">Cancel</button>
          )}
        </div>
      </div>

      {/* Office List */}
      {pageLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
          <Loader2 size={14} className="animate-spin" /> Loading offices...
        </div>
      ) : offices.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium mb-1">No Offices Added</p>
          <p className="text-slate-600 text-sm">Add your first business office above to track rent expenses.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {offices.map(o => (
            <div
              key={o.id}
              className="card p-4 flex items-center justify-between hover:border-slate-700/80 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/40 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-800/80 transition-colors">
                  <Building2 size={16} className="text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{o.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {o.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-200 flex items-center gap-0.5 justify-end">
                    <IndianRupee size={12} className="text-slate-400" />
                    {o.monthlyRent.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-600">per month</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(o)}
                    className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-all"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
