import { X, Printer } from 'lucide-react';

interface SalarySlipDialogProps {
  open: boolean;
  onClose: () => void;
  html: string;
  driverName?: string;
}

export default function SalarySlipDialog({ open, onClose, html, driverName }: SalarySlipDialogProps) {
  if (!open || !html) return null;

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-800/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div>
            <h3 className="font-display font-bold text-slate-100 text-sm">Salary Slip Preview</h3>
            {driverName && <p className="text-xs text-slate-500 mt-0.5">{driverName}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Slip Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div
            className="bg-white rounded-xl p-6 shadow-inner"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-800/60 bg-slate-900/80">
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Printer size={14} />
            Print / Download PDF
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
