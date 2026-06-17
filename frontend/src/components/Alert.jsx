export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const label = type === 'success' ? 'Success' : type === 'error' ? 'Action needed' : 'Note';

  return (
    <div className={`alert alert-${type}`} role="alert">
      <div className="alert-copy">
        <strong>{label}</strong>
        <span>{message}</span>
      </div>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Close message" type="button">
          Close
        </button>
      )}
    </div>
  );
}
