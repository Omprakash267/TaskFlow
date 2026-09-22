export default function Header({ title, rightAction }) {
  return (
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      {rightAction && <div className="page-header-action">{rightAction}</div>}
    </header>
  );
}
