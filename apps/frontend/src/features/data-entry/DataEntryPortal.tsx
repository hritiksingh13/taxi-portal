import React, { useState } from 'react';
import { useDashboardStore } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  Car,
  Users,
  Building2,
  Navigation,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

type Tab = 'car' | 'driver' | 'agent' | 'trip';

interface FormState {
  [key: string]: string | number;
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

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <select
          className="input-field appearance-none pr-9"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-slate-800">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── CAR FORM ──────────────────────────────────────────────────────────────────
function CarForm() {
  const { setCars } = useDashboardStore();
  const [form, setForm] = useState({ brand: '', licensePlate: '', transmissionType: '', status: 'Active' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.brand || !form.licensePlate || !form.transmissionType) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await api.post('/cars', form);
      const res = await api.get('/cars');
      setCars(res.data.data.cars);
      setForm({ brand: '', licensePlate: '', transmissionType: '', status: 'Active' });
      setStatus({ type: 'success', message: 'Vehicle registered successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Field label="Brand / Make *" value={form.brand} onChange={set('brand')} placeholder="e.g. Toyota Camry" />
      <Field label="License Plate *" value={form.licensePlate} onChange={set('licensePlate')} placeholder="e.g. MH12AB1234" />
      <Select
        label="Transmission Type *"
        value={form.transmissionType}
        onChange={set('transmissionType')}
        placeholder="Select transmission..."
        options={[
          { value: 'Automatic', label: 'Automatic' },
          { value: 'Manual', label: 'Manual' },
        ]}
      />
      <Select
        label="Status"
        value={form.status}
        onChange={set('status')}
        options={[
          { value: 'Active', label: 'Active' },
          { value: 'Maintenance', label: 'Under Maintenance' },
        ]}
      />
      {status && <Alert type={status.type} message={status.message} />}
      <button onClick={submit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus size={15} />
        {loading ? 'Registering...' : 'Register Vehicle'}
      </button>
    </div>
  );
}

// ── DRIVER FORM ───────────────────────────────────────────────────────────────
function DriverForm() {
  const { setDrivers, cars } = useDashboardStore();
  const [form, setForm] = useState({ name: '', phoneNumber: '', status: 'Offline', carId: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.phoneNumber) {
      setStatus({ type: 'error', message: 'Name and phone number are required.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const payload: any = { name: form.name, phoneNumber: form.phoneNumber, status: form.status };
      if (form.carId) payload.carId = form.carId;
      await api.post('/drivers', payload);
      const res = await api.get('/drivers');
      setDrivers(res.data.data.drivers);
      setForm({ name: '', phoneNumber: '', status: 'Offline', carId: '' });
      setStatus({ type: 'success', message: 'Driver onboarded successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const activeCars = cars.filter((c) => c.status === 'Active');

  return (
    <div className="space-y-4">
      <Field label="Full Name *" value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" />
      <Field label="Phone Number *" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="e.g. +91 98765 43210" />
      <Select
        label="Initial Status"
        value={form.status}
        onChange={set('status')}
        options={[
          { value: 'Free', label: 'Free' },
          { value: 'Offline', label: 'Offline' },
        ]}
      />
      <Select
        label="Assign Vehicle (Optional)"
        value={form.carId}
        onChange={set('carId')}
        placeholder="No vehicle assigned"
        options={[
          { value: '', label: '— None —' },
          ...activeCars.map((c) => ({ value: c.id, label: `${c.brand} · ${c.licensePlate}` })),
        ]}
      />
      {status && <Alert type={status.type} message={status.message} />}
      <button onClick={submit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus size={15} />
        {loading ? 'Onboarding...' : 'Onboard Driver'}
      </button>
    </div>
  );
}

// ── AGENT FORM ────────────────────────────────────────────────────────────────
function AgentForm() {
  const { setAgents } = useDashboardStore();
  const [form, setForm] = useState({ name: '', contactDetails: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.contactDetails) {
      setStatus({ type: 'error', message: 'Platform name and contact details are required.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await api.post('/agents', form);
      const res = await api.get('/agents');
      setAgents(res.data.data.agents);
      setForm({ name: '', contactDetails: '' });
      setStatus({ type: 'success', message: 'Platform registered successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Field label="Platform Name *" value={form.name} onChange={set('name')} placeholder="e.g. Uber, Ola, Private Booking" />
      <div>
        <label className="label">Contact Details *</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={form.contactDetails}
          onChange={(e) => set('contactDetails')(e.target.value)}
          placeholder="Email, phone, or account manager details..."
        />
      </div>
      {status && <Alert type={status.type} message={status.message} />}
      <button onClick={submit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus size={15} />
        {loading ? 'Registering...' : 'Register Platform'}
      </button>
    </div>
  );
}

// ── TRIP FORM ─────────────────────────────────────────────────────────────────
function TripForm() {
  const { drivers, agents, addTrip } = useDashboardStore();
  const [form, setForm] = useState({
    driverId: '',
    agentId: '',
    currentLocation: '',
    destination: '',
    estimatedDurationMinutes: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const freeDrivers = drivers.filter((d) => d.status === 'Free');

  const submit = async () => {
    if (!form.driverId || !form.agentId || !form.currentLocation || !form.destination || !form.estimatedDurationMinutes) {
      setStatus({ type: 'error', message: 'All fields are required to start a trip.' });
      return;
    }
    const duration = Number(form.estimatedDurationMinutes);
    if (isNaN(duration) || duration <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid duration in minutes.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/trips', {
        driverId: form.driverId,
        agentId: form.agentId,
        currentLocation: form.currentLocation,
        destination: form.destination,
        estimatedDurationMinutes: duration,
      });
      // Optimistic update (socket will also broadcast)
      addTrip(res.data.data.trip);
      setForm({ driverId: '', agentId: '', currentLocation: '', destination: '', estimatedDurationMinutes: '' });
      setStatus({ type: 'success', message: 'Trip initiated! Driver status updated to Busy.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        label="Driver *"
        value={form.driverId}
        onChange={set('driverId')}
        placeholder="Select a free driver..."
        options={freeDrivers.map((d) => ({
          value: d.id,
          label: `${d.name}${d.car ? ` · ${d.car.brand}` : ''}`,
        }))}
      />
      {freeDrivers.length === 0 && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
          No free drivers available. All drivers are currently busy or offline.
        </p>
      )}
      <Select
        label="Platform / Agent *"
        value={form.agentId}
        onChange={set('agentId')}
        placeholder="Select a platform..."
        options={agents.map((a) => ({ value: a.id, label: a.name }))}
      />
      <Field
        label="Pickup / Current Location *"
        value={form.currentLocation}
        onChange={set('currentLocation')}
        placeholder="e.g. Bandra Station, Mumbai"
      />
      <Field
        label="Destination *"
        value={form.destination}
        onChange={set('destination')}
        placeholder="e.g. Chhatrapati Shivaji Airport"
      />
      <div>
        <label className="label">Estimated Duration (minutes) *</label>
        <input
          type="number"
          min="1"
          className="input-field"
          value={form.estimatedDurationMinutes}
          onChange={(e) => set('estimatedDurationMinutes')(e.target.value)}
          placeholder="e.g. 45"
        />
      </div>
      {status && <Alert type={status.type} message={status.message} />}
      <button onClick={submit} disabled={loading || freeDrivers.length === 0} className="btn-primary w-full flex items-center justify-center gap-2">
        <Navigation size={15} />
        {loading ? 'Initiating Trip...' : 'Initiate Trip'}
      </button>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const tabs: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'car', label: 'Register Vehicle', icon: Car, description: 'Add a new car to the fleet' },
  { id: 'driver', label: 'Onboard Driver', icon: Users, description: 'Add a new driver operator' },
  { id: 'agent', label: 'Add Platform', icon: Building2, description: 'Register a booking platform' },
  { id: 'trip', label: 'Start Trip', icon: Navigation, description: 'Initiate a new active trip' },
];

export default function DataEntryPortal() {
  const [activeTab, setActiveTab] = useState<Tab>('car');
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-100">Data Entry Portal</h1>
        <p className="text-slate-500 text-sm mt-1">
          Register and manage fleet entities with validated input forms
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Tab Selector */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                activeTab === id
                  ? 'bg-fleet-500/15 border-fleet-500/30 text-fleet-300'
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              <Icon size={18} />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Form Panel */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-fleet-500/15 border border-fleet-500/20 flex items-center justify-center">
              <current.icon size={18} className="text-fleet-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">{current.label}</p>
              <p className="text-xs text-slate-500">{current.description}</p>
            </div>
          </div>

          {activeTab === 'car' && <CarForm />}
          {activeTab === 'driver' && <DriverForm />}
          {activeTab === 'agent' && <AgentForm />}
          {activeTab === 'trip' && <TripForm />}
        </div>
      </div>
    </div>
  );
}
