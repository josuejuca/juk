import "./globals.css";

export default function Loading() {
  return (
    <div
      className="app-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="app-spinner" aria-hidden="true" />
    </div>
  );
}
