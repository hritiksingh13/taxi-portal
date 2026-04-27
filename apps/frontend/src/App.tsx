import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './shared/components/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import LiveTrackingHub from './features/live-tracking/LiveTrackingHub';
import DataEntryPortal from './features/data-entry/DataEntryPortal';
import PastTrips from './features/past-trips/PastTrips';
import CustomerManagement from './features/customer-management/CustomerManagement';
import CostAnalytics from './features/cost-analytics/CostAnalytics';
import EmailUpdates from './features/email-updates/EmailUpdates';
import CustomerPortal from './features/customer-portal/CustomerPortal';
import { socket } from './core/socket.client';
import { useDashboardStore } from './core/store/useDashboardStore';
import { api } from './core/api.client';

function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { addTrip, removeTrip, updateDriver, setSocketConnected } = useDashboardStore();
  const location = useLocation();

  // Check if we're on the public customer portal
  const isPortal = location.pathname.startsWith('/portal');

  useEffect(() => {
    if (isPortal) return; // Don't load manager data on public portal

    // Preload global data
    const loadInitialData = async () => {
      try {
        const [statsRes, tripsRes, driversRes, carsRes, agentsRes, customersRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/trips/active'),
          api.get('/drivers'),
          api.get('/cars'),
          api.get('/agents'),
          api.get('/customers'),
        ]);
        const { setStats, setActiveTrips, setDrivers, setCars, setAgents, setCustomers } =
          useDashboardStore.getState();
        setStats(statsRes.data.data);
        setActiveTrips(tripsRes.data.data.trips);
        setDrivers(driversRes.data.data.drivers);
        setCars(carsRes.data.data.cars);
        setAgents(agentsRes.data.data.agents);
        setCustomers(customersRes.data.data.customers);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();

    // Real-time socket events
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('telemetry:trip_started', (trip) => addTrip(trip));
    socket.on('telemetry:trip_completed', (trip) => removeTrip(trip.id));
    socket.on('telemetry:driver_updated', (driver) => updateDriver(driver));

    return () => {
      socket.off('telemetry:trip_started');
      socket.off('telemetry:trip_completed');
      socket.off('telemetry:driver_updated');
    };
  }, [isPortal]);

  // Public customer portal — no sidebar
  if (isPortal) {
    return (
      <Routes>
        <Route path="/portal/:shareToken" element={<CustomerPortal />} />
      </Routes>
    );
  }

  return (
    <ManagerLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live-tracking" element={<LiveTrackingHub />} />
        <Route path="/data-entry" element={<DataEntryPortal />} />
        <Route path="/past-trips" element={<PastTrips />} />
        <Route path="/customers" element={<CustomerManagement />} />
        <Route path="/cost-analytics" element={<CostAnalytics />} />
        <Route path="/email-updates" element={<EmailUpdates />} />
      </Routes>
    </ManagerLayout>
  );
}
