export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty-state" role="status">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state-title">{title || "Nothing here"}</h3>
      {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAction}
          style={{ marginTop: "16px" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

