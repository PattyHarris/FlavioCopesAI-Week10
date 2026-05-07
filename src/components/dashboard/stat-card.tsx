export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="card stat-card">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <p className="muted-copy">{detail}</p>
    </article>
  );
}
