import { useToast } from "../context/ToastContext";

export default function Toast() {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  const handleAction = () => {
    if (toast.onAction) {
      toast.onAction();
    }
    hideToast();
  };

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="toast-card">
        <span className="toast-message">{toast.message}</span>
        {toast.actionLabel && (
          <button
            type="button"
            className="toast-action-btn"
            onClick={handleAction}
          >
            {toast.actionLabel}
          </button>
        )}
        <button
          type="button"
          className="toast-close-btn"
          onClick={hideToast}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
