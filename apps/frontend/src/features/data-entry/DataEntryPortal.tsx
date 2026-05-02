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
  X,
  MapPin,
  Edit2,
  Trash2,
} from 'lucide-react';
import { FormInput, FormSelect, FormTextarea, Input, Label, Select as SharedSelect } from '../../shared/components/ui/Form';

type Tab = 'car' | 'driver' | 'agent' | 'trip';

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium animate-fade-up ${type === 'success'
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}
    >
      {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}


// ── CAR FORM ──────────────────────────────────────────────────────────────────
function CarForm() {
  const { cars, setCars } = useDashboardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ brand: '', licensePlate: '', transmissionType: '', status: 'Active' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleEdit = (car: any) => {
    setEditingId(car.id);
    setForm({ brand: car.brand, licensePlate: car.licensePlate, transmissionType: car.transmissionType, status: car.status });
    setStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/cars/${id}`);
      setCars(cars.filter((c) => c.id !== id));
      setStatus({ type: 'success', message: 'Vehicle deleted successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const submit = async () => {
    if (!form.brand || !form.licensePlate || !form.transmissionType) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      if (editingId) {
        await api.patch(`/cars/${editingId}`, form);
        setStatus({ type: 'success', message: 'Vehicle updated successfully.' });
      } else {
        await api.post('/cars', form);
        setStatus({ type: 'success', message: 'Vehicle registered successfully.' });
      }
      const res = await api.get('/cars');
      setCars(res.data.data.cars);
      setEditingId(null);
      setForm({ brand: '', licensePlate: '', transmissionType: '', status: 'Active' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ brand: '', licensePlate: '', transmissionType: '', status: 'Active' });
    setStatus(null);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <FormInput label="Brand / Make *" value={form.brand} onChange={set('brand')} placeholder="e.g. Toyota Camry" />
        <FormInput label="License Plate *" value={form.licensePlate} onChange={set('licensePlate')} placeholder="e.g. MH12AB1234" />
        <FormSelect
          label="Transmission Type *"
          value={form.transmissionType}
          onChange={set('transmissionType')}
          placeholder="Select transmission..."
          options={[
            { value: 'Automatic', label: 'Automatic' },
            { value: 'Manual', label: 'Manual' },
          ]}
        />
        <FormSelect
          label="Status"
          value={form.status}
          onChange={set('status')}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Maintenance', label: 'Under Maintenance' },
          ]}
        />
        {status && <Alert type={status.type} message={status.message} />}
        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {editingId ? <Edit2 size={15} /> : <Plus size={15} />}
            {loading ? 'Saving...' : editingId ? 'Update Vehicle' : 'Register Vehicle'}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {cars.length > 0 && (
        <div className="border-t border-slate-800/60 pt-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Registered Vehicles</p>
          <div className="space-y-2">
            {cars.map((car) => (
              <div key={car.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <div>
                  <p className="text-sm font-medium text-slate-200">{car.brand} <span className="text-xs text-slate-500 ml-2">{car.licensePlate}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(car)} className="p-1.5 text-slate-400 hover:text-emerald-400"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(car.id)} className="p-1.5 text-slate-400 hover:text-rose-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DRIVER FORM ───────────────────────────────────────────────────────────────
function DriverForm() {
  const { drivers, setDrivers } = useDashboardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phoneNumber: '', status: 'Offline' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleEdit = (driver: any) => {
    setEditingId(driver.id);
    setForm({ name: driver.name, phoneNumber: driver.phoneNumber, status: driver.status });
    setStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this driver?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      setDrivers(drivers.filter((d) => d.id !== id));
      setStatus({ type: 'success', message: 'Driver removed successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const submit = async () => {
    if (!form.name || !form.phoneNumber) {
      setStatus({ type: 'error', message: 'Name and phone number are required.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      if (editingId) {
        await api.patch(`/drivers/${editingId}`, form);
        setStatus({ type: 'success', message: 'Driver updated successfully.' });
      } else {
        await api.post('/drivers', { name: form.name, phoneNumber: form.phoneNumber, status: form.status });
        setStatus({ type: 'success', message: 'Driver onboarded successfully.' });
      }
      const res = await api.get('/drivers');
      setDrivers(res.data.data.drivers);
      setEditingId(null);
      setForm({ name: '', phoneNumber: '', status: 'Offline' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', phoneNumber: '', status: 'Offline' });
    setStatus(null);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <FormInput label="Full Name *" value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" />
        <FormInput label="Phone Number *" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="e.g. +91 98765 43210" />
        <FormSelect
          label="Initial Status"
          value={form.status}
          onChange={set('status')}
          options={[
            { value: 'Free', label: 'Free' },
            { value: 'Offline', label: 'Offline' },
          ]}
        />
        {status && <Alert type={status.type} message={status.message} />}
        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {editingId ? <Edit2 size={15} /> : <Plus size={15} />}
            {loading ? 'Saving...' : editingId ? 'Update Driver' : 'Onboard Driver'}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {drivers.length > 0 && (
        <div className="border-t border-slate-800/60 pt-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Onboarded Drivers</p>
          <div className="space-y-2">
            {drivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <div>
                  <p className="text-sm font-medium text-slate-200">{driver.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{driver.phoneNumber}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(driver)} className="p-1.5 text-slate-400 hover:text-emerald-400"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(driver.id)} className="p-1.5 text-slate-400 hover:text-rose-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AGENT FORM ────────────────────────────────────────────────────────────────
function AgentForm() {
  const { agents, setAgents } = useDashboardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contactDetails: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleEdit = (agent: any) => {
    setEditingId(agent.id);
    setForm({ name: agent.name, contactDetails: agent.contactDetails });
    setStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this platform?')) return;
    try {
      await api.delete(`/agents/${id}`);
      setAgents(agents.filter((a) => a.id !== id));
      setStatus({ type: 'success', message: 'Platform deleted successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const submit = async () => {
    if (!form.name || !form.contactDetails) {
      setStatus({ type: 'error', message: 'Platform name and contact details are required.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      if (editingId) {
        await api.patch(`/agents/${editingId}`, form);
        setStatus({ type: 'success', message: 'Platform updated successfully.' });
      } else {
        await api.post('/agents', form);
        setStatus({ type: 'success', message: 'Platform registered successfully.' });
      }
      const res = await api.get('/agents');
      setAgents(res.data.data.agents);
      setEditingId(null);
      setForm({ name: '', contactDetails: '' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', contactDetails: '' });
    setStatus(null);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <FormInput label="Platform Name *" value={form.name} onChange={set('name')} placeholder="e.g. Uber, Ola, Private Booking" />
        <FormTextarea
          label="Contact Details *"
          rows={3}
          value={form.contactDetails}
          onChange={set('contactDetails')}
          placeholder="Email, phone, or account manager details..."
        />
        {status && <Alert type={status.type} message={status.message} />}
        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {editingId ? <Edit2 size={15} /> : <Plus size={15} />}
            {loading ? 'Saving...' : editingId ? 'Update Platform' : 'Register Platform'}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {agents.length > 0 && (
        <div className="border-t border-slate-800/60 pt-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Registered Platforms</p>
          <div className="space-y-2">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <div>
                  <p className="text-sm font-medium text-slate-200">{agent.name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(agent)} className="p-1.5 text-slate-400 hover:text-emerald-400"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(agent.id)} className="p-1.5 text-slate-400 hover:text-rose-400"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TRIP FORM (REBUILT: multi-stop, dates, customer, payment) ─────────────────
function TripForm() {
  const { drivers, agents, customers, addTrip, setCustomers } = useDashboardStore();
  const [stops, setStops] = useState<string[]>(['', '']);
  const [form, setForm] = useState({
    driverId: '',
    agentId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    advancePaid: '',
    fuelExpense: '',
    pendingAmount: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // New Customer Shortcut State
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [customerLoading, setCustomerLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setCust = (k: string) => (e: React.ChangeEvent<any>) => setCustomerForm((f) => ({ ...f, [k]: e.target.value }));

  const freeDrivers = drivers.filter((d) => d.status === 'Free');

  const updateStop = (index: number, value: string) => {
    setStops((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const addStop = () => setStops((prev) => [...prev, '']);
  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name || !customerForm.phone) {
      setStatus({ type: 'error', message: 'Customer name and phone are required.' });
      return;
    }
    setCustomerLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/customers', customerForm);
      const newCustomer = res.data.data.customer;

      const listRes = await api.get('/customers');
      setCustomers(listRes.data.data.customers);

      setForm((f) => ({ ...f, customerId: newCustomer.id }));
      setShowNewCustomer(false);
      setCustomerForm({ name: '', phone: '', email: '' });
      setStatus({ type: 'success', message: 'Customer added successfully.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setCustomerLoading(false);
    }
  };

  const submit = async () => {
    const validStops = stops.filter((s) => s.trim().length >= 2);
    if (!form.driverId || !form.agentId || validStops.length < 2) {
      setStatus({ type: 'error', message: 'Driver, platform, and at least 2 stops are required.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const payload: any = {
        driverId: form.driverId,
        agentId: form.agentId,
        stops: validStops,
      };
      if (form.customerId) payload.customerId = form.customerId;
      if (form.startDate) payload.startDate = form.startDate;
      if (form.endDate) payload.endDate = form.endDate;
      if (form.advancePaid) payload.advancePaid = Number(form.advancePaid);
      if (form.fuelExpense) payload.fuelExpense = Number(form.fuelExpense);
      if (form.pendingAmount) payload.pendingAmount = Number(form.pendingAmount);

      const res = await api.post('/trips', payload);
      addTrip(res.data.data.trip);
      setStops(['', '']);
      setForm({
        driverId: '', agentId: '', customerId: '',
        startDate: '', endDate: '', advancePaid: '', fuelExpense: '', pendingAmount: '',
      });
      setStatus({ type: 'success', message: 'Trip initiated! Driver status updated to Busy.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormSelect
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
      <FormSelect
        label="Platform / Agent *"
        value={form.agentId}
        onChange={set('agentId')}
        placeholder="Select a platform..."
        options={agents.map((a) => ({ value: a.id, label: a.name }))}
      />

      {/* Customer Selection or Creation */}
      <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-300">Customer</label>
          <button
            onClick={() => setShowNewCustomer(!showNewCustomer)}
            className="flex items-center gap-1 text-xs text-fleet-400 hover:text-fleet-300 transition-colors font-medium"
            type="button"
          >
            {showNewCustomer ? <X size={12} /> : <Plus size={12} />}
            {showNewCustomer ? 'Cancel' : 'Add New Customer'}
          </button>
        </div>

        {showNewCustomer ? (
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput label="Name *" value={customerForm.name} onChange={setCust('name')} placeholder="e.g. Priya Singh" />
              <FormInput label="Phone *" value={customerForm.phone} onChange={setCust('phone')} placeholder="e.g. +91 98765 43210" />
            </div>
            <FormInput label="Email (Optional)" value={customerForm.email} onChange={setCust('email')} placeholder="e.g. priya@example.com" type="email" />
            <button
              onClick={handleCreateCustomer}
              disabled={customerLoading}
              className="btn-primary w-full text-xs py-2"
              type="button"
            >
              {customerLoading ? 'Saving Customer...' : 'Save & Select Customer'}
            </button>
          </div>
        ) : (
          <FormSelect
            label=""
            value={form.customerId}
            onChange={set('customerId')}
            placeholder="Select existing customer..."
            options={[
              { value: '', label: '— None —' },
              ...customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` })),
            ]}
          />
        )}
      </div>

      {/* Multi-stop */}
      <div>
        <label className="label">Route Stops * (min 2)</label>
        <div className="space-y-2">
          {stops.map((stop, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-fleet-500/15 border border-fleet-500/20 flex-shrink-0">
                <MapPin size={10} className={idx === 0 ? 'text-emerald-400' : idx === stops.length - 1 ? 'text-fleet-400' : 'text-slate-400'} />
              </div>
              <Input
                className="flex-1"
                value={stop}
                onChange={(e) => updateStop(idx, e.target.value)}
                placeholder={idx === 0 ? 'Pickup location' : idx === stops.length - 1 ? 'Final destination' : `Stop ${idx + 1}`}
              />
              {stops.length > 2 && (
                <button onClick={() => removeStop(idx)} className="text-slate-600 hover:text-rose-400 transition-colors p-1" type="button">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addStop} className="mt-2 flex items-center gap-1.5 text-xs text-fleet-400 hover:text-fleet-300 font-medium transition-colors" type="button">
          <Plus size={12} /> Add Stop
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormInput label="Start Date" value={form.startDate} onChange={set('startDate')} type="datetime-local" />
        <FormInput label="End Date" value={form.endDate} onChange={set('endDate')} type="datetime-local" />
      </div>

      {/* Payment Fields */}
      <div className="border-t border-slate-800/60 pt-4 mt-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Payment Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormInput label="Amount Paid (₹)" value={form.advancePaid} onChange={set('advancePaid')} type="number" placeholder="0" />
          <FormInput label="Fuel Expense (₹)" value={form.fuelExpense} onChange={set('fuelExpense')} type="number" placeholder="0" />
          <FormInput label="Pending (₹)" value={form.pendingAmount} onChange={set('pendingAmount')} type="number" placeholder="0" />
        </div>
      </div>

      {status && <Alert type={status.type} message={status.message} />}
      <button onClick={submit} disabled={loading || freeDrivers.length === 0} className="btn-primary w-full flex items-center justify-center gap-2" type="button">
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-100">Data Entry Portal</h1>
        <p className="text-slate-500 text-sm mt-1">
          Register and manage fleet entities with validated input forms
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${activeTab === id
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
