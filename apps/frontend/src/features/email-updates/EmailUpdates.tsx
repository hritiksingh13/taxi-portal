import { useState } from 'react';
import { useDashboardStore } from '../../core/store/useDashboardStore';
import { api } from '../../core/api.client';
import {
  Mail,
  Send,
  Users2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
} from 'lucide-react';

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium animate-fade-up ${
      type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    }`}>
      {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

export default function EmailUpdates() {
  const { customers } = useDashboardStore();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  const emailableCustomers = customers.filter((c) => c.email);

  const toggleRecipient = (email: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const selectAll = () => {
    setSelectedRecipients(emailableCustomers.map((c) => c.email!));
  };

  const clearAll = () => setSelectedRecipients([]);

  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one recipient.' });
      return;
    }
    if (!subject.trim()) {
      setFeedback({ type: 'error', message: 'Subject is required.' });
      return;
    }
    if (!body.trim()) {
      setFeedback({ type: 'error', message: 'Email body is required.' });
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      await api.post('/email/send', {
        to: selectedRecipients,
        subject,
        body,
      });
      setFeedback({ type: 'success', message: `Email sent to ${selectedRecipients.length} recipient(s) successfully!` });
      setSubject('');
      setBody('');
      setSelectedRecipients([]);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-100">Email Updates</h1>
        <p className="text-slate-500 text-sm mt-1">Send email campaigns to your customers</p>
      </div>

      <div className="max-w-2xl">
        <div className="card p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-fleet-500/15 border border-fleet-500/20 flex items-center justify-center">
              <Mail size={18} className="text-fleet-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Compose Email</p>
              <p className="text-xs text-slate-500">Send updates to selected customers</p>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="label">Recipients</label>
            {selectedRecipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedRecipients.map((email) => {
                  const customer = customers.find((c) => c.email === email);
                  return (
                    <span key={email} className="flex items-center gap-1.5 bg-fleet-500/10 border border-fleet-500/20 text-fleet-300 text-xs px-2.5 py-1 rounded-lg">
                      {customer?.name || email}
                      <button onClick={() => toggleRecipient(email)} className="text-fleet-400/60 hover:text-fleet-300"><X size={10} /></button>
                    </span>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="btn-secondary text-sm w-full flex items-center justify-between"
            >
              <span className="flex items-center gap-2"><Users2 size={14} /> {selectedRecipients.length ? `${selectedRecipients.length} selected` : 'Select recipients...'}</span>
              <ChevronDown size={14} />
            </button>

            {showPicker && (
              <div className="mt-2 card p-3 max-h-48 overflow-y-auto space-y-1 animate-fade-up">
                {emailableCustomers.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4">No customers with email addresses found.</p>
                ) : (
                  <>
                    <div className="flex gap-2 mb-2 pb-2 border-b border-slate-800/40">
                      <button onClick={selectAll} className="text-[10px] text-fleet-400 font-medium">Select All</button>
                      <button onClick={clearAll} className="text-[10px] text-slate-500 font-medium">Clear</button>
                    </div>
                    {emailableCustomers.map((c) => (
                      <label key={c.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedRecipients.includes(c.email!)}
                          onChange={() => toggleRecipient(c.email!)}
                          className="rounded border-slate-700 text-fleet-500 focus:ring-fleet-500/30"
                        />
                        <div>
                          <p className="text-sm text-slate-200">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.email}</p>
                        </div>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="label">Subject *</label>
            <input
              className="input-field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your Trip Summary — FleetOps"
            />
          </div>

          {/* Body */}
          <div>
            <label className="label">Email Body *</label>
            <textarea
              className="input-field resize-none"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here... (supports HTML)"
            />
            <p className="text-[10px] text-slate-600 mt-1">Tip: You can use HTML tags for rich formatting.</p>
          </div>

          {feedback && <Alert type={feedback.type} message={feedback.message} />}

          <button
            onClick={handleSend}
            disabled={sending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Send size={15} />
            {sending ? 'Sending...' : `Send Email${selectedRecipients.length > 0 ? ` (${selectedRecipients.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
