import React, { useState } from 'react';
import { useDashboardStore } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  Car,
  Users,
  Building2,
  Navigation,
  Wrench,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="stat-card animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={17} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats, drivers, cars } = useDashboardStore();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/dashboard/stats');
      useDashboardStore.getState().setStats(res.data.data);
    } catch {}
    setRefreshing(false);
  };

  const recentDrivers = drivers.slice(0, 5);
  const recentCars = cars.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time overview of your taxi fleet operations
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      {stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatCard
              icon={Car}
              label="Total Vehicles"
              value={stats.cars.total}
              sub={`${stats.cars.active} active · ${stats.cars.maintenance} maintenance`}
              accent="bg-fleet-500/15 text-fleet-400"
            />
            <StatCard
              icon={Users}
              label="Total Drivers"
              value={stats.drivers.total}
              sub={`${stats.drivers.free} free · ${stats.drivers.busy} on trip`}
              accent="bg-emerald-500/15 text-emerald-400"
            />
            <StatCard
              icon={Building2}
              label="Platforms"
              value={stats.agents.total}
              sub="Registered aggregators"
              accent="bg-purple-500/15 text-purple-400"
            />
            <StatCard
              icon={Navigation}
              label="Active Trips"
              value={stats.trips.active}
              sub="Currently in progress"
              accent="bg-amber-500/15 text-amber-400"
            />
          </div>

          {/* Driver Availability Bar */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-300">Driver Availability</p>
              <p className="text-xs text-slate-500">{stats.drivers.total} total</p>
            </div>
            <div className="flex rounded-full overflow-hidden h-3 bg-slate-800 mb-3">
              {stats.drivers.total > 0 && (
                <>
                  <div
                    className="bg-emerald-500 transition-all duration-700"
                    style={{ width: `${(stats.drivers.free / stats.drivers.total) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-700"
                    style={{ width: `${(stats.drivers.busy / stats.drivers.total) * 100}%` }}
                  />
                  <div
                    className="bg-slate-700 transition-all duration-700"
                    style={{ width: `${(stats.drivers.offline / stats.drivers.total) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-5 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Free ({stats.drivers.free})
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Busy ({stats.drivers.busy})
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-700" />
                Offline ({stats.drivers.offline})
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-24" />
              <div className="h-8 bg-slate-800 rounded w-16 mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Drivers */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">Recent Drivers</p>
            <Users size={15} className="text-slate-500" />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="table-th">Name</th>
                <th className="table-th">Status</th>
                <th className="table-th">Phone</th>
              </tr>
            </thead>
            <tbody>
              {recentDrivers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-td text-slate-600 text-center py-8">
                    No drivers registered yet
                  </td>
                </tr>
              ) : (
                recentDrivers.map((d) => (
                  <tr key={d.id} className="table-row">
                    <td className="table-td font-medium text-slate-200">{d.name}</td>
                    <td className="table-td">
                      <span className={
                        d.status === 'Free' ? 'badge-free' :
                        d.status === 'Busy' ? 'badge-busy' : 'badge-offline'
                      }>
                        <span className={
                          d.status === 'Free' ? 'dot-free' :
                          d.status === 'Busy' ? 'dot-busy' : 'dot-offline'
                        } style={{ width: 6, height: 6 }} />
                        {d.status}
                      </span>
                    </td>
                    <td className="table-td text-slate-400">
                      {d.phoneNumber}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Recent Cars */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">Fleet Inventory</p>
            <Car size={15} className="text-slate-500" />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="table-th">Vehicle</th>
                <th className="table-th">Plate</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCars.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-td text-slate-600 text-center py-8">
                    No vehicles registered yet
                  </td>
                </tr>
              ) : (
                recentCars.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="table-td font-medium text-slate-200">{c.brand}</td>
                    <td className="table-td">
                      <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {c.licensePlate}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className={c.status === 'Active' ? 'badge-active' : 'badge-maintenance'}>
                        {c.status === 'Active' ? <CheckCircle2 size={10} /> : <Wrench size={10} />}
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
