import React, { useEffect, useState } from 'react';
import { api } from '../../core/api.client';
import { useDashboardStore, Trip } from '../../core/store/useDashboardStore';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Fuel,
  RefreshCw,
  CalendarRange,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/* ─── Theme tokens ─────────────────────────────────────────────── */
const CHART_COLORS = {
  revenue: '#2855ff',    // fleet-500
  expense: '#fbbf24',    // amber-400
  pending: '#fb7185',    // rose-400
  profit: '#34d399',     // emerald-400
  grid: '#1e293b',       // slate-800
  axis: '#64748b',       // slate-500
  tooltipBg: '#0f172a',  // slate-900
  tooltipBorder: '#1e293b',
};

const PIE_COLORS = ['#2855ff', '#fbbf24', '#fb7185', '#34d399', '#a78bfa'];

/* ─── Custom Tooltip ───────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2.5 shadow-xl text-xs"
      style={{
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.tooltipBorder,
      }}
    >
      <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-semibold text-slate-100 ml-auto">
            ₹{Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function TripTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2.5 shadow-xl text-xs"
      style={{
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.tooltipBorder,
      }}
    >
      <p className="font-semibold text-slate-300 mb-1">{label}</p>
      <p className="text-slate-100 font-semibold">{payload[0].value} trips</p>
    </div>
  );
}

/* ─── Stat Card ────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, prefix = '' }: {
  icon: React.ElementType; label: string; value: number | string; color: string; prefix?: string;
}) {
  return (
    <div className="stat-card animate-fade-up">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-slate-100">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────── */
type MonthRange = 3 | 6 | 12 | 0;
const MONTH_FILTERS: { value: MonthRange; label: string }[] = [
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
  { value: 0, label: 'All' },
];

export default function CostAnalytics() {
  const { stats } = useDashboardStore();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthRange, setMonthRange] = useState<MonthRange>(6);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips');
      setAllTrips(res.data.data.trips);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed analytics ──────────────────────────────────────────
  const totalRevenue = allTrips.reduce((sum, t) => sum + (t.advancePaid || 0), 0);
  const totalFuelExpense = allTrips.reduce((sum, t) => sum + (t.fuelExpense || 0), 0);
  const totalPending = allTrips.reduce((sum, t) => sum + (t.pendingAmount || 0), 0);
  const netProfit = totalRevenue - totalFuelExpense;

  // ── Group by month ──────────────────────────────────────────────
  const monthMap = new Map<string, { count: number; revenue: number; expense: number }>();
  allTrips.forEach((t) => {
    const date = new Date(t.startTime);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(key)) monthMap.set(key, { count: 0, revenue: 0, expense: 0 });
    const m = monthMap.get(key)!;
    m.count++;
    m.revenue += t.advancePaid || 0;
    m.expense += t.fuelExpense || 0;
  });

  const allMonthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [y, m] = key.split('-');
      const date = new Date(Number(y), Number(m) - 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        Revenue: val.revenue,
        Expenses: val.expense,
        trips: val.count,
      };
    });

  const revenueExpenseData = monthRange === 0
    ? allMonthData
    : allMonthData.slice(-monthRange);

  // ── Top drivers by revenue ──────────────────────────────────────
  const driverRevenue = new Map<string, { name: string; revenue: number; trips: number }>();
  allTrips.forEach((t) => {
    const name = t.driver?.name || 'Unknown';
    const id = t.driver?.id || 'unknown';
    if (!driverRevenue.has(id)) driverRevenue.set(id, { name, revenue: 0, trips: 0 });
    const d = driverRevenue.get(id)!;
    d.revenue += t.advancePaid || 0;
    d.trips++;
  });
  const topDrivers = Array.from(driverRevenue.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── Driver pie chart data ───────────────────────────────────────
  const driverPieData = topDrivers.map((d) => ({
    name: d.name,
    value: d.revenue,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Cost Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Financial overview of your fleet operations</p>
        </div>
        <button onClick={loadData} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ─── Summary Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Total Revenue" value={totalRevenue} color="bg-emerald-500/15 text-emerald-400" prefix="₹" />
        <StatCard icon={Fuel} label="Fuel Expenses" value={totalFuelExpense} color="bg-amber-500/15 text-amber-400" prefix="₹" />
        <StatCard icon={Wallet} label="Pending Amount" value={totalPending} color="bg-rose-500/15 text-rose-400" prefix="₹" />
        <StatCard icon={netProfit >= 0 ? TrendingUp : TrendingDown} label="Net Profit" value={netProfit} color={netProfit >= 0 ? 'bg-fleet-500/15 text-fleet-400' : 'bg-rose-500/15 text-rose-400'} prefix="₹" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Revenue vs Expenses (Bar Chart) ─────────────────── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <CalendarRange size={14} className="text-fleet-400" />
              Revenue vs Expenses
            </p>
            <div className="flex items-center bg-slate-800/70 rounded-lg p-0.5 border border-slate-700/40">
              {MONTH_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setMonthRange(value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                    monthRange === value
                      ? 'bg-fleet-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {revenueExpenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueExpenseData} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-slate-400 ml-1">{value}</span>}
                />
                <Bar dataKey="Revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Expenses" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>

        {/* ─── Trips Per Month (Area Chart) ────────────────────── */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-300 mb-4">Trips Per Month</p>
          {revenueExpenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueExpenseData}>
                <defs>
                  <linearGradient id="tripsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip content={<TripTooltip />} />
                <Area
                  type="monotone"
                  dataKey="trips"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  fill="url(#tripsGradient)"
                  dot={{ r: 4, fill: CHART_COLORS.revenue, stroke: CHART_COLORS.tooltipBg, strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: CHART_COLORS.revenue, strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>

        {/* ─── Revenue by Driver (Pie Chart) ───────────────────── */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-300 mb-4">Revenue by Driver</p>
          {driverPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={driverPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {driverPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div
                          className="rounded-lg border px-3 py-2 shadow-xl text-xs"
                          style={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder }}
                        >
                          <p className="font-semibold text-slate-200">{payload[0].name}</p>
                          <p className="text-slate-100 font-bold">₹{Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {driverPieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-slate-400 truncate flex-1">{d.name}</span>
                    <span className="text-xs font-semibold text-slate-200">₹{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>

        {/* ─── Quick Stats ─────────────────────────────────────── */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-300 mb-4">Quick Stats</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Trips</span>
              <span className="font-display font-bold text-slate-100">{allTrips.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Avg Revenue / Trip</span>
              <span className="font-display font-bold text-emerald-400">₹{allTrips.length ? Math.round(totalRevenue / allTrips.length) : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Avg Fuel / Trip</span>
              <span className="font-display font-bold text-amber-400">₹{allTrips.length ? Math.round(totalFuelExpense / allTrips.length) : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Profit Margin</span>
              <span className={`font-display font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalRevenue > 0 ? `${Math.round((netProfit / totalRevenue) * 100)}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Customers</span>
              <span className="font-display font-bold text-slate-100">{stats?.customers?.total ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
