import React from "react";
import { useUIStore } from "../../store/useUIStore";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const Toast: React.FC = () => {
  const { toastMessage, hideToast } = useUIStore();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const bgStyles = {
    success: "bg-slate-900/90 border-emerald-500/30 text-emerald-100",
    error: "bg-slate-900/90 border-rose-500/30 text-rose-100",
    info: "bg-slate-900/90 border-blue-500/30 text-blue-100",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${bgStyles[toastMessage.type]}`}>
        {icons[toastMessage.type]}
        <span className="text-sm font-medium">{toastMessage.text}</span>
        <button onClick={hideToast} className="p-1 rounded-lg hover:bg-white/10 transition-colors ml-2">
          <X className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>
      </div>
    </div>
  );
};
