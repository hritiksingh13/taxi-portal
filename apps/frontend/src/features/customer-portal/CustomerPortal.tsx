import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../core/api.client';
import {
  MapPin,
  ArrowRight,
  Car,
  Building2,
  Calendar,
  DollarSign,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
} from 'lucide-react';

interface PortalTrip {
  id: string;
  stops: string[];
  startTime: string;
  estimatedCompletion: string;
  startDate: string;
  endDate: string;
  status: string;
  advancePaid: number;
  fuelExpense: number;
  pendingAmount: number;
  shareToken: string;
  driver: { name: string; phoneNumber: string };
  agent: { name: string };
  customer?: { name: string; email?: string; phone: string } | null;
  feedback?: { id: string; stars: number; experience: string; reason?: string; createdAt: string } | null;
}

export default function CustomerPortal() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [trip, setTrip] = useState<PortalTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback form
  const [showFeedback, setShowFeedback] = useState(false);
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [experience, setExperience] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadTrip();
  }, [shareToken]);

  const loadTrip = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/public/trip/${shareToken}`);
      setTrip(res.data.data.trip);
    } catch (err: any) {
      setError(err.message || 'Trip not found');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (stars === 0) {
      setFeedbackStatus({ type: 'error', message: 'Please select a star rating.' });
      return;
    }
    if (!experience.trim()) {
      setFeedbackStatus({ type: 'error', message: 'Please describe your experience.' });
      return;
    }
    setSubmitting(true);
    setFeedbackStatus(null);
    try {
      await api.post('/public/feedback', {
        shareToken,
        stars,
        experience,
        reason: reason || undefined,
      });
      setFeedbackStatus({ type: 'success', message: 'Thank you for your feedback!' });
      setShowFeedback(false);
      loadTrip(); // Reload to show submitted feedback
    } catch (err: any) {
      setFeedbackStatus({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'Ended': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'Cancelled': return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
      default: return 'bg-fleet-500/15 text-fleet-300 border-fleet-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-fleet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-rose-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-100 mb-2">Trip Not Found</h1>
          <p className="text-slate-500 text-sm">{error || 'This link may be invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(40, 85, 255, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(40, 85, 255, 0.05) 0%, transparent 50%)',
      }}
    >
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-fleet-500 rounded-lg flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-slate-100">FleetOps</p>
            <p className="text-[10px] text-slate-500">Customer Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Trip Status Card */}
        <div className="card p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <h1 className="font-display text-lg font-bold text-slate-100">Trip Details</h1>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor(trip.status)}`}>
              {trip.status}
            </span>
          </div>

          {/* Route */}
          <div className="mb-5">
            <p className="label mb-2">Route</p>
            <div className="flex items-center gap-2 flex-wrap">
              {trip.stops.map((stop, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg">
                    <MapPin size={12} className={idx === 0 ? 'text-emerald-400' : idx === trip.stops.length - 1 ? 'text-fleet-400' : 'text-slate-500'} />
                    <span className="text-sm text-slate-200">{stop}</span>
                  </div>
                  {idx < trip.stops.length - 1 && <ArrowRight size={14} className="text-slate-600 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="label">Driver</p>
              <p className="text-sm text-slate-200 font-medium">{trip.driver.name}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Phone size={10} /> {trip.driver.phoneNumber}</p>
            </div>
            <div>
              <p className="label">Platform</p>
              <p className="text-sm text-slate-200 flex items-center gap-1"><Building2 size={12} /> {trip.agent.name}</p>
            </div>
            <div>
              <p className="label">Started</p>
              <p className="text-sm text-slate-200 flex items-center gap-1">
                <Calendar size={12} />
                {new Date(trip.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="label">End Date</p>
              <p className="text-sm text-slate-200 flex items-center gap-1">
                <Calendar size={12} />
                {new Date(trip.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="label">Start Time</p>
              <p className="text-sm text-slate-200 flex items-center gap-1">
                <Clock size={12} />
                {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {trip.customer && (
              <div>
                <p className="label">Customer</p>
                <p className="text-sm text-slate-200">{trip.customer.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="card p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h2 className="font-display text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-fleet-400" /> Payment Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Advance Paid</p>
              <p className="text-xl font-display font-bold text-emerald-400">₹{trip.advancePaid}</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Fuel Expense</p>
              <p className="text-xl font-display font-bold text-amber-400">₹{trip.fuelExpense}</p>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/15 rounded-lg p-4 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Pending</p>
              <p className="text-xl font-display font-bold text-rose-400">₹{trip.pendingAmount}</p>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="card p-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h2 className="font-display text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Feedback
          </h2>

          {trip.feedback ? (
            <div>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={20} className={i < trip.feedback!.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
                ))}
                <span className="ml-2 text-sm text-slate-400">{trip.feedback.stars}/5</span>
              </div>
              <p className="text-sm text-slate-300 bg-slate-800/40 rounded-lg p-4">"{trip.feedback.experience}"</p>
              {trip.feedback.reason && (
                <p className="text-xs text-slate-500 mt-2">Reason: {trip.feedback.reason}</p>
              )}
              <p className="text-[10px] text-slate-600 mt-2">
                Submitted {new Date(trip.feedback.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : trip.status === 'Ended' ? (
            <>
              {!showFeedback ? (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Star size={15} /> Share Your Feedback
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Star Rating */}
                  <div>
                    <p className="label mb-2">Rating</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          onMouseEnter={() => setHoverStars(i + 1)}
                          onMouseLeave={() => setHoverStars(0)}
                          onClick={() => setStars(i + 1)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={
                              i < (hoverStars || stars)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700 hover:text-slate-600'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="label">Your Experience *</label>
                    <textarea
                      className="input-field resize-none"
                      rows={4}
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="How was your trip experience?"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="label">Reason (Optional)</label>
                    <input
                      className="input-field"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Any specific reason for your rating?"
                    />
                  </div>

                  {feedbackStatus && (
                    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium ${
                      feedbackStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {feedbackStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      {feedbackStatus.message}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={submitFeedback} disabled={submitting} className="btn-primary flex items-center gap-2 flex-1">
                      <Send size={14} />
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                    <button onClick={() => setShowFeedback(false)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Feedback will be available once the trip is completed.</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 mt-12 py-6 text-center">
        <p className="text-[10px] text-slate-600">Powered by FleetOps · Taxi Fleet Management</p>
      </footer>
    </div>
  );
}
