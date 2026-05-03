import React, { useState } from 'react';
import { useDashboardStore, Trip } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  CalendarClock,
  MapPin,
  ArrowRight,
  Building2,
  Car,
  Clock,
  Edit2,
  X,
  Plus,
  Trash2,
  Play,
  Copy,
  Check,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { Input, Select } from '../../shared/components/ui/Form';
import { DateTimeInput } from '../../shared/components/ui/DateTimeInput';

const formatScheduledDate = (dateString?: string | null) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  const now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  const day = date.getDate();
  const suffix = [11, 12, 13].includes(day) ? 'th' : ['st', 'nd', 'rd'][(day % 10) - 1] || 'th';
  const month = date.toLocaleString('default', { month: 'short' });
  const weekday = date.toLocaleString('default', { weekday: 'short' });
  return `${day}${suffix} ${month}, ${weekday} ${time}`;
};

const toLocalISOString = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getTimeUntil = (dateString: string) => {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Starting now';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
};

export default function UpcomingTrips() {
  const { scheduledTrips, setScheduledTrips, removeScheduledTrip, addTrip, customers, cars, stats } = useDashboardStore();
  const activeCars = cars.filter((c) => c.status === 'Active');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Confirmation modal state for moving trip to active
  const [moveConfirm, setMoveConfirm] = useState<{ tripId: string; payload: any } | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);

  const startEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setEditError(null);
    setEditForm({
      stops: [...trip.stops],
      carId: trip.car?.id || '',
      advancePaid: trip.advancePaid,
      fuelExpense: trip.fuelExpense,
      pendingAmount: trip.pendingAmount,
      customerId: trip.customer?.id || '',
      startDate: toLocalISOString(trip.startDate),
      endDate: toLocalISOString(trip.endDate),
    });
  };

  const buildPayload = () => {
    const payload: any = {
      stops: editForm.stops.filter((s: string) => s.trim().length >= 2),
      advancePaid: Number(editForm.advancePaid),
      fuelExpense: Number(editForm.fuelExpense),
      pendingAmount: Number(editForm.pendingAmount),
      customerId: editForm.customerId || null,
    };
    if (editForm.carId) payload.carId = editForm.carId;
    if (editForm.startDate) payload.startDate = new Date(editForm.startDate).toISOString();
    if (editForm.endDate) payload.endDate = new Date(editForm.endDate).toISOString();
    return payload;
  };

  const saveEdit = async (tripId: string) => {
    setSaving(true);
    setEditError(null);

    const payload = buildPayload();

    // Check if start date is being changed to current or past
    if (editForm.startDate) {
      const newStart = new Date(editForm.startDate);
      const now = new Date();
      if (newStart <= now) {
        // Show confirmation modal
        setMoveConfirm({ tripId, payload });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await api.patch(`/trips/${tripId}`, payload);
      const updatedTrip = res.data.data.trip;
      setScheduledTrips(
        useDashboardStore.getState().scheduledTrips.map((t) =>
          t.id === tripId ? { ...t, ...updatedTrip } : t
        )
      );
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmMoveToActive = async () => {
    if (!moveConfirm) return;
    setMoveLoading(true);
    try {
      const res = await api.patch(`/trips/${moveConfirm.tripId}`, moveConfirm.payload);
      const updatedTrip = res.data.data.trip;

      // Remove from scheduled, add to active
      removeScheduledTrip(moveConfirm.tripId);
      addTrip({ ...updatedTrip, status: 'Active' });

      setEditingId(null);
      setMoveConfirm(null);
    } catch (err: any) {
      setEditError(err.message);
      setMoveConfirm(null);
    } finally {
      setMoveLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled trip?')) return;
    setDeletingId(tripId);
    try {
      await api.delete(`/trips/${tripId}`);
      removeScheduledTrip(tripId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleActivateNow = async (trip: Trip) => {
    if (!confirm(`Activate trip for ${trip.driver.name} now? This will move it to Live Tracking.`)) return;
    try {
      const res = await api.patch(`/trips/${trip.id}`, {
        startDate: new Date().toISOString(),
        status: 'Active',
      });
      removeScheduledTrip(trip.id);
      addTrip(res.data.data.trip);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyShareLink = (shareToken: string, tripId: string) => {
    const link = `${window.location.origin}/portal/${shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(tripId);
    setTimeout(() => setCopied(null), 2000);
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
      {/* Move to Active Confirmation Modal */}
      {moveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">Move to Live Tracking?</p>
                <p className="text-xs text-slate-500 mt-0.5">Start date is in the past or current time</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              The start date you selected is in the past or is the current time. 
              This will move the trip from <span className="text-fleet-400 font-medium">Upcoming Trips</span> to <span className="text-emerald-400 font-medium">Live Tracking Hub</span> and 
              mark it as an active trip. Are you sure?
            </p>
            {editError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium mb-4 animate-fade-in">
                <span>⚠️</span>
                {editError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={confirmMoveToActive}
                disabled={moveLoading}
                className="btn-primary flex-1 text-sm py-2"
              >
                {moveLoading ? 'Moving...' : 'Yes, Activate Now'}
              </button>
              <button
                onClick={() => setMoveConfirm(null)}
                disabled={moveLoading}
                className="btn-secondary flex-1 text-sm py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-bold text-slate-100">Upcoming Trips</h1>
            {scheduledTrips.length > 0 && (
              <span className="flex items-center gap-1.5 bg-fleet-500/15 text-fleet-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-fleet-500/20">
                <CalendarClock size={11} />
                {scheduledTrips.length} Scheduled
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">
            Future trips scheduled for your fleet drivers
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
          <CalendarClock size={14} className="text-fleet-400" />
          <span className="text-xs font-medium text-slate-400">Schedule Manager</span>
        </div>
      </div>

      {stats === null ? (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-fleet-500/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center w-full h-full bg-slate-800 rounded-full border border-slate-700">
              <CalendarClock className="w-8 h-8 text-fleet-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-display font-bold text-slate-100 mb-2">Loading Scheduled Trips</h3>
          <p className="text-slate-500 text-sm">Fetching upcoming trip data...</p>
        </div>
      ) : scheduledTrips.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <CalendarClock size={28} className="text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No Upcoming Trips</p>
          <p className="text-sm text-slate-600 mt-1 max-w-xs">
            Schedule a future trip from the Data Entry portal to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduledTrips.map((trip, idx) => (
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
                      {trip.car && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Car size={10} />
                          {trip.car.brand}
                          <span className="font-mono text-slate-600">{trip.car.licensePlate}</span>
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
                    <span className="flex items-center gap-1 text-xs text-fleet-400 font-medium">
                      <Clock size={10} />
                      Starts {formatScheduledDate(trip.startDate)}
                    </span>
                  </div>
                </div>

                {/* Right: Countdown, actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-fleet-400 bg-fleet-500/10 px-2.5 py-1 rounded-md border border-fleet-500/20">
                    <CalendarClock size={13} />
                    {getTimeUntil(trip.startDate)}
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
                    <button
                      onClick={() => handleActivateNow(trip)}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300
                                 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20
                                 px-3 py-1.5 rounded-lg transition-all duration-150"
                    >
                      <Play size={12} />
                      Start Now
                    </button>
                    <button
                      onClick={() => handleDelete(trip.id)}
                      disabled={deletingId === trip.id}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Trip"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              {(trip.advancePaid > 0 || trip.fuelExpense > 0 || trip.pendingAmount > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-800/40">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Wallet size={11} className="text-slate-600" />
                      Payment
                    </span>
                    <span className="text-xs text-slate-400">
                      Paid <span className="font-semibold text-emerald-400">₹{trip.advancePaid.toLocaleString()}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Fuel <span className="font-semibold text-amber-400">₹{trip.fuelExpense.toLocaleString()}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Pending{' '}
                      <span className={`font-semibold ${trip.pendingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{trip.pendingAmount.toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Edit Section */}
              {editingId === trip.id && (
                <div className="mt-4 pt-4 border-t border-slate-800/60 animate-fade-in">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Edit Scheduled Trip</p>

                  <div className="space-y-4">
                    {/* Vehicle */}
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-1">Vehicle</label>
                      <Select
                        className="py-1.5 text-sm"
                        value={editForm.carId}
                        onChange={(e) => setEditForm({ ...editForm, carId: e.target.value })}
                      >
                        {activeCars.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-800">
                            {c.brand} · {c.licensePlate} · {c.transmissionType}
                          </option>
                        ))}
                      </Select>
                    </div>

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

                    {/* Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DateTimeInput
                        label="Start Date & Time"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e })}
                      />
                      <DateTimeInput
                        label="End Date & Time"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e })}
                      />
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

                    {/* Error Message */}
                    {editError && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium animate-fade-in">
                        <span>⚠️</span>
                        {editError}
                      </div>
                    )}

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
                        onClick={() => { setEditingId(null); setEditError(null); }}
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
