export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="loader" aria-live="polite">
      <span className="loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
