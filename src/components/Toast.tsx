import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  key?: string;
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100',
    info: 'bg-blue-50 border-blue-100',
    warning: 'bg-orange-50 border-orange-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${bgColors[type]} min-w-[300px] pointer-events-auto`}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-bold text-gray-800">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="p-1 hover:bg-black/5 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: { id: string; type: ToastType; message: string }[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, type, message }) => (
          <Toast key={id} id={id} type={type} message={message} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
