const StatCard = ({ label, value, hint }) => (
  <section className="card stat-card">
    <p className="card-label">{label}</p>
    <h3 className="stat-value">{value}</h3>
    {hint ? <p className="card-hint">{hint}</p> : null}
  </section>
);

export default StatCard;
