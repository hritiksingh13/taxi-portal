import { useState } from 'react';
import { useDashboardStore, Customer } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  Users2,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Navigation,
} from 'lucide-react';

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium animate-fade-up ${
      type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    }`}>
      {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

export default function CustomerManagement() {
  const { customers, setCustomers } = useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '' });
    setShowForm(false);
    setEditId(null);
    setFeedback(null);
  };

  const startEdit = (c: Customer) => {
    setForm({ name: c.name, email: c.email || '', phone: c.phone });
    setEditId(c.id);
    setShowForm(true);
    setFeedback(null);
  };

  const submit = async () => {
    if (!form.name || !form.phone) {
      setFeedback({ type: 'error', message: 'Name and phone are required.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      if (editId) {
        await api.patch(`/customers/${editId}`, form);
      } else {
        await api.post('/customers', form);
      }
      const res = await api.get('/customers');
      setCustomers(res.data.data.customers);
      resetForm();
      setFeedback({ type: 'success', message: editId ? 'Customer updated.' : 'Customer created.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/customers/${id}`);
      const res = await api.get('/customers');
      setCustomers(res.data.data.customers);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Customer Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your customer database</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card p-6 mb-6 max-w-lg animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-200">{editId ? 'Edit Customer' : 'New Customer'}</p>
            <button onClick={resetForm} className="text-slate-600 hover:text-slate-400"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="input-field" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Priya Singh" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="e.g. priya@example.com" />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input-field" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="e.g. +91 98765 43210" />
            </div>
            {feedback && <Alert type={feedback.type} message={feedback.message} />}
            <button onClick={submit} disabled={loading} className="btn-primary w-full">
              {loading ? 'Saving...' : editId ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback (outside form) */}
      {!showForm && feedback && (
        <div className="mb-4 max-w-lg">
          <Alert type={feedback.type} message={feedback.message} />
        </div>
      )}

      {/* Customer Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-800/40">
              <th className="table-th">Customer</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Email</th>
              <th className="table-th">Trips</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-td text-slate-600 text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users2 size={24} className="text-slate-700" />
                    <p>No customers yet. Add your first customer above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-xs font-bold text-purple-400">{c.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-slate-200">{c.name}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="flex items-center gap-1 text-slate-400"><Phone size={11} /> {c.phone}</span>
                  </td>
                  <td className="table-td">
                    {c.email ? (
                      <span className="flex items-center gap-1 text-slate-400"><Mail size={11} /> {c.email}</span>
                    ) : (
                      <span className="text-slate-600 italic">—</span>
                    )}
                  </td>
                  <td className="table-td">
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                      <Navigation size={10} /> {(c as any)._count?.trips ?? 0}
                    </span>
                  </td>
                  <td className="table-td text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-fleet-400 hover:bg-slate-800 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
