import React, { useState } from 'react';
import { useDashboardStore, Trip } from '../../core/store/useDashboardStore';

import { api } from '../../core/api.client';
import {
  MapPin,
  ArrowRight,
  Building2,
  Car,
  CheckCircle,
  Navigation,
  Radio,
  Copy,
  Check,
  Edit2,
  X,
  Plus,
  Clock
} from 'lucide-react';
import { Input, Select } from '../../shared/components/ui/Form';

const formatEstimatedEnd = (dateString?: string | null) => {
  if (!dateString) return 'No estimate';
  const date = new Date(dateString);
  const today = new Date();

  const isToday = date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today, ${time}`;
  }
  if (isTomorrow) {
    return `Tomorrow, ${time}`;
  }

  const day = date.getDate();
  const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
  const month = date.toLocaleString('default', { month: 'short' });
  const weekday = date.toLocaleString('default', { weekday: 'short' });

  return `${day}${suffix} ${month}, ${weekday}`;
};

const toLocalISOString = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function LiveTrackingHub() {
  const { activeTrips, removeTrip, setActiveTrips, customers, stats } = useDashboardStore();
  const [completing, setCompleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const handleComplete = async (trip: Trip, markPaid: boolean) => {
    setCompleting(trip.id);
    try {
      if (markPaid && trip.pendingAmount > 0) {
        const newAdvance = (trip.advancePaid || 0) + trip.pendingAmount;
        await api.patch(`/trips/${trip.id}`, {
          pendingAmount: 0,
          advancePaid: newAdvance
        });
      }
      await api.patch(`/trips/${trip.id}/complete`);
      removeTrip(trip.id);
      setConfirmCompleteId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCompleting(null);
    }
  };

  const copyShareLink = (shareToken: string, tripId: string) => {
    const link = `${window.location.origin}/portal/${shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(tripId);
    setTimeout(() => setCopied(null), 2000);
  };

  const startEdit = (trip: Trip) => {
    setEditingId(trip.id);
    let duration = '';
    if (trip.estimatedCompletion && trip.startTime) {
      const start = new Date(trip.startTime).getTime();
      const end = new Date(trip.estimatedCompletion).getTime();
      duration = String(Math.max(0, Math.round((end - start) / 60000)));
    }

    setEditForm({
      stops: [...trip.stops],
      advancePaid: trip.advancePaid,
      fuelExpense: trip.fuelExpense,
      pendingAmount: trip.pendingAmount,
      customerId: trip.customer?.id || '',
      startDate: toLocalISOString(trip.startDate),
      endDate: toLocalISOString(trip.endDate),
      estimatedDurationMinutes: duration,
    });
  };

  const saveEdit = async (tripId: string) => {
    setSaving(true);
    try {
      const payload: any = {
        stops: editForm.stops.filter((s: string) => s.trim().length >= 2),
        advancePaid: Number(editForm.advancePaid),
        fuelExpense: Number(editForm.fuelExpense),
        pendingAmount: Number(editForm.pendingAmount),
        customerId: editForm.customerId || null,
      };

      if (editForm.startDate) payload.startDate = new Date(editForm.startDate).toISOString();
      if (editForm.endDate) payload.endDate = new Date(editForm.endDate).toISOString();
      if (editForm.estimatedDurationMinutes !== undefined) {
        payload.estimatedDurationMinutes = editForm.estimatedDurationMinutes === '' ? null : Number(editForm.estimatedDurationMinutes);
      }

      const res = await api.patch(`/trips/${tripId}`, payload);
      // Update the active trips in store
      setActiveTrips(
        useDashboardStore.getState().activeTrips.map((t) =>
          t.id === tripId ? { ...t, ...res.data.data.trip } : t
        )
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStop = (index: number, value: string) => {
    setEditForm((prev: any) => {
      const newStops = [...prev.stops];
      newStops[index] = value;
      return { ...prev, stops: newStops };
    });
  };

  const addStop = () => {
    setEditForm((prev: any) => ({ ...prev, stops: [...prev.stops, ''] }));
  };

  const removeStop = (index: number) => {
    if (editForm.stops.length <= 2) return;
    setEditForm((prev: any) => ({
      ...prev,
      stops: prev.stops.filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-bold text-slate-100">Live Operations Hub</h1>
            {activeTrips.length > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
                <span className="dot-busy" style={{ width: 6, height: 6 }} />
                {activeTrips.length} Active
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">
            Real-time view of all drivers currently on active trips
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
          <Radio size={14} className="text-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-400">Live Telemetry</span>
        </div>
      </div>

      {stats === null ? (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-fleet-500/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-full h-full bg-slate-800 rounded-full border border-slate-700">
              <Radio className="w-8 h-8 text-fleet-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-display font-bold text-slate-100 mb-2">Connecting to Live Feed</h3>
          <p className="text-slate-500 text-sm">Syncing active fleet locations...</p>
        </div>
      ) : activeTrips.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <Navigation size={28} className="text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No Active Trips</p>
          <p className="text-sm text-slate-600 mt-1 max-w-xs">
            All drivers are currently free or offline. Start a trip from the Data Entry portal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTrips.map((trip, idx) => (
            <div
              key={trip.id}
              className="card p-5 hover:border-slate-700/80 transition-all duration-200 animate-slide-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: Driver & vehicle info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-fleet-500/15 border border-fleet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-base font-bold text-fleet-400">
                      {trip.driver.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 text-sm">{trip.driver.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {trip.driver.car && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Car size={10} />
                          {trip.driver.car.brand}
                          <span className="font-mono text-slate-600">{trip.driver.car.licensePlate}</span>
                        </span>
                      )}
                      {trip.customer && (
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          {trip.customer.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Route */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm flex-wrap">
                    {trip.stops.map((stop, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <div className="flex items-center gap-1 text-slate-300 min-w-0">
                          <MapPin size={11} className={sIdx === 0 ? 'text-emerald-400 flex-shrink-0' : sIdx === trip.stops.length - 1 ? 'text-fleet-400 flex-shrink-0' : 'text-slate-500 flex-shrink-0'} />
                          <span className="truncate text-xs">{stop}</span>
                        </div>
                        {sIdx < trip.stops.length - 1 && <ArrowRight size={11} className="text-slate-600 flex-shrink-0" />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Building2 size={10} />
                      {trip.agent.name}
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">
                      Started {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: Timer, share link, complete button */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    <Clock size={13} />
                    {formatEstimatedEnd(trip.estimatedCompletion || trip.endDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(trip)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-fleet-300 transition-colors"
                      title="Edit Trip Details"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    {trip.shareToken && (
                      <button
                        onClick={() => copyShareLink(trip.shareToken!, trip.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-fleet-300 transition-colors"
                        title="Copy shareable link"
                      >
                        {copied === trip.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copied === trip.id ? 'Copied' : 'Share'}
                      </button>
                    )}
                    {confirmCompleteId === trip.id ? (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        {trip.pendingAmount > 0 && (
                          <button
                            onClick={() => handleComplete(trip, true)}
                            disabled={completing === trip.id}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                          >
                            <CheckCircle size={11} />
                            Complete & Clear Pending (₹{trip.pendingAmount})
                          </button>
                        )}
                        <button
                          onClick={() => handleComplete(trip, false)}
                          disabled={completing === trip.id}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap"
                        >
                          {completing === trip.id && trip.pendingAmount <= 0 ? 'Completing...' : 'Just Complete'}
                        </button>
                        <button
                          onClick={() => setConfirmCompleteId(null)}
                          disabled={completing === trip.id}
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (trip.pendingAmount > 0) {
                            setConfirmCompleteId(trip.id);
                          } else {
                            handleComplete(trip, false);
                          }
                        }}
                        disabled={completing === trip.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 
                                   bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 
                                   px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-50"
                      >
                        <CheckCircle size={12} />
                        {completing === trip.id ? 'Completing...' : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Section */}
              {editingId === trip.id && (
                <div className="mt-4 pt-4 border-t border-slate-800/60 animate-fade-in">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Edit Trip Details</p>

                  <div className="space-y-4">
                    {/* Customer */}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Customer (Optional)</label>
                      <Select
                        className="py-1.5 text-sm"
                        value={editForm.customerId}
                        onChange={(e) => setEditForm({ ...editForm, customerId: e.target.value })}
                      >
                        <option value="">— None —</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-800">
                            {c.name} {c.phone ? `· ${c.phone}` : ''}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Stops */}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Route Stops (min 2)</label>
                      <div className="space-y-2">
                        {editForm.stops.map((stop: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              className="py-1.5 text-sm"
                              value={stop}
                              onChange={(e) => updateStop(idx, e.target.value)}
                              placeholder={idx === 0 ? 'Pickup' : idx === editForm.stops.length - 1 ? 'Dropoff' : `Stop ${idx + 1}`}
                            />
                            {editForm.stops.length > 2 && (
                              <button onClick={() => removeStop(idx)} className="text-slate-600 hover:text-rose-400 p-1">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={addStop} className="mt-2 flex items-center gap-1 text-xs text-fleet-400 hover:text-fleet-300">
                        <Plus size={12} /> Add Stop
                      </button>
                    </div>

                    {/* Schedule & Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Start Date</label>
                        <Input
                          type="datetime-local"
                          className="py-1.5 text-sm"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">End Date</label>
                        <Input
                          type="datetime-local"
                          className="py-1.5 text-sm"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Duration (mins)</label>
                        <Input
                          type="number"
                          className="py-1.5 text-sm"
                          value={editForm.estimatedDurationMinutes}
                          onChange={(e) => setEditForm({ ...editForm, estimatedDurationMinutes: e.target.value })}
                          placeholder="e.g. 45"
                        />
                      </div>
                    </div>

                    {/* Financials */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Amount Paid</label>
                        <Input
                          type="number"
                          className="py-1.5 text-sm"
                          value={editForm.advancePaid}
                          onChange={(e) => setEditForm({ ...editForm, advancePaid: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Fuel Expense</label>
                        <Input
                          type="number"
                          className="py-1.5 text-sm"
                          value={editForm.fuelExpense}
                          onChange={(e) => setEditForm({ ...editForm, fuelExpense: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1">Pending Amount</label>
                        <Input
                          type="number"
                          className="py-1.5 text-sm"
                          value={editForm.pendingAmount}
                          onChange={(e) => setEditForm({ ...editForm, pendingAmount: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => saveEdit(trip.id)}
                        disabled={saving}
                        className="btn-primary text-xs py-1.5 px-4"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-secondary text-xs py-1.5 px-4"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

