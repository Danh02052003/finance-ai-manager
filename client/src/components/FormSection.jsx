const FormSection = ({ label, title, children }) => (
  <section className="card form-card">
    <p className="card-label">{label}</p>
    <h3>{title}</h3>
    <div className="form-stack">{children}</div>
  </section>
);

export default FormSection;
