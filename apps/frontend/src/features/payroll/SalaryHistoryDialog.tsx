import { useState } from 'react';
import { api } from '../../core/api.client';
import {
  X, FileText, Mail, Printer, ArrowLeft, Receipt,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';

interface SalarySlip {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  totalLeaves: number;
  leaveDeduction: number;
  totalAdvances: number;
  netSalary: number;
  generatedAt: string;
}

interface SalaryHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  slips: SalarySlip[];
  driverId: string;
  driverName: string;
  driverHasEmail: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SalaryHistoryDialog({
  open,
  onClose,
  slips,
  driverId,
  driverName,
  driverHasEmail,
}: SalaryHistoryDialogProps) {
  const [slipHtml, setSlipHtml] = useState('');
  const [viewingSlip, setViewingSlip] = useState<SalarySlip | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!open) return null;

  const viewSlip = async (slip: SalarySlip) => {
    try {
      const res = await api.get(`/payroll/drivers/${driverId}/salary-slips/${slip.id}/download`, {
        responseType: 'text',
        transformResponse: [(data: string) => data],
      });
      setSlipHtml(res.data);
      setViewingSlip(slip);
    } catch (e: any) {
      setToast({ type: 'error', msg: e.message || 'Failed to load slip.' });
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(slipHtml);
      w.document.close();
      w.print();
    }
  };

  const emailSlip = async (slipId: string) => {
    setEmailingId(slipId);
    try {
      await api.post(`/payroll/drivers/${driverId}/salary-slips/${slipId}/send-email`);
      setToast({ type: 'success', msg: 'Payslip emailed to driver successfully.' });
    } catch (e: any) {
      setToast({ type: 'error', msg: e.message || 'Failed to send email.' });
    }
    setEmailingId(null);
    setTimeout(() => setToast(null), 4000);
  };

  const handleClose = () => {
    setSlipHtml('');
    setViewingSlip(null);
    setToast(null);
    onClose();
  };

  const goBack = () => {
    setSlipHtml('');
    setViewingSlip(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-800/60 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fade-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            {viewingSlip && (
              <button
                onClick={goBack}
                className="p-1.5 text-slate-400 hover:text-fleet-400 transition-colors rounded-lg hover:bg-slate-800"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h3 className="font-display font-bold text-slate-100 text-sm">
                {viewingSlip
                  ? `${MONTHS[viewingSlip.month - 1]} ${viewingSlip.year} — Salary Slip`
                  : 'Salary Slip History'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{driverName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-5 mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium animate-fade-up ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {toast.msg}
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-68px)]">
          {viewingSlip && slipHtml ? (
            <div className="space-y-4">
              <div
                className="bg-white rounded-xl p-6 shadow-inner"
                dangerouslySetInnerHTML={{ __html: slipHtml }}
              />
              <div className="flex gap-2">
                <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm">
                  <Printer size={14} />
                  Print / Download PDF
                </button>
                {driverHasEmail && (
                  <button
                    onClick={() => emailSlip(viewingSlip.id)}
                    disabled={emailingId === viewingSlip.id}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    {emailingId === viewingSlip.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Mail size={14} />
                    )}
                    Email to Driver
                  </button>
                )}
              </div>
            </div>
          ) : slips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                <Receipt size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1">No Salary Slips Generated</p>
              <p className="text-slate-600 text-sm">Generate a salary slip from the payroll tab first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slips.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-fleet-500/10 border border-fleet-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-fleet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200">
                        {MONTHS[s.month - 1]} {s.year}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Net: <span className="text-fleet-300 font-medium">₹{s.netSalary.toLocaleString('en-IN')}</span></span>
                        <span className="text-slate-700">·</span>
                        <span>Generated {new Date(s.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => viewSlip(s)}
                      className="p-2 text-slate-400 hover:text-fleet-400 rounded-lg hover:bg-slate-800 transition-all"
                      title="View slip"
                    >
                      <FileText size={14} />
                    </button>
                    {driverHasEmail && (
                      <button
                        onClick={() => emailSlip(s.id)}
                        disabled={emailingId === s.id}
                        className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-all"
                        title="Email to driver"
                      >
                        {emailingId === s.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Mail size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
