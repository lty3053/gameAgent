import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './CyberToast.css';

// Toast 管理器
let toastId = 0;
let addToastHandler = null;

export const cyberToast = {
  success: (message) => addToastHandler?.({ type: 'success', message, id: ++toastId }),
  error: (message) => addToastHandler?.({ type: 'error', message, id: ++toastId }),
  warning: (message) => addToastHandler?.({ type: 'warning', message, id: ++toastId }),
  info: (message) => addToastHandler?.({ type: 'info', message, id: ++toastId }),
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast, onClose }) {
  const Icon = icons[toast.type];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <motion.div
      className={`cyber-toast cyber-toast-${toast.type}`}
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {/* 扫描线效果 */}
      <div className="toast-scanline" />
      
      {/* 闪烁边框 */}
      <div className="toast-border-glow" />
      
      {/* 图标 */}
      <div className="toast-icon-wrapper">
        <Icon size={22} className="toast-icon" />
        <div className="toast-icon-ring" />
      </div>
      
      {/* 内容 */}
      <div className="toast-content">
        <span className="toast-message">{toast.message}</span>
        <div className="toast-progress">
          <motion.div 
            className="toast-progress-bar"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </div>
      </div>
      
      {/* 关闭按钮 */}
      <button className="toast-close" onClick={() => onClose(toast.id)}>
        <X size={14} />
      </button>
      
      {/* 装饰角 */}
      <div className="toast-corner toast-corner-tl" />
      <div className="toast-corner toast-corner-tr" />
      <div className="toast-corner toast-corner-bl" />
      <div className="toast-corner toast-corner-br" />
    </motion.div>
  );
}

export function CyberToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastHandler = (toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    return () => {
      addToastHandler = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="cyber-toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default CyberToastContainer;
