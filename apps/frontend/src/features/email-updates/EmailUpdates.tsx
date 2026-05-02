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
  Eye,
  Edit3,
  Monitor,
  Smartphone,
  Layout,
  Plus,
  Save,
  FileCode
} from 'lucide-react';
import { FormInput } from '../../shared/components/ui/Form';
import { TEMPLATES, EmailTemplate } from './emailTemplates';

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium animate-fade-up ${type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Custom Templates State
  const [customTemplates, setCustomTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('fleetops_custom_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const emailableCustomers = customers.filter((c) => c.email);

  const saveCustomTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTpl: EmailTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      icon: FileCode,
      subject: subject,
      body: body,
    };
    const updated = [newTpl, ...customTemplates];
    setCustomTemplates(updated);
    localStorage.setItem('fleetops_custom_templates', JSON.stringify(updated));
    setShowCreateModal(false);
    setNewTemplateName('');
    setFeedback({ type: 'success', message: 'Template saved to your collection!' });
  };

  const deleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this custom template?')) return;
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    localStorage.setItem('fleetops_custom_templates', JSON.stringify(updated));
  };

  const allTemplates = [...customTemplates, ...TEMPLATES];

  const toggleRecipient = (email: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const selectAll = () => {
    setSelectedRecipients(emailableCustomers.map((c) => c.email!));
  };

  const clearAll = () => setSelectedRecipients([]);

  const applyTemplate = (template: EmailTemplate) => {
    if (body && !window.confirm('Replace current email content with template?')) return;
    setSubject(template.subject);
    setBody(template.body.trim());
  };

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fleet-500/20 flex items-center justify-center text-fleet-400">
              <Mail size={24} />
            </div>
            Email Campaigns
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-13">Design and broadcast premium updates to your fleet audience</p>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800/60 self-start md:self-auto">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'edit' ? 'bg-fleet-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Edit3 size={14} /> Editor
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'preview' ? 'bg-fleet-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Eye size={14} /> Live Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Editor */}
        <div className={`lg:col-span-7 space-y-6 ${viewMode === 'preview' ? 'hidden lg:block' : ''}`}>
          <div className="card p-6 overflow-visible">
            <div className="space-y-6">
              {/* Templates Bar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quick Templates</label>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 text-[10px] text-fleet-400 font-bold hover:text-fleet-300 transition-colors"
                  >
                    <Plus size={12} /> SAVE CURRENT AS TEMPLATE
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {allTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-fleet-500/50 hover:bg-fleet-500/5 transition-all group relative"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-fleet-400">
                        <t.icon size={16} />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{t.name}</span>
                      {t.id.startsWith('custom-') && (
                        <button
                          onClick={(e) => deleteCustomTemplate(t.id, e)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div className="relative">
                <label className="text-[10px] text-slate-500 uppercase block mb-2 font-bold tracking-wider">Recipients</label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                    {selectedRecipients.length === 0 ? (
                      <span className="text-xs text-slate-600 italic px-2 py-1">No recipients selected yet...</span>
                    ) : (
                      selectedRecipients.map((email) => {
                        const customer = customers.find((c) => c.email === email);
                        return (
                          <span key={email} className="flex items-center gap-1.5 bg-fleet-500/15 border border-fleet-500/20 text-fleet-300 text-xs px-2.5 py-1 rounded-lg animate-fade-in">
                            {customer?.name || email}
                            <button onClick={() => toggleRecipient(email)} className="text-fleet-400/60 hover:text-fleet-300"><X size={10} /></button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-300 text-sm hover:border-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-2"><Users2 size={16} className="text-slate-500" /> {selectedRecipients.length ? `Update selection (${selectedRecipients.length})` : 'Browse Customers'}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showPicker && (
                    <div className="absolute z-10 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fade-up">
                      <div className="p-2 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/30">
                        <span className="text-[10px] text-slate-500 uppercase font-bold ml-2">Select Customers</span>
                        <div className="flex gap-4 mr-2">
                          <button onClick={selectAll} className="text-[10px] text-fleet-400 font-bold hover:text-fleet-300">SELECT ALL</button>
                          <button onClick={clearAll} className="text-[10px] text-rose-400 font-bold hover:text-rose-300">CLEAR ALL</button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                        {emailableCustomers.length === 0 ? (
                          <p className="text-xs text-slate-600 text-center py-8">No customers with email addresses found.</p>
                        ) : (
                          emailableCustomers.map((c) => (
                            <label key={c.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${selectedRecipients.includes(c.email!) ? 'bg-fleet-500/10 border-fleet-500/20 border' : 'hover:bg-slate-800/40 border border-transparent'
                              }`}>
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(c.email!)}
                                onChange={() => toggleRecipient(c.email!)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-fleet-500 focus:ring-fleet-500/30"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{c.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject */}
              <FormInput
                label="Subject Line *"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Your Premium Trip Summary — FleetOps"
                className="bg-slate-950/30"
              />

              {/* Body */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase block font-bold tracking-wider">HTML Email Content *</label>
                <textarea
                  rows={14}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-950/30 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm font-mono focus:outline-none focus:border-fleet-500/50 transition-all resize-none scrollbar-thin"
                  placeholder="Paste your HTML here or use a template..."
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-600 italic">Supports full HTML, CSS inline styles, and responsive tags.</p>
                  <p className="text-[10px] text-slate-500">{body.length} characters</p>
                </div>
              </div>

              {feedback && <Alert type={feedback.type} message={feedback.message} />}

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-4 bg-fleet-500 hover:bg-fleet-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold transition-all shadow-xl shadow-fleet-500/10 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {sending ? 'Broadcasting...' : `Send Broadcast to ${selectedRecipients.length} Recipient${selectedRecipients.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Preview */}
        <div className={`lg:col-span-5 sticky top-8 ${viewMode === 'edit' ? 'hidden lg:block' : ''}`}>
          <div className="card overflow-hidden bg-slate-950/20 border-slate-800/40 min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <Eye size={16} className="text-fleet-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Live Preview</span>
              </div>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Monitor size={14} />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
              <div
                className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${previewDevice === 'mobile' ? 'w-[320px] h-[550px]' : 'w-full h-full min-h-[500px]'
                  }`}
              >
                {body.trim() ? (
                  <iframe
                    title="Email Preview"
                    srcDoc={body}
                    style={{ minHeight: 'inherit' }}
                    className="w-full h-full border-none"
                  />
                ) : (
                  <div
                    style={{ minHeight: 'inherit' }} className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                      <Layout size={32} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Your email preview will appear here</p>
                    <p className="text-slate-300 text-xs mt-2">Select a template or start typing HTML to begin</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 border-t border-slate-800/60">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Preview</span>
              </div>
              <p className="text-sm text-slate-100 font-medium truncate">{subject || '(No subject)'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-fleet-500/20 flex items-center justify-center text-fleet-400">
                  <Save size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-100">Save as Template</h2>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2">Template Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Monthly Newsletter"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-fleet-500/50 transition-all"
                />
              </div>
              <div className="p-4 bg-slate-950/30 rounded-xl border border-slate-800/40">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Capture Summary</p>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 truncate"><span className="text-slate-600">Subject:</span> {subject || '(No subject)'}</p>
                  <p className="text-xs text-slate-400 truncate"><span className="text-slate-600">Content:</span> {body.length} characters</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950/20 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomTemplate}
                disabled={!newTemplateName.trim()}
                className="flex-[2] py-2.5 bg-fleet-500 hover:bg-fleet-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-fleet-500/20"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
