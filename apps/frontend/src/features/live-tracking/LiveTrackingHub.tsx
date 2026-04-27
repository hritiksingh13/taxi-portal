import React, { useState } from 'react';
import { useDashboardStore } from '../../core/store/useDashboardStore';
import { CountdownTimer } from './CountdownTimer';
import { api } from '../../core/api.client';
import {
  MapPin,
  ArrowRight,
  Building2,
  Car,
  CheckCircle,
  Navigation,
  Radio,
} from 'lucide-react';

export default function LiveTrackingHub() {
  const { activeTrips, removeTrip } = useDashboardStore();
  const [completing, setCompleting] = useState<string | null>(null);

  const handleComplete = async (tripId: string) => {
    setCompleting(tripId);
    try {
      await api.patch(`/trips/${tripId}/complete`);
      removeTrip(tripId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-bold text-slate-100">Live Operations Hub</h1>
            {activeTrips.length > 0 && (
              <span className="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
                <span className="dot-busy" style={{ width: 6, height: 6 }} />
                {activeTrips.length} Active
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">
            Real-time view of all drivers currently on active trips
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
          <Radio size={14} className="text-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-400">Live Telemetry</span>
        </div>
      </div>

      {activeTrips.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <Navigation size={28} className="text-slate-600" />
          </div>
          <p className="text-lg font-semibold text-slate-400">No Active Trips</p>
          <p className="text-sm text-slate-600 mt-1 max-w-xs">
            All drivers are currently free or offline. Start a trip from the Data Entry portal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTrips.map((trip, idx) => (
            <div
              key={trip.id}
              className="card p-5 hover:border-slate-700/80 transition-all duration-200 animate-slide-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Driver & vehicle info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-fleet-500/15 border border-fleet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-base font-bold text-fleet-400">
                      {trip.driver.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 text-sm">{trip.driver.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {trip.driver.car && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Car size={10} />
                          {trip.driver.car.brand}
                          <span className="font-mono text-slate-600">{trip.driver.car.licensePlate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Route */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                      <MapPin size={13} className="text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{trip.currentLocation}</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-600 flex-shrink-0" />
                    <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                      <MapPin size={13} className="text-fleet-400 flex-shrink-0" />
                      <span className="truncate">{trip.destination}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Building2 size={10} />
                      {trip.agent.name}
                    </span>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-500">
                      Started {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right: Timer & complete button */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <CountdownTimer estimatedCompletion={trip.estimatedCompletion} />
                  <button
                    onClick={() => handleComplete(trip.id)}
                    disabled={completing === trip.id}
                    className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 
                               bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 
                               px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-50"
                  >
                    <CheckCircle size={12} />
                    {completing === trip.id ? 'Completing...' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
