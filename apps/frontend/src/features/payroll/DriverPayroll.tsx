import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDashboardStore } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  Plus, Trash2, FileText, Calendar, DollarSign,
  CheckCircle2, AlertCircle, Receipt, Loader2, TrendingDown,
  Banknote, CalendarDays, CreditCard, Sparkles,
} from 'lucide-react';
import { FormInput, FormSelect } from '../../shared/components/ui/Form';
import SalaryHistoryDialog from './SalaryHistoryDialog';

/* ── Types ──────────────────────────────────────────────────────── */

interface Leave { id: string; date: string; reason?: string | null }
interface Advance { id: string; amount: number; date: string; note?: string | null; deductFromSalary: boolean }
interface SalaryConfig { id: string; baseSalary: number }
interface SalarySlip { id: string; month: number; year: number; baseSalary: number; totalLeaves: number; leaveDeduction: number; totalAdvances: number; netSalary: number; generatedAt: string }

/* ── Alert ──────────────────────────────────────────────────────── */

function Alert({ type, msg, onDismiss }: { type: 'success' | 'error'; msg: string; onDismiss?: () => void }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium animate-fade-up ${
      type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    }`}>
      {type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      <span className="flex-1">{msg}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 text-xs">✕</button>
      )}
    </div>
  );
}

/* ── Constants ──────────────────────────────────────────────────── */

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const now = new Date();

/* ── Component ──────────────────────────────────────────────────── */

export default function DriverPayroll() {
  const { drivers } = useDashboardStore();
  const [driverId, setDriverId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Data
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [config, setConfig] = useState<SalaryConfig | null>(null);
  const [slips, setSlips] = useState<SalarySlip[]>([]);

  // Form inputs
  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');
  const [newAdvAmt, setNewAdvAmt] = useState('');
  const [newAdvNote, setNewAdvNote] = useState('');
  const [newAdvDeduct, setNewAdvDeduct] = useState(true);
  const [baseSalaryInput, setBaseSalaryInput] = useState('');

  // UI state
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const driver = drivers.find(d => d.id === driverId);

  // Auto-dismiss status after 4s
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // Load data when driver/month/year changes
  const loadData = useCallback(async () => {
    if (!driverId) return;
    setDataLoading(true);
    try {
      const [lRes, aRes, cRes] = await Promise.all([
        api.get(`/payroll/drivers/${driverId}/leaves?month=${month}&year=${year}`),
        api.get(`/payroll/drivers/${driverId}/advances?month=${month}&year=${year}`),
        api.get(`/payroll/drivers/${driverId}/salary-config`),
      ]);
      setLeaves(lRes.data.data.leaves ?? []);
      setAdvances(aRes.data.data.advances ?? []);
      const cfg = cRes.data.data.config ?? null;
      setConfig(cfg);
      setBaseSalaryInput(cfg ? String(cfg.baseSalary) : '');
    } catch { /* silently fail */ }
    setDataLoading(false);
  }, [driverId, month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  // Salary estimate (computed client-side)
  const estimate = useMemo(() => {
    const base = config?.baseSalary || 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    const totalLeaves = leaves.length;
    const leaveDed = totalLeaves > 0 ? (base / daysInMonth) * totalLeaves : 0;
    const advDed = advances.filter(a => a.deductFromSalary).reduce((s, a) => s + a.amount, 0);
    const net = Math.max(0, base - leaveDed - advDed);
    return {
      base, daysInMonth, totalLeaves,
      leaveDed: Math.round(leaveDed),
      advDed: Math.round(advDed),
      net: Math.round(net),
    };
  }, [config, leaves, advances, month, year]);

  /* ── CRUD Handlers ──────────────────────────────────────── */

  const addLeave = async () => {
    if (!newLeaveDate) return;
    try {
      await api.post(`/payroll/drivers/${driverId}/leaves`, { date: newLeaveDate, reason: newLeaveReason || undefined });
      const res = await api.get(`/payroll/drivers/${driverId}/leaves?month=${month}&year=${year}`);
      setLeaves(res.data.data.leaves ?? []);
      setNewLeaveDate(''); setNewLeaveReason('');
      setStatus({ type: 'success', msg: 'Leave recorded successfully.' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  };

  const deleteLeave = async (id: string) => {
    try {
      await api.delete(`/payroll/drivers/${driverId}/leaves/${id}`);
      setLeaves(l => l.filter(x => x.id !== id));
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  };

  const addAdvance = async () => {
    if (!newAdvAmt) return;
    try {
      await api.post(`/payroll/drivers/${driverId}/advances`, {
        amount: Number(newAdvAmt), note: newAdvNote || undefined, deductFromSalary: newAdvDeduct,
      });
      const res = await api.get(`/payroll/drivers/${driverId}/advances?month=${month}&year=${year}`);
      setAdvances(res.data.data.advances ?? []);
      setNewAdvAmt(''); setNewAdvNote(''); setNewAdvDeduct(true);
      setStatus({ type: 'success', msg: 'Advance recorded successfully.' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  };

  const deleteAdvance = async (id: string) => {
    try {
      await api.delete(`/payroll/drivers/${driverId}/advances/${id}`);
      setAdvances(a => a.filter(x => x.id !== id));
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  };

  const updateConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await api.put(`/payroll/drivers/${driverId}/salary-config`, { baseSalary: Number(baseSalaryInput) || 0 });
      setConfig(res.data.data.config ?? null);
      setStatus({ type: 'success', msg: 'Salary config updated.' });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
    setSavingConfig(false);
  };

  const generateSlip = async () => {
    setGenerating(true);
    try {
      await api.post(`/payroll/drivers/${driverId}/salary/generate`, { month, year });
      setStatus({ type: 'success', msg: `Salary slip for ${MONTHS[month - 1]} ${year} generated!` });
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
    setGenerating(false);
  };

  const openHistory = async () => {
    try {
      const res = await api.get(`/payroll/drivers/${driverId}/salary-slips`);
      setSlips(res.data.data.slips ?? []);
      setShowHistory(true);
    } catch (e: any) { setStatus({ type: 'error', msg: e.message }); }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Driver + Period Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormSelect
          label="Select Driver"
          value={driverId}
          onChange={e => { setDriverId(e.target.value); setStatus(null); }}
          placeholder="Choose driver..."
          options={drivers.map(d => ({ value: d.id, label: `${d.name} · ${d.phoneNumber}` }))}
        />
        <FormSelect
          label="Month"
          value={String(month)}
          onChange={e => setMonth(Number(e.target.value))}
          options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
        />
        <FormSelect
          label="Year"
          value={String(year)}
          onChange={e => setYear(Number(e.target.value))}
          options={years.map(y => ({ value: String(y), label: String(y) }))}
        />
      </div>

      {/* Empty State */}
      {!driverId && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <DollarSign size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium mb-1">Select a Driver</p>
          <p className="text-slate-600 text-sm">Choose a driver to manage their payroll, leaves, and advances.</p>
        </div>
      )}

      {driverId && (
        <>
          {/* Loading Indicator */}
          {dataLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Loading payroll data...
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4 group hover:border-slate-700/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-fleet-500/10 flex items-center justify-center">
                  <Banknote size={14} className="text-fleet-400" />
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Base Salary</p>
              </div>
              <p className="text-xl font-display font-bold text-slate-100">₹{estimate.base.toLocaleString('en-IN')}</p>
            </div>
            <div className="card p-4 group hover:border-slate-700/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CalendarDays size={14} className="text-amber-400" />
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Leaves</p>
              </div>
              <p className="text-xl font-display font-bold text-amber-400">{estimate.totalLeaves} <span className="text-sm font-normal text-slate-500">days</span></p>
            </div>
            <div className="card p-4 group hover:border-slate-700/80 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <CreditCard size={14} className="text-rose-400" />
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Advances</p>
              </div>
              <p className="text-xl font-display font-bold text-rose-400">₹{estimate.advDed.toLocaleString('en-IN')}</p>
            </div>
            <div className="card p-4 border-fleet-500/30 bg-gradient-to-br from-fleet-500/5 to-transparent hover:border-fleet-500/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-fleet-500/15 flex items-center justify-center">
                  <Sparkles size={14} className="text-fleet-400" />
                </div>
                <p className="text-[10px] text-fleet-400 uppercase font-semibold">Est. Net Salary</p>
              </div>
              <p className="text-xl font-display font-bold text-fleet-300">₹{estimate.net.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Salary Estimate Breakdown */}
          <div className="card p-4 bg-gradient-to-r from-fleet-500/5 via-transparent to-transparent border-fleet-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={15} className="text-fleet-400" />
              <p className="text-sm font-semibold text-slate-200">Month-End Salary Estimate</p>
              <span className="text-[10px] text-slate-600 ml-auto">{MONTHS[month - 1]} {year} · {estimate.daysInMonth} days</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 text-xs">
              <div>
                <span className="text-slate-500">Base: </span>
                <span className="text-slate-200 font-medium">₹{estimate.base.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-500">Leave Ded.: </span>
                <span className="text-rose-400 font-medium">-₹{estimate.leaveDed.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-500">Advance Ded.: </span>
                <span className="text-rose-400 font-medium">-₹{estimate.advDed.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-fleet-400" />
                <span className="text-slate-500">Net: </span>
                <span className="text-fleet-300 font-bold text-sm">₹{estimate.net.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {status && <Alert type={status.type} msg={status.msg} onDismiss={() => setStatus(null)} />}

          {/* Leaves + Advances Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leaves Section */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Calendar size={14} className="text-amber-400" /> Leaves
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">{leaves.length}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newLeaveDate}
                  onChange={e => setNewLeaveDate(e.target.value)}
                  className="input-field flex-1 text-xs"
                />
                <input
                  value={newLeaveReason}
                  onChange={e => setNewLeaveReason(e.target.value)}
                  className="input-field flex-1 text-xs"
                  placeholder="Reason (optional)"
                />
                <button onClick={addLeave} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                  <Plus size={13} /> Add
                </button>
              </div>
              <div className="space-y-1 max-h-[220px] overflow-y-auto">
                {leaves.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar size={20} className="mx-auto mb-2 text-slate-700" />
                    <p className="text-xs text-slate-600">No leaves recorded for this period</p>
                  </div>
                ) : leaves.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 text-xs group hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-300 font-medium flex-shrink-0">
                        {new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-slate-500 truncate">{l.reason || '—'}</span>
                    </div>
                    <button onClick={() => deleteLeave(l.id)} className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Advances Section */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <DollarSign size={14} className="text-rose-400" /> Advances
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded-full font-bold">{advances.length}</span>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <input value={newAdvAmt} onChange={e => setNewAdvAmt(e.target.value)} className="input-field w-24 text-xs" placeholder="₹ Amount" type="number" />
                <input value={newAdvNote} onChange={e => setNewAdvNote(e.target.value)} className="input-field flex-1 text-xs min-w-[100px]" placeholder="Note (optional)" />
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" checked={newAdvDeduct} onChange={e => setNewAdvDeduct(e.target.checked)} className="rounded border-slate-600 w-3.5 h-3.5" />
                  Deduct
                </label>
                <button onClick={addAdvance} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                  <Plus size={13} /> Add
                </button>
              </div>
              <div className="space-y-1 max-h-[220px] overflow-y-auto">
                {advances.length === 0 ? (
                  <div className="text-center py-6">
                    <CreditCard size={20} className="mx-auto mb-2 text-slate-700" />
                    <p className="text-xs text-slate-600">No advances recorded for this period</p>
                  </div>
                ) : advances.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 text-xs group hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-300 font-medium flex-shrink-0">₹{a.amount.toLocaleString('en-IN')}</span>
                      <span className="text-slate-500 truncate flex-1">{a.note || '—'}</span>
                      {a.deductFromSalary && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded flex-shrink-0">Deduct</span>
                      )}
                    </div>
                    <button onClick={() => deleteAdvance(a.id)} className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 ml-2">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Salary Config */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Banknote size={14} className="text-slate-400" /> Salary Configuration
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <FormInput label="Base Salary (Monthly ₹)" value={baseSalaryInput} onChange={e => setBaseSalaryInput(e.target.value)} type="number" placeholder="e.g. 15000" />
              </div>
              <button onClick={updateConfig} disabled={savingConfig} className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
                {savingConfig ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {savingConfig ? 'Saving...' : 'Save Config'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <FileText size={14} className="text-slate-400" /> Salary Slip Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={generateSlip}
                disabled={generating || !config}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {generating ? 'Generating...' : `Generate Slip — ${MONTHS[month - 1]} ${year}`}
              </button>
              <button onClick={openHistory} className="btn-secondary flex items-center gap-2 text-sm">
                <Receipt size={14} /> View Past Slips
              </button>
            </div>
            {!config && (
              <p className="text-xs text-amber-400/80 mt-2">
                ⚠ Set a salary configuration above before generating slips.
              </p>
            )}
          </div>

          {/* History Dialog */}
          <SalaryHistoryDialog
            open={showHistory}
            onClose={() => setShowHistory(false)}
            slips={slips}
            driverId={driverId}
            driverName={driver?.name || ''}
            driverHasEmail={!!driver?.email}
          />
        </>
      )}
    </div>
  );
}
