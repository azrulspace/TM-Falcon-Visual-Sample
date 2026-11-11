import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  action?: ToastAction;
}

interface ToastContextType {
  addToast: (
    type: ToastType,
    message: string,
    title?: string,
    options?: { action?: ToastAction }
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    type: ToastType,
    message: string,
    title?: string,
    options?: { action?: ToastAction }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title, action: options?.action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast_${toast.type}`} role="status">
            {toast.type === 'success' && <CheckCircle className="toast_icon" />}
            {toast.type === 'info' && <Info className="toast_icon" />}
            {toast.type === 'warning' && <AlertTriangle className="toast_icon" />}
            {toast.type === 'error' && <AlertCircle className="toast_icon" />}
            <div className="toast_body">
              {toast.title && <div className="toast_title">{toast.title}</div>}
              <div className="flex items-center gap-3 flex-wrap">
                <span>{toast.message}</span>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            </div>
            <button className="toast_close" aria-label="Close" onClick={() => removeToast(toast.id)}>
              <X />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
