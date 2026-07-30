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
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      // O corpo do toast não captura clique: mesmo que passe por cima de algum
      // botão, o clique atravessa. Só o × é clicável.
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${bgColors[type]} min-w-[300px] max-w-[420px] pointer-events-none`}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-bold text-gray-800">{message}</p>
      <button
        onClick={() => onClose(id)}
        aria-label="Fechar aviso"
        className="p-1 hover:bg-black/5 rounded-lg transition-colors text-gray-400 hover:text-gray-600 pointer-events-auto"
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
    /*
     * Topo-centro, logo abaixo da barra superior (que termina em ~52px).
     * Antes ficava em `bottom-8 right-8`, exatamente sobre a barra de ação das
     * telas de detalhe — o toast cobria APROVAR/REPROVAR/DEVOLVER e engolia o
     * clique por 5s. Aqui não há botão em nenhuma tela: o cabeçalho de página
     * alinha as ações à direita (x ≥ 1144 a 1500px) e as barras de ação ficam
     * no rodapé.
     */
    <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, type, message }) => (
          <Toast key={id} id={id} type={type} message={message} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
