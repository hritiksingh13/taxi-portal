import { useState } from 'react';
import { Wallet, Users, Building2 } from 'lucide-react';
import DriverPayroll from './DriverPayroll';
import OfficeRent from './OfficeRent';

type Tab = 'driver' | 'office';

export default function PayrollDashboard() {
  const [tab, setTab] = useState<Tab>('driver');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-fleet-500/15 border border-fleet-500/20 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-fleet-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-100">Payroll Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage driver salaries, leaves, advances and office expenses</p>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('driver')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            tab === 'driver'
              ? 'bg-fleet-500/15 border-fleet-500/30 text-fleet-300'
              : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          <Users size={16} />
          Driver Payroll
        </button>
        <button
          onClick={() => setTab('office')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
            tab === 'office'
              ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
              : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
          }`}
        >
          <Building2 size={16} />
          Office Rent
        </button>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl">
        {tab === 'driver' ? <DriverPayroll /> : <OfficeRent />}
      </div>
    </div>
  );
}
