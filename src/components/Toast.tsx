import React, { useState, useCallback, createContext, useContext } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = Date.now().toString();
      const toast: ToastMessage = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-900/80',
          border: 'border-emerald-700/50',
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
        };
      case 'error':
        return {
          bg: 'bg-red-900/80',
          border: 'border-red-700/50',
          icon: AlertCircle,
          iconColor: 'text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-amber-900/80',
          border: 'border-amber-700/50',
          icon: AlertCircle,
          iconColor: 'text-amber-400',
        };
      default:
        return {
          bg: 'bg-blue-900/80',
          border: 'border-blue-700/50',
          icon: Info,
          iconColor: 'text-blue-400',
        };
    }
  };

  const styles = getStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`${styles.bg} backdrop-blur-xl border ${styles.border} rounded-lg p-4 shadow-2xl flex items-start gap-3 pointer-events-auto animate-in slide-in-from-right fade-in duration-300`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
      <p className="text-white text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
