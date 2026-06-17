export default function StatCard({ label, value, helper, tone = 'neutral' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        <i aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      {helper && <p>{helper}</p>}
    </div>
  );
}
