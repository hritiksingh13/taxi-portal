import React, { useState, useEffect } from 'react';
import { useDashboardStore, Car, MaintenanceRecord } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  Car as CarIcon,
  Wrench,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  ArrowRightLeft,
  History,
  DollarSign,
  AlertTriangle,
  Navigation,
  CalendarClock,
} from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium animate-fade-up ${
        type === 'success'
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

/* ── Overlay / Dialog Shell ───────────────────────────────────────── */

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800/60 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-up shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <h3 className="font-display font-bold text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Move to Maintenance Dialog ───────────────────────────────────── */

function MoveToMaintenanceDialog({ car, open, onClose, onSuccess }: { car: Car | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ cost: '', details: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (open) { setForm({ cost: '', details: '', endDate: '' }); setError(''); }
  }, [open]);

  const submit = async () => {
    if (!form.details.trim()) { setError('Maintenance details are required.'); return; }
    if (!form.endDate) { setError('Expected end date is required.'); return; }
    setLoading(true); setError('');
    try {
      await api.patch(`/cars/${car!.id}/maintenance`, {
        cost: Number(form.cost) || 0,
        details: form.details,
        startDate: new Date().toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Send to Maintenance">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Moving <span className="text-slate-200 font-semibold">{car?.brand} · {car?.licensePlate}</span> to maintenance.
        </p>
        <div>
          <label className="label">Cost (₹)</label>
          <input type="number" className="input-field" placeholder="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </div>
        <div>
          <label className="label">Maintenance Details *</label>
          <textarea className="input-field min-h-[80px]" placeholder="Describe the maintenance work..." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input-field" value={today} disabled />
          </div>
          <div>
            <label className="label">Expected End Date *</label>
            <input type="date" className="input-field" value={form.endDate} min={today} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        {error && <Alert type="error" message={error} />}
        <button onClick={submit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <Wrench size={15} />
          {loading ? 'Processing...' : 'Confirm Move to Maintenance'}
        </button>
      </div>
    </Dialog>
  );
}

/* ── Move to Active Dialog ────────────────────────────────────────── */

function MoveToActiveDialog({ car, open, onClose, onSuccess }: { car: Car | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [nextDue, setNextDue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setNextDue(''); setError(''); } }, [open]);

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await api.patch(`/cars/${car!.id}/activate`, {
        nextMaintenanceDue: nextDue ? new Date(nextDue).toISOString() : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Mark Vehicle Active">
      <div className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-sm text-amber-300">
            This will close the current maintenance record for <span className="font-semibold">{car?.brand} · {car?.licensePlate}</span> and set the end date to today.
          </p>
        </div>
        <div>
          <label className="label">Next Maintenance Due Date (Optional)</label>
          <input type="date" className="input-field" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
        </div>
        {error && <Alert type="error" message={error} />}
        <button onClick={submit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <CheckCircle2 size={15} />
          {loading ? 'Processing...' : 'Confirm Mark Active'}
        </button>
      </div>
    </Dialog>
  );
}

/* ── Maintenance History Dialog ───────────────────────────────────── */

function MaintenanceHistoryDialog({ car, open, onClose }: { car: Car | null; open: boolean; onClose: () => void }) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && car) {
      setLoading(true);
      api.get(`/cars/${car.id}/maintenance-history`).then((res) => {
        setRecords(res.data.data.records);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [open, car]);

  return (
    <Dialog open={open} onClose={onClose} title={`Maintenance History — ${car?.brand}`}>
      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Loading history...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">No past maintenance records found.</div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div key={rec.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-emerald-400" /> ₹{rec.cost.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500">{formatDate(rec.startDate)} → {formatDate(rec.endDate)}</span>
              </div>
              <p className="text-sm text-slate-400">{rec.details}</p>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}

/* ── Delete Vehicle Dialog ────────────────────────────────────────── */

function DeleteVehicleDialog({ car, open, onClose, onSuccess }: { car: Car | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isOnTrip = car?.isOnTrip;

  useEffect(() => { if (open) setError(''); }, [open]);

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await api.delete(`/cars/${car!.id}`);
      onSuccess();
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Delete Vehicle">
      <div className="space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex gap-3">
          <AlertTriangle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-rose-300">
            <p className="font-semibold mb-1">Warning: This action cannot be undone.</p>
            <p>Deleting <span className="font-semibold">{car?.brand} · {car?.licensePlate}</span> will permanently remove all related maintenance records and trip associations.</p>
          </div>
        </div>
        {isOnTrip && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-300">
            This vehicle is currently on an active trip and cannot be deleted. End or cancel the trip first.
          </div>
        )}
        {error && <Alert type="error" message={error} />}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={loading || isOnTrip} className="btn-danger flex-1 flex items-center justify-center gap-2">
            <Trash2 size={15} />
            {loading ? 'Deleting...' : 'Delete Vehicle'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ── Vehicle Card ─────────────────────────────────────────────────── */

function VehicleCard({
  car,
  onMoveToMaintenance,
  onMoveToActive,
  onViewHistory,
  onDelete,
  onEditDueDate,
}: {
  car: Car;
  onMoveToMaintenance: (car: Car) => void;
  onMoveToActive: (car: Car) => void;
  onViewHistory: (car: Car) => void;
  onDelete: (car: Car) => void;
  onEditDueDate: (car: Car) => void;
}) {
  const isMaintenance = car.status === 'Maintenance';
  const record = car.activeMaintenanceRecord;

  return (
    <div className={`card p-4 sm:p-5 hover:border-slate-700/80 transition-colors duration-200 ${isMaintenance ? 'border-l-2 border-l-amber-500/60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isMaintenance ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-fleet-500/15 border border-fleet-500/20'}`}>
            {isMaintenance ? <Wrench size={18} className="text-amber-400" /> : <CarIcon size={18} className="text-fleet-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{car.brand}</p>
            <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{car.licensePlate}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={isMaintenance ? 'badge-maintenance' : 'badge-active'}>
            {isMaintenance ? <Wrench size={10} /> : <CheckCircle2 size={10} />}
            {isMaintenance ? 'Maintenance' : 'Active'}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
        <div>
          <p className="text-slate-500 mb-0.5">Transmission</p>
          <p className="text-slate-300 font-medium">{car.transmissionType}</p>
        </div>
        {!isMaintenance && (
          <div>
            <p className="text-slate-500 mb-0.5">Trip Status</p>
            <p className={`font-medium ${car.isOnTrip ? 'text-amber-400' : 'text-emerald-400'}`}>
              {car.isOnTrip ? (
                <span className="flex items-center gap-1"><Navigation size={10} /> On Trip</span>
              ) : 'Available'}
            </p>
          </div>
        )}
        <div>
          <p className="text-slate-500 mb-0.5">Last Maintenance</p>
          <p className="text-slate-300 font-medium">{car.lastMaintenanceDate ? formatDate(car.lastMaintenanceDate) : 'Never'}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Next Due</p>
          <p className="text-slate-300 font-medium">{car.nextMaintenanceDue ? formatDate(car.nextMaintenanceDue) : 'Not set'}</p>
        </div>
      </div>

      {/* Maintenance-specific details */}
      {isMaintenance && record && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 mb-4 space-y-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Current Maintenance</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-500">Cost</p>
              <p className="text-slate-200 font-semibold">₹{record.cost.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-slate-500">Start Date</p>
              <p className="text-slate-300">{formatDate(record.startDate)}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Details</p>
            <p className="text-slate-300 text-xs">{record.details}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
        {isMaintenance ? (
          <button onClick={() => onMoveToActive(car)} className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all">
            <ArrowRightLeft size={12} /> Mark Active
          </button>
        ) : (
          <>
            <button onClick={() => onMoveToMaintenance(car)} className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all">
              <Wrench size={12} /> Send to Maintenance
            </button>
            <button onClick={() => onEditDueDate(car)} className="flex items-center gap-1.5 text-xs font-medium text-fleet-400 hover:text-fleet-300 bg-fleet-500/10 hover:bg-fleet-500/15 border border-fleet-500/20 px-3 py-1.5 rounded-lg transition-all">
              <CalendarClock size={12} /> {car.nextMaintenanceDue ? 'Edit Due Date' : 'Set Due Date'}
            </button>
          </>
        )}
        <button onClick={() => onViewHistory(car)} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 px-3 py-1.5 rounded-lg transition-all">
          <History size={12} /> Past History
        </button>
        <button onClick={() => onDelete(car)} className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all ml-auto">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

/* ── Edit Due Date Dialog ─────────────────────────────────────────── */

function EditDueDateDialog({ car, open, onClose, onSuccess }: { car: Car | null; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && car) {
      setDueDate(car.nextMaintenanceDue ? new Date(car.nextMaintenanceDue).toISOString().split('T')[0] : '');
      setError('');
    }
  }, [open, car]);

  const submit = async () => {
    if (!dueDate) { setError('Please select a due date.'); return; }
    setLoading(true); setError('');
    try {
      await api.patch(`/cars/${car!.id}`, {
        nextMaintenanceDue: new Date(dueDate).toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const clearDate = async () => {
    setLoading(true); setError('');
    try {
      await api.patch(`/cars/${car!.id}`, { nextMaintenanceDue: null });
      onSuccess();
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title={car?.nextMaintenanceDue ? 'Edit Maintenance Due Date' : 'Set Maintenance Due Date'}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Schedule the next maintenance for <span className="text-slate-200 font-semibold">{car?.brand} · {car?.licensePlate}</span>
        </p>
        <div>
          <label className="label">Next Maintenance Due Date *</label>
          <input type="date" className="input-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        {error && <Alert type="error" message={error} />}
        <div className="flex gap-2">
          {car?.nextMaintenanceDue && (
            <button onClick={clearDate} disabled={loading} className="btn-secondary flex items-center justify-center gap-2 text-sm">
              <X size={14} /> Clear Date
            </button>
          )}
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <CalendarClock size={15} />
            {loading ? 'Saving...' : 'Save Due Date'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */

export default function VehicleManagement() {
  const { cars, setCars } = useDashboardStore();
  const [view, setView] = useState<'active' | 'maintenance'>('active');

  // Dialog state
  const [maintDialog, setMaintDialog] = useState<Car | null>(null);
  const [activeDialog, setActiveDialog] = useState<Car | null>(null);
  const [historyDialog, setHistoryDialog] = useState<Car | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Car | null>(null);
  const [dueDateDialog, setDueDateDialog] = useState<Car | null>(null);

  const refreshCars = async () => {
    try {
      const res = await api.get('/cars');
      setCars(res.data.data.cars);
    } catch {}
  };

  const onActionSuccess = () => {
    refreshCars();
    // Also refresh dashboard stats
    api.get('/dashboard/stats').then((res) => {
      useDashboardStore.getState().setStats(res.data.data);
    }).catch(() => {});
  };

  const activeCars = cars.filter((c) => c.status === 'Active');
  const maintenanceCars = cars.filter((c) => c.status === 'Maintenance');
  const displayCars = view === 'active' ? activeCars : maintenanceCars;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Vehicle Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor fleet status, manage maintenance lifecycle, and track vehicle availability
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">{cars.length} total</span>
          <span className="text-slate-700">·</span>
          <span className="text-emerald-400">{activeCars.length} active</span>
          <span className="text-slate-700">·</span>
          <span className="text-amber-400">{maintenanceCars.length} maintenance</span>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            view === 'active'
              ? 'bg-fleet-500/15 border-fleet-500/30 text-fleet-300'
              : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          <CheckCircle2 size={15} /> Active Vehicles
          <span className="ml-1 bg-fleet-500/20 text-fleet-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeCars.length}</span>
        </button>
        <button
          onClick={() => setView('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            view === 'maintenance'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          <Wrench size={15} /> Under Maintenance
          <span className="ml-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{maintenanceCars.length}</span>
        </button>
      </div>

      {/* Vehicle Grid */}
      {displayCars.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            {view === 'active' ? <CarIcon size={24} className="text-slate-600" /> : <Wrench size={24} className="text-slate-600" />}
          </div>
          <p className="text-slate-400 font-medium mb-1">No {view === 'active' ? 'active' : 'maintenance'} vehicles</p>
          <p className="text-slate-600 text-sm">
            {view === 'active' ? 'All vehicles may be under maintenance.' : 'No vehicles are currently under maintenance.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayCars.map((car) => (
            <VehicleCard
              key={car.id}
              car={car}
              onMoveToMaintenance={setMaintDialog}
              onMoveToActive={setActiveDialog}
              onViewHistory={setHistoryDialog}
              onDelete={setDeleteDialog}
              onEditDueDate={setDueDateDialog}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <MoveToMaintenanceDialog car={maintDialog} open={!!maintDialog} onClose={() => setMaintDialog(null)} onSuccess={onActionSuccess} />
      <MoveToActiveDialog car={activeDialog} open={!!activeDialog} onClose={() => setActiveDialog(null)} onSuccess={onActionSuccess} />
      <MaintenanceHistoryDialog car={historyDialog} open={!!historyDialog} onClose={() => setHistoryDialog(null)} />
      <DeleteVehicleDialog car={deleteDialog} open={!!deleteDialog} onClose={() => setDeleteDialog(null)} onSuccess={onActionSuccess} />
      <EditDueDateDialog car={dueDateDialog} open={!!dueDateDialog} onClose={() => setDueDateDialog(null)} onSuccess={onActionSuccess} />
    </div>
  );
}
