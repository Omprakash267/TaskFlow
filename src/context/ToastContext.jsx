import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const { actionLabel = null, onAction = null, duration = 4000 } = options;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({
      id: Date.now(),
      message,
      actionLabel,
      onAction,
    });

    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
