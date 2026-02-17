import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

const Toast = ({ id, type, title, message, onClose }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // Auto close after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => onClose(id), 300); // Wait for exit animation
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const styles = {
    success: "border-l-4 border-green-500 bg-green-50 dark:bg-zinc-900 dark:border-green-500",
    error: "border-l-4 border-red-500 bg-red-50 dark:bg-zinc-900 dark:border-red-500",
    warning: "border-l-4 border-yellow-500 bg-yellow-50 dark:bg-zinc-900 dark:border-yellow-500",
    info: "border-l-4 border-blue-500 bg-blue-50 dark:bg-zinc-900 dark:border-blue-500",
  }[type] || styles.info;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isRemoving ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
        flex items-start gap-4 p-4 mb-3 rounded-lg shadow-lg bg-card border border-border min-w-[320px] max-w-md pointer-events-auto
        ${styles}
        dark:bg-card dark:border dark:border-border
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type] || icons.info}</div>
      <div className="flex-1">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title = "") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message, title }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast("success", message, title),
    error: (message, title) => addToast("error", message, title),
    warning: (message, title) => addToast("warning", message, title),
    info: (message, title) => addToast("info", message, title),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
