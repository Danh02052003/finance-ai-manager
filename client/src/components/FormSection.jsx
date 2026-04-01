const FormSection = ({ label, title, children }) => (
  <section className="rounded-[28px] border border-white/10 bg-(--surface-strong) p-5 shadow-lg shadow-slate-950/20">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
    <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
    <div className="mt-5">{children}</div>
  </section>
);

export default FormSection;
