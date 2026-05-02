// apps/frontend/src/core/store/useDashboardStore.ts
import { create } from 'zustand';

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  _count?: { trips: number };
  createdAt: string;
}

export interface Trip {
  id: string;
  stops: string[];
  startTime: string;
  estimatedCompletion: string | null;
  startDate: string;
  endDate: string | null;
  status: 'Scheduled' | 'Active' | 'Ended' | 'Cancelled';
  advancePaid: number;
  fuelExpense: number;
  pendingAmount: number;
  shareToken?: string;
  driver: { id: string; name: string; phoneNumber: string; status: string; car?: any };
  agent: { id: string; name: string };
  customer?: Customer | null;
  feedback?: Feedback | null;
}

export interface Feedback {
  id: string;
  stars: number;
  experience: string;
  reason?: string | null;
  createdAt: string;
  tripId: string;
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
  trips: { active: number; total: number };
  customers: { total: number };
  financials: { totalRevenue: number; totalFuelExpense: number; totalPending: number };
}

interface DashboardStore {
  stats: DashboardStats | null;
  activeTrips: Trip[];
  drivers: Driver[];
  cars: Car[];
  agents: Agent[];
  customers: Customer[];
  socketConnected: boolean;
  authenticated: boolean;

  setStats: (stats: DashboardStats) => void;
  setActiveTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  removeTrip: (tripId: string) => void;
  setDrivers: (drivers: Driver[]) => void;
  updateDriver: (driver: Driver) => void;
  setCars: (cars: Car[]) => void;
  setAgents: (agents: Agent[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setSocketConnected: (connected: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  activeTrips: [],
  drivers: [],
  cars: [],
  agents: [],
  customers: [],
  socketConnected: false,
  authenticated: localStorage.getItem('taxi_portal_auth') === 'true',

  setStats: (stats) => set({ stats }),
  setActiveTrips: (trips) => set({ activeTrips: trips }),

  addTrip: (trip) =>
    set((state) => {
      // Prevent adding duplicate trips if already added via API or Socket
      if (state.activeTrips.some((t) => t.id === trip.id)) {
        return state;
      }
      return {
        activeTrips: [trip, ...state.activeTrips],
        stats: state.stats
          ? {
              ...state.stats,
              drivers: {
                ...state.stats.drivers,
                free: Math.max(0, state.stats.drivers.free - 1),
                busy: state.stats.drivers.busy + 1,
              },
              trips: { ...state.stats.trips, active: state.stats.trips.active + 1 },
            }
          : null,
      };
    }),

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
            trips: { ...state.stats.trips, active: Math.max(0, state.stats.trips.active - 1) },
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
  setCustomers: (customers) => set({ customers }),
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  setAuthenticated: (auth) => set({ authenticated: auth }),
}));
