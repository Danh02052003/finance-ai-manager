const FormSection = ({ label, title, children }) => (
  <section className="rounded-2xl border border-white/[0.06] bg-(--surface-strong) p-5">
    {label ? <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p> : null}
    <h3 className="mt-1 text-base font-semibold text-white">{title}</h3>
    <div className="mt-4">{children}</div>
  </section>
);

export default FormSection;
