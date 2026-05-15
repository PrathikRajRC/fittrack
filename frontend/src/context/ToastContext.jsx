import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastCtx = createContext(null);

const TYPE_STYLE = {
  success: { bar: "#00ff9d", icon: "✓" },
  error:   { bar: "#ff4d6d", icon: "✕" },
  info:    { bar: "#00e5ff", icon: "ℹ" },
  warn:    { bar: "#ffd060", icon: "!" },
};

function ToastItem({ toast, onRemove }) {
  const s = TYPE_STYLE[toast.type] || TYPE_STYLE.info;
  return (
    <div className="toast" style={{ borderLeft: `3px solid ${s.bar}` }}>
      <span className="toast-icon" style={{ color: s.bar }}>{s.icon}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>✕</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const add = useCallback((message, type = "info", duration = 3200) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
