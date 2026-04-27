import React, { useState } from 'react';
import { useDashboardStore, Driver, Car, Agent } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  GitBranch,
  Car as CarIcon,
  Building2,
  Users,
  Link,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

type MatrixTab = 'car-assignment' | 'agent-assignment';

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

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; sub?: string }[];
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

// ── CAR ASSIGNMENT ─────────────────────────────────────────────────────────────
function CarAssignment() {
  const { drivers, cars, setDrivers } = useDashboardStore();
  const [driverId, setDriverId] = useState('');
  const [carId, setCarId] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const activeCars = cars.filter((c) => c.status === 'Active');
  const selectedDriver = drivers.find((d) => d.id === driverId);
  const selectedCar = cars.find((c) => c.id === carId);

  const handleAssign = async () => {
    if (!driverId || !carId) {
      setFeedback({ type: 'error', message: 'Select both a driver and a vehicle.' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      await api.post(`/drivers/${driverId}/assign-car`, { carId });
      const res = await api.get('/drivers');
      setDrivers(res.data.data.drivers);
      setFeedback({ type: 'success', message: `${selectedDriver?.name} assigned to ${selectedCar?.brand} (${selectedCar?.licensePlate})` });
      setDriverId('');
      setCarId('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Link size={14} className="text-fleet-400" />
          Assign Vehicle to Driver
        </p>

        <SelectField
          label="Driver"
          value={driverId}
          onChange={setDriverId}
          placeholder="Select driver..."
          options={drivers.map((d) => ({
            value: d.id,
            label: `${d.name} — ${d.status}${d.car ? ` · Currently: ${d.car.brand}` : ''}`,
          }))}
        />

        <SelectField
          label="Vehicle"
          value={carId}
          onChange={setCarId}
          placeholder="Select active vehicle..."
          options={activeCars.map((c) => ({
            value: c.id,
            label: `${c.brand} · ${c.licensePlate} (${c.transmissionType})`,
          }))}
        />

        {/* Preview */}
        {selectedDriver && selectedCar && (
          <div className="flex items-center gap-3 bg-fleet-500/5 border border-fleet-500/15 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Users size={13} className="text-fleet-400" />
              <span className="font-medium text-slate-200">{selectedDriver.name}</span>
            </div>
            <ChevronRight size={14} className="text-slate-600" />
            <div className="flex items-center gap-2 text-sm">
              <CarIcon size={13} className="text-fleet-400" />
              <span className="font-medium text-slate-200">{selectedCar.brand}</span>
              <span className="font-mono text-xs text-slate-500">{selectedCar.licensePlate}</span>
            </div>
          </div>
        )}

        {feedback && <Alert type={feedback.type} message={feedback.message} />}

        <button
          onClick={handleAssign}
          disabled={loading || !driverId || !carId}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Link size={14} />
          {loading ? 'Assigning...' : 'Assign Vehicle'}
        </button>
      </div>

      {/* Current Driver–Car mappings */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <p className="text-sm font-semibold text-slate-300">Current Driver–Vehicle Mappings</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/40">
              <th className="table-th">Driver</th>
              <th className="table-th">Status</th>
              <th className="table-th">Assigned Vehicle</th>
              <th className="table-th">Plate</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-td text-slate-600 text-center py-8">
                  No drivers registered yet
                </td>
              </tr>
            ) : (
              drivers.map((d) => (
                <tr key={d.id} className="table-row">
                  <td className="table-td font-medium text-slate-200">{d.name}</td>
                  <td className="table-td">
                    <span
                      className={
                        d.status === 'Free'
                          ? 'badge-free'
                          : d.status === 'Busy'
                          ? 'badge-busy'
                          : 'badge-offline'
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="table-td">
                    {d.car ? (
                      <span className="text-slate-300">{d.car.brand}</span>
                    ) : (
                      <span className="text-slate-600 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="table-td">
                    {d.car ? (
                      <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {d.car.licensePlate}
                      </span>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── AGENT ASSIGNMENT ───────────────────────────────────────────────────────────
function AgentAssignment() {
  const { drivers, agents, setDrivers } = useDashboardStore();
  const [driverId, setDriverId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const selectedDriver = drivers.find((d) => d.id === driverId);
  const selectedAgent = agents.find((a) => a.id === agentId);

  const assignedAgentIds = new Set(
    selectedDriver?.driverAgents?.map((da) => da.agent.id) ?? []
  );

  const handleAssign = async () => {
    if (!driverId || !agentId) {
      setFeedback({ type: 'error', message: 'Select both a driver and a platform.' });
      return;
    }
    if (assignedAgentIds.has(agentId)) {
      setFeedback({ type: 'error', message: 'Driver is already linked to this platform.' });
      return;
    }
    setLoading('assign');
    setFeedback(null);
    try {
      await api.post(`/drivers/${driverId}/assign-agent`, { agentId });
      const res = await api.get('/drivers');
      setDrivers(res.data.data.drivers);
      setFeedback({
        type: 'success',
        message: `${selectedDriver?.name} linked to ${selectedAgent?.name}.`,
      });
      setAgentId('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (removeAgentId: string) => {
    setLoading(removeAgentId);
    setFeedback(null);
    try {
      await api.delete(`/drivers/${driverId}/remove-agent`, { data: { agentId: removeAgentId } });
      const res = await api.get('/drivers');
      setDrivers(res.data.data.drivers);
      setFeedback({ type: 'success', message: 'Platform link removed.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Building2 size={14} className="text-fleet-400" />
          Link Driver to Platform
        </p>

        <SelectField
          label="Driver"
          value={driverId}
          onChange={(v) => { setDriverId(v); setFeedback(null); }}
          placeholder="Select driver..."
          options={drivers.map((d) => ({ value: d.id, label: d.name }))}
        />

        <SelectField
          label="Platform / Agent"
          value={agentId}
          onChange={setAgentId}
          placeholder="Select platform..."
          options={agents.map((a) => ({ value: a.id, label: a.name }))}
        />

        {/* Currently linked agents for selected driver */}
        {selectedDriver && selectedDriver.driverAgents && selectedDriver.driverAgents.length > 0 && (
          <div>
            <p className="label">Currently Linked Platforms</p>
            <div className="flex flex-wrap gap-2">
              {selectedDriver.driverAgents.map((da) => (
                <div
                  key={da.agent.id}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium px-2.5 py-1.5 rounded-lg"
                >
                  <Building2 size={11} className="text-fleet-400" />
                  {da.agent.name}
                  <button
                    onClick={() => handleRemove(da.agent.id)}
                    disabled={loading === da.agent.id}
                    className="text-slate-600 hover:text-rose-400 transition-colors ml-0.5"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {feedback && <Alert type={feedback.type} message={feedback.message} />}

        <button
          onClick={handleAssign}
          disabled={loading === 'assign' || !driverId || !agentId}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Link size={14} />
          {loading === 'assign' ? 'Linking...' : 'Link to Platform'}
        </button>
      </div>

      {/* Full N:M matrix view */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <p className="text-sm font-semibold text-slate-300">Driver–Platform Matrix</p>
          <p className="text-xs text-slate-600 mt-0.5">All active driver-to-platform associations</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/40">
              <th className="table-th">Driver</th>
              <th className="table-th">Linked Platforms</th>
              <th className="table-th">Associations</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={3} className="table-td text-slate-600 text-center py-8">
                  No drivers registered yet
                </td>
              </tr>
            ) : (
              drivers.map((d) => (
                <tr key={d.id} className="table-row">
                  <td className="table-td font-medium text-slate-200">{d.name}</td>
                  <td className="table-td">
                    {d.driverAgents && d.driverAgents.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {d.driverAgents.map((da) => (
                          <span
                            key={da.agent.id}
                            className="badge-active text-[11px]"
                          >
                            {da.agent.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 italic text-xs">No platforms linked</span>
                    )}
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs text-slate-500">
                      {d.driverAgents?.length ?? 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
const tabs: { id: MatrixTab; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'car-assignment',
    label: 'Vehicle Assignment',
    icon: CarIcon,
    description: 'Assign vehicles to drivers',
  },
  {
    id: 'agent-assignment',
    label: 'Platform Linking',
    icon: Building2,
    description: 'Link drivers to booking platforms',
  },
];

export default function AssignmentMatrix() {
  const [activeTab, setActiveTab] = useState<MatrixTab>('car-assignment');
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-100">Assignment Matrix</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage driver–vehicle and driver–platform relationships
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
              activeTab === id
                ? 'bg-fleet-500/15 border-fleet-500/30 text-fleet-300'
                : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
            }`}
          >
            <Icon size={16} />
            <div className="text-left">
              <p>{label}</p>
              <p className={`text-xs font-normal mt-0.5 ${activeTab === id ? 'text-fleet-400/70' : 'text-slate-600'}`}>
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {activeTab === 'car-assignment' && <CarAssignment />}
        {activeTab === 'agent-assignment' && <AgentAssignment />}
      </div>
    </div>
  );
}
