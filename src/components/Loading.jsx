export default function Loading({ message = "Loading..." }) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
