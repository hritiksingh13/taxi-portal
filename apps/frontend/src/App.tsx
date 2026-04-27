import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './shared/components/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import LiveTrackingHub from './features/live-tracking/LiveTrackingHub';
import DataEntryPortal from './features/data-entry/DataEntryPortal';
import AssignmentMatrix from './features/assignment-matrix/AssignmentMatrix';
import { socket } from './core/socket.client';
import { useDashboardStore } from './core/store/useDashboardStore';
import { api } from './core/api.client';

export default function App() {
  const { addTrip, removeTrip, updateDriver, setSocketConnected } = useDashboardStore();

  useEffect(() => {
    // Preload global data
    const loadInitialData = async () => {
      try {
        const [statsRes, tripsRes, driversRes, carsRes, agentsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/trips/active'),
          api.get('/drivers'),
          api.get('/cars'),
          api.get('/agents'),
        ]);
        const { setStats, setActiveTrips, setDrivers, setCars, setAgents } =
          useDashboardStore.getState();
        setStats(statsRes.data.data);
        setActiveTrips(tripsRes.data.data.trips);
        setDrivers(driversRes.data.data.drivers);
        setCars(carsRes.data.data.cars);
        setAgents(agentsRes.data.data.agents);
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
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-tracking" element={<LiveTrackingHub />} />
          <Route path="/data-entry" element={<DataEntryPortal />} />
          <Route path="/assignments" element={<AssignmentMatrix />} />
        </Routes>
      </main>
    </div>
  );
}
