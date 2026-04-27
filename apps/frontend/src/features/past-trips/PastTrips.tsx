import React, { useEffect, useState } from 'react';
import { api } from '../../core/api.client';
import { Trip } from '../../core/store/useDashboardStore';
import {
  History,
  ArrowRight,
  Building2,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';

export default function PastTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await api.get('/trips/past');
      setTrips(res.data.data.trips);
    } catch (err) {
      console.error('Failed to load past trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setEditForm({
      advancePaid: trip.advancePaid,
      fuelExpense: trip.fuelExpense,
      pendingAmount: trip.pendingAmount,
    });
  };

  const saveEdit = async (tripId: string) => {
    setSaving(true);
    try {
      await api.patch(`/trips/${tripId}`, {
        advancePaid: Number(editForm.advancePaid),
        fuelExpense: Number(editForm.fuelExpense),
        pendingAmount: Number(editForm.pendingAmount),
      });
      setEditingId(null);
      loadTrips();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (shareToken: string, tripId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${shareToken}`);
    setCopied(tripId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Past Trips</h1>
          <p className="text-slate-500 text-sm mt-1">
            View completed and cancelled trips with payment details
          </p>
        </div>
        <span className="text-sm text-slate-500">{trips.length} trips</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-48" />
              <div className="h-3 bg-slate-800 rounded w-32 mt-2" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <History size={28} className="text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No Past Trips</p>
          <p className="text-sm text-slate-600 mt-1">Completed trips will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="card overflow-hidden hover:border-slate-700/80 transition-colors duration-200">
              {/* Summary row */}
              <div
                className="p-5 cursor-pointer flex items-center justify-between gap-4"
                onClick={() => setExpanded(expanded === trip.id ? null : trip.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-sm font-bold text-slate-300">{trip.driver.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-100 text-sm">{trip.driver.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        trip.status === 'Ended'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                      {trip.stops.map((stop, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <span className="truncate max-w-[120px]">{stop}</span>
                          {sIdx < trip.stops.length - 1 && <ArrowRight size={10} className="text-slate-700 flex-shrink-0" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{new Date(trip.startTime).toLocaleDateString()}</p>
                    {trip.feedback && (
                      <div className="flex items-center gap-0.5 mt-0.5 justify-end">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} className={i < trip.feedback!.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                        ))}
                      </div>
                    )}
                  </div>
                  {expanded === trip.id ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </div>
              </div>

              {/* Expanded details */}
              {expanded === trip.id && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-800/60">
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="label">Platform</p>
                      <p className="text-sm text-slate-300 flex items-center gap-1"><Building2 size={12} /> {trip.agent.name}</p>
                    </div>
                    <div>
                      <p className="label">Customer</p>
                      <p className="text-sm text-slate-300 flex items-center gap-1"><Users size={12} /> {trip.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="label">Duration</p>
                      <p className="text-sm text-slate-300 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="mt-4 p-4 bg-slate-800/40 rounded-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <DollarSign size={12} /> Payment Details
                    </p>
                    {editingId === trip.id ? (
                      <div className="grid grid-cols-3 gap-3">
                        {['advancePaid', 'fuelExpense', 'pendingAmount'].map((field) => (
                          <div key={field}>
                            <label className="text-[10px] text-slate-500 uppercase">{field.replace(/([A-Z])/g, ' $1')}</label>
                            <input
                              type="number"
                              className="input-field mt-1"
                              value={editForm[field]}
                              onChange={(e) => setEditForm((f: any) => ({ ...f, [field]: e.target.value }))}
                            />
                          </div>
                        ))}
                        <div className="col-span-3 flex gap-2 mt-2">
                          <button onClick={() => saveEdit(trip.id)} disabled={saving} className="btn-primary text-xs py-1.5 px-4">
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5 px-4">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Advance Paid</p>
                          <p className="text-sm font-semibold text-emerald-400">₹{trip.advancePaid}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Fuel Expense</p>
                          <p className="text-sm font-semibold text-amber-400">₹{trip.fuelExpense}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Pending</p>
                          <p className="text-sm font-semibold text-rose-400">₹{trip.pendingAmount}</p>
                        </div>
                        <button onClick={() => startEdit(trip)} className="col-span-3 text-xs text-fleet-400 hover:text-fleet-300 font-medium text-left mt-1">
                          Edit Payment Details
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Share Link */}
                  {trip.shareToken && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Portal link:</span>
                      <button
                        onClick={() => copyLink(trip.shareToken!, trip.id)}
                        className="flex items-center gap-1.5 text-xs text-fleet-400 hover:text-fleet-300 font-mono"
                      >
                        {copied === trip.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copied === trip.id ? 'Copied!' : `/portal/${trip.shareToken.slice(0, 8)}...`}
                      </button>
                    </div>
                  )}

                  {/* Feedback */}
                  {trip.feedback && (
                    <div className="mt-3 p-4 bg-purple-500/5 border border-purple-500/15 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={14} className={i < trip.feedback!.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">Customer Feedback</span>
                      </div>
                      <p className="text-sm text-slate-300">"{trip.feedback.experience}"</p>
                      {trip.feedback.reason && <p className="text-xs text-slate-500 mt-1">Reason: {trip.feedback.reason}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
