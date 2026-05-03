import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDashboardStore } from '../../core/store/useDashboardStore';
import {
  LayoutDashboard,
  Radio,
  ClipboardList,
  Car,
  Wifi,
  WifiOff,
  History,
  Users2,
  BarChart3,
  Mail,
  Menu,
  X,
  CalendarClock,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/live-tracking', icon: Radio, label: 'Live Tracking' },
  { path: '/upcoming-trips', icon: CalendarClock, label: 'Upcoming Trips' },
  { path: '/data-entry', icon: ClipboardList, label: 'Data Entry' },
  { path: '/past-trips', icon: History, label: 'Past Trips' },
  { path: '/customers', icon: Users2, label: 'Customers' },
  { path: '/cost-analytics', icon: BarChart3, label: 'Cost Analytics' },
  { path: '/email-updates', icon: Mail, label: 'Email Updates' },
];

export default function Sidebar() {
  const location = useLocation();
  const { socketConnected, stats } = useDashboardStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close sidebar on navigation (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        id="mobile-menu-toggle"
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden w-10 h-10 rounded-lg bg-slate-900 border border-slate-800/60 flex items-center justify-center text-slate-300 hover:text-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop (mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-slate-950 border-r border-slate-800/60 flex flex-col z-50
          transition-transform duration-300 ease-in-out
          w-[260px]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-fleet-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Car size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-slate-100 leading-none">
                FleetOps
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Management Portal</p>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
            Operations
          </p>
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                className={isActive ? 'nav-item-active' : 'nav-item'}
              >
                <Icon size={17} />
                <span>{label}</span>
                {path === '/live-tracking' && stats && stats.trips.active > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {stats.trips.active}
                  </span>
                )}
                {path === '/upcoming-trips' && stats && stats.trips.scheduled > 0 && (
                  <span className="ml-auto bg-fleet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {stats.trips.scheduled}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Connection status */}
        <div className="px-4 py-4 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-900/60">
            {socketConnected ? (
              <>
                <span className="dot-free flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-400">Live Stream Active</p>
                  <p className="text-[10px] text-slate-600">Real-time telemetry connected</p>
                </div>
                <Wifi size={14} className="ml-auto text-emerald-500/50" />
              </>
            ) : (
              <>
                <span className="dot-offline flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Stream Offline</p>
                  <p className="text-[10px] text-slate-600">Reconnecting...</p>
                </div>
                <WifiOff size={14} className="ml-auto text-slate-600" />
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
