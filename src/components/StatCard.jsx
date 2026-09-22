export default function StatCard({ label, value, color, icon }) {
  const accentColor = color || "var(--primary)";
  return (
    <div
      className="stat-card"
      style={{ "--card-accent-color": accentColor }}
      role="status"
    >
      <div className="stat-card-icon" style={{ color: accentColor, background: `${accentColor}18` }}>
        {icon}
      </div>
      <div className="stat-card-info">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
    </div>
  );
}

