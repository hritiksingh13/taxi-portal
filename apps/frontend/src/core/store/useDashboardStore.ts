// apps/frontend/src/core/store/useDashboardStore.ts
import { create } from 'zustand';

export interface Trip {
  id: string;
  currentLocation: string;
  destination: string;
  startTime: string;
  estimatedCompletion: string;
  driver: { id: string; name: string; phoneNumber: string; status: string; car?: any };
  agent: { id: string; name: string };
}

export interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'Free' | 'Busy' | 'Offline';
  car?: { id: string; brand: string; licensePlate: string; status: string } | null;
  driverAgents?: { agent: { id: string; name: string }; assignedAt: string }[];
  trips?: Trip[];
  createdAt: string;
}

export interface Car {
  id: string;
  brand: string;
  licensePlate: string;
  transmissionType: 'Automatic' | 'Manual';
  status: 'Active' | 'Maintenance';
  drivers?: Partial<Driver>[];
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  contactDetails: string;
  driverAgents?: { driver: Partial<Driver>; assignedAt: string }[];
  _count?: { trips: number };
  createdAt: string;
}

export interface DashboardStats {
  cars: { total: number; active: number; maintenance: number };
  drivers: { total: number; free: number; busy: number; offline: number };
  agents: { total: number };
  trips: { active: number };
}

interface DashboardStore {
  stats: DashboardStats | null;
  activeTrips: Trip[];
  drivers: Driver[];
  cars: Car[];
  agents: Agent[];
  socketConnected: boolean;

  setStats: (stats: DashboardStats) => void;
  setActiveTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  removeTrip: (tripId: string) => void;
  setDrivers: (drivers: Driver[]) => void;
  updateDriver: (driver: Driver) => void;
  setCars: (cars: Car[]) => void;
  setAgents: (agents: Agent[]) => void;
  setSocketConnected: (connected: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  activeTrips: [],
  drivers: [],
  cars: [],
  agents: [],
  socketConnected: false,

  setStats: (stats) => set({ stats }),
  setActiveTrips: (trips) => set({ activeTrips: trips }),

  addTrip: (trip) =>
    set((state) => ({
      activeTrips: [trip, ...state.activeTrips],
      stats: state.stats
        ? {
            ...state.stats,
            drivers: {
              ...state.stats.drivers,
              free: Math.max(0, state.stats.drivers.free - 1),
              busy: state.stats.drivers.busy + 1,
            },
            trips: { active: state.stats.trips.active + 1 },
          }
        : null,
    })),

  removeTrip: (tripId) =>
    set((state) => ({
      activeTrips: state.activeTrips.filter((t) => t.id !== tripId),
      stats: state.stats
        ? {
            ...state.stats,
            drivers: {
              ...state.stats.drivers,
              free: state.stats.drivers.free + 1,
              busy: Math.max(0, state.stats.drivers.busy - 1),
            },
            trips: { active: Math.max(0, state.stats.trips.active - 1) },
          }
        : null,
    })),

  setDrivers: (drivers) => set({ drivers }),
  updateDriver: (driver) =>
    set((state) => ({
      drivers: state.drivers.map((d) => (d.id === driver.id ? driver : d)),
    })),
  setCars: (cars) => set({ cars }),
  setAgents: (agents) => set({ agents }),
  setSocketConnected: (connected) => set({ socketConnected: connected }),
}));
